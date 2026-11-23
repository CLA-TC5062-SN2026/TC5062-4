'use client';

import { use, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { Avatar, FilaDato } from '@/components/dafi/Piezas';
import { EstadoVacio, TarjetaConversacion } from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { useAuth } from '@/context/AuthContext';
import { actualizarPerfil, borrarPerfil, obtenerPerfil } from '@/services/perfilesService';
import type { Perfil } from '@/services/perfilesService';
import { listarPorPerfil } from '@/services/conversacionesService';
import type { Conversacion } from '@/services/conversacionesService';
import { alertarError, confirmarAccion } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { validarPerfil } from '../nuevo/validacion';
import type { ErroresPerfil } from '../nuevo/validacion';
import { construirPatch } from './editar';
import estilos from '@/components/dafi/Pantalla.module.css';
import acceso from '@/components/dafi/Acceso.module.css';

const POR_PAGINA = 5;

const TIPO_LEGIBLE: Record<Perfil['tipo'], string> = {
  menor: 'Menor',
  propio: 'Perfil propio',
  adulto_representado: 'Adulto representado',
};

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });
const lista = (l: string[]) => (l.length ? l.join(', ') : 'Ninguna registrada');

/** Pantalla 6 y D3: GET /perfiles/{id} + /perfiles/{id}/conversaciones */
function Contenido({ perfilId }: { perfilId: string }) {
  const router = useRouter();
  const { usuario } = useAuth();
  // PATCH y DELETE sólo los admite el cuidador principal (403 para el cocuidador).
  const puedeEditar = usuario?.rol === 'cuidador_principal';

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [pagina, setPagina] = useState(1);
  const [historial, setHistorial] = useState<Conversacion[] | null>(null);
  const [total, setTotal] = useState(0);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: '', alergias: '', medicamentos: '' });
  const [errores, setErrores] = useState<ErroresPerfil>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Mismo patrón que /perfiles: la carga vive en una función async y un
  // contador de intentos vuelve a disparar el efecto.
  useEffect(() => {
    const control = new AbortController();
    let vigente = true;
    async function cargar() {
      setError(null);
      setNoEncontrado(false);
      try {
        const datos = await obtenerPerfil(perfilId, control.signal);
        if (vigente) setPerfil(datos);
      } catch (e) {
        if (!vigente || (e instanceof DOMException && e.name === 'AbortError')) return;
        if (e instanceof ApiError && e.esSesionInvalida) return;
        // Inexistente, de otra familia o id mal formado: el backend responde 404 en los tres casos.
        if (e instanceof ApiError && e.status === 404) return setNoEncontrado(true);
        setError(mensajeParaUsuario(e));
        if ((await alertarError(e, { reintentar: true })) && vigente) setIntento((n) => n + 1);
      }
    }
    void cargar();
    return () => {
      vigente = false;
      control.abort();
    };
  }, [perfilId, intento]);

  const cargado = perfil !== null;
  useEffect(() => {
    if (!cargado) return;
    const control = new AbortController();
    let vigente = true;
    async function cargar() {
      setHistorial(null);
      setErrorHistorial(null);
      try {
        const r = await listarPorPerfil(perfilId, { pagina, limite: POR_PAGINA }, control.signal);
        if (!vigente) return;
        // El backend ya ordena por último evento antes de paginar (L-29).
        setHistorial(r.datos);
        setTotal(r.paginacion.total);
      } catch (e) {
        if (!vigente || (e instanceof DOMException && e.name === 'AbortError')) return;
        if (e instanceof ApiError && e.esSesionInvalida) return;
        setErrorHistorial(mensajeParaUsuario(e));
      }
    }
    void cargar();
    return () => {
      vigente = false;
      control.abort();
    };
  }, [perfilId, cargado, pagina, intento]);

  function abrirEdicion() {
    if (!perfil) return;
    setForm({ nombre: perfil.nombre, alergias: perfil.alergias.join(', '), medicamentos: perfil.medicamentos.join(', ') });
    setErrores({});
    setErrorGeneral(null);
    setEditando(true);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!perfil || guardando) return;
    setErrorGeneral(null);
    // Se reutiliza la validación de «Nuevo perfil»; la fecha y el tipo no se editan aquí,
    // así que van los del perfil y `menor` para no exigir el correo de alta.
    const nuevos = validarPerfil({ ...form, tipo: 'menor', fechaNacimiento: perfil.fechaNacimiento, correo: '' });
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    const cambios = construirPatch(perfil, form);
    if (!Object.keys(cambios).length) return setEditando(false);

    setGuardando(true);
    try {
      setPerfil(await actualizarPerfil(perfil.id, cambios));
      setEditando(false);
    } catch (e) {
      const deFormulario = e instanceof ApiError && e.status === 422;
      setErrorGeneral(deFormulario ? `Revise los datos: ${(e as ApiError).message}.` : mensajeParaUsuario(e));
      if (!deFormulario) await alertarError(e);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!perfil) return;
    const n = total === 1 ? '1 conversación' : `${total} conversaciones`;
    // Texto fiel al DELETE del backend: borra en cascada consentimiento, permisos de
    // historial y conversaciones (con mensajes, respuestas, fotos e indicaciones).
    const ok = await confirmarAccion(
      `¿Borrar el perfil de ${perfil.nombre}?`,
      `Se borrarán para siempre el perfil y su historial: ${n} con sus mensajes, respuestas, fotos e indicaciones. ` +
        'No se borran su cuenta, su familia, los demás perfiles ni los médicos de su círculo. Esto no se puede deshacer.',
      'Sí, borrar el perfil'
    );
    if (!ok) return;
    try {
      await borrarPerfil(perfil.id);
      router.push('/perfiles');
    } catch (e) {
      await alertarError(e);
    }
  }

  if (noEncontrado) {
    return (
      <AppShell titulo="Perfil" conVolver>
        <EstadoVacio
          icono="usuarios"
          titulo="Perfil no encontrado"
          texto="No existe o no pertenece a su familia."
          accion={<Button onClick={() => router.push('/perfiles')}>Volver a perfiles</Button>}
        />
      </AppShell>
    );
  }

  if (!perfil) {
    return (
      <AppShell titulo="Perfil" conVolver>
        {error ? (
          <div className={estilos.notaAviso} role="alert">
            <Icono nombre="alerta" tam={18} />
            <span className={estilos.notaCuerpo}>
              <span className="t-body-m-fuerte">No pudimos cargar el perfil</span>
              <span className={`${estilos.notaDetalle} t-body-s`}>{error}</span>
              <span>
                <Button size="sm" variant="secundario" onClick={() => setIntento((n) => n + 1)}>
                  Reintentar
                </Button>
              </span>
            </span>
          </div>
        ) : (
          <EsqueletoLista filas={2} mensaje="Cargando el perfil…" />
        )}
      </AppShell>
    );
  }

  if (editando) {
    return (
      <AppShell
        titulo="Editar perfil"
        conVolver
        mostrarBarra={false}
        pie={
          <div className={estilos.barraAcciones}>
            {/* Junto al botón: siempre a la vista en un teléfono (L-26). */}
            {errorGeneral && (
              <p className={acceso.errorGeneral} role="alert">
                <Icono nombre="alerta" tam={16} />
                <span className="t-body-s">{errorGeneral}</span>
              </p>
            )}
            <Button type="submit" form="form-editar" fullWidth loading={guardando} loadingText="Guardando…">
              Guardar cambios
            </Button>
            <Button variant="secundario" fullWidth disabled={guardando} onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <form id="form-editar" onSubmit={guardar} noValidate style={{ display: 'contents' }}>
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            error={errores.nombre}
            required
          />
          <Input
            label="Alergias"
            placeholder="Separe con comas (hasta 30)"
            value={form.alergias}
            onChange={(e) => setForm({ ...form, alergias: e.target.value })}
            error={errores.alergias}
          />
          <Input
            label="Medicamentos de uso continuo"
            placeholder="Separe con comas (hasta 30)"
            value={form.medicamentos}
            onChange={(e) => setForm({ ...form, medicamentos: e.target.value })}
            error={errores.medicamentos}
          />
        </form>
      </AppShell>
    );
  }

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const meta = `${TIPO_LEGIBLE[perfil.tipo]} · ${perfil.edadAnios} años`;

  return (
    <AppShell
      titulo={perfil.nombre}
      conVolver
      accion={puedeEditar ? { icono: 'lapiz', etiqueta: 'Editar el perfil', onClick: abrirEdicion } : undefined}
    >
      <div className={estilos.columnas}>
        <div className={estilos.principal}>
          <h2 className={`${estilos.rotulo} t-overline`}>
            HISTORIAL · {total} {total === 1 ? 'CONVERSACIÓN' : 'CONVERSACIONES'}
          </h2>
          {errorHistorial ? (
            <div className={estilos.notaAviso} role="alert">
              <Icono nombre="alerta" tam={18} />
              <span className={estilos.notaCuerpo}>
                <span className="t-body-m-fuerte">No pudimos cargar el historial</span>
                <span className={`${estilos.notaDetalle} t-body-s`}>{errorHistorial}</span>
                <span>
                  <Button size="sm" variant="secundario" onClick={() => setIntento((n) => n + 1)}>
                    Reintentar
                  </Button>
                </span>
              </span>
            </div>
          ) : !historial ? (
            <EsqueletoLista filas={2} mensaje="Cargando el historial…" />
          ) : historial.length === 0 ? (
            <EstadoVacio
              icono="mensaje"
              titulo="Sin conversaciones todavía"
              texto="Aquí aparecerán las conversaciones con su médico sobre este perfil."
            />
          ) : (
            <>
              {historial.map((c) => (
                <TarjetaConversacion
                  key={c.id}
                  contexto={meta}
                  titulo={c.titulo}
                  estado={c.estado}
                  etiquetas={c.etiquetas as CodigoEtiqueta[]}
                  prioridad={c.prioridadIndicada}
                  autor={c.medico?.nombre ?? 'Sin médico'}
                  cuando={fecha(c.ultimoEventoEn)}
                  onClick={() => router.push(`/conversaciones/${c.id}${c.estado === 'BORRADOR' ? '/borrador' : ''}`)}
                />
              ))}
              {paginas > 1 && (
                <nav className={estilos.cabeceraSeccion} aria-label="Páginas del historial">
                  <Button size="sm" variant="secundario" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
                    Anterior
                  </Button>
                  <span className={`${estilos.apoyo} t-label`}>Página {pagina} de {paginas}</span>
                  <Button size="sm" variant="secundario" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>
                    Siguiente
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>

        <aside className={estilos.lateral}>
          <div className={estilos.tarjeta}>
            <div className={estilos.identidad}>
              <Avatar nombre={perfil.nombre} />
              <div className={estilos.identidadTextos}>
                <p className={`${estilos.identidadNombre} t-heading-m`}>{perfil.nombre}</p>
                <p className={`${estilos.identidadMeta} t-body-s`}>
                  {meta} · {perfil.estado === 'activo' ? 'perfil activo' : 'pendiente de consentimiento'}
                </p>
              </div>
            </div>
            <FilaDato clave="Fecha de nacimiento" valor={perfil.fechaNacimiento} />
            <FilaDato clave="Alergias" valor={lista(perfil.alergias)} />
            <FilaDato clave="Medicamentos" valor={lista(perfil.medicamentos)} />
            <FilaDato clave="Resumen de contexto" valor={perfil.resumenActivo ? 'Activado' : 'Desactivado'} />
          </div>

          <Button fullWidth onClick={() => router.push(`/perfiles/${perfil.id}/conversaciones/nueva`)}>
            Nueva conversación
          </Button>
          {puedeEditar && (
            <>
              <Button variant="secundario" fullWidth onClick={abrirEdicion}>Editar perfil</Button>
              <Button variant="fantasma" fullWidth onClick={borrar}>Borrar perfil</Button>
            </>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaPerfil({ params }: { params: Promise<{ perfilId: string }> }) {
  const { perfilId } = use(params);
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      {/* key: al cambiar de perfil se reinicia todo el estado de la pantalla. */}
      <Contenido key={perfilId} perfilId={perfilId} />
    </RutaProtegida>
  );
}
