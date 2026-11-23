'use client';

import { use, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { ChipFiltro } from '@/components/dafi/Chips';
import { AvisoEmergencias, Casilla, FilaOpcion } from '@/components/dafi/Piezas';
import { EstadoVacio } from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import { useAuth } from '@/context/AuthContext';
import { obtenerPerfil } from '@/services/perfilesService';
import type { Perfil } from '@/services/perfilesService';
import { listarEtiquetas, obtenerAviso } from '@/services/catalogosService';
import type { Etiqueta } from '@/services/catalogosService';
import { listarMiembros } from '@/services/familiasService';
import type { Miembro } from '@/services/familiasService';
import { crearConversacion } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { validarConversacion } from './validacion';
import type { ErroresConversacion } from './validacion';
import estilos from '@/components/dafi/Pantalla.module.css';
import acceso from '@/components/dafi/Acceso.module.css';

interface Datos {
  perfil: Perfil;
  etiquetas: Etiqueta[];
  medicos: Miembro[];
}

/** Pantalla 7: POST /api/v1/perfiles/{perfilId}/conversaciones */
function Contenido({ perfilId }: { perfilId: string }) {
  const router = useRouter();
  const { usuario } = useAuth();
  const familiaId = usuario?.familiaId;

  const [datos, setDatos] = useState<Datos | null>(null);
  const [aviso, setAviso] = useState<string | undefined>();
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [titulo, setTitulo] = useState('');
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [medicoId, setMedicoId] = useState('');
  const [prioridad, setPrioridad] = useState(false);
  const [errores, setErrores] = useState<ErroresConversacion>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Mismo patrón que el detalle de perfil: carga async y un contador de intentos.
  useEffect(() => {
    if (!familiaId) return;
    const control = new AbortController();
    let vigente = true;
    async function cargar() {
      setError(null);
      setNoEncontrado(false);
      try {
        const [perfil, catalogo, medicos] = await Promise.all([
          obtenerPerfil(perfilId, control.signal),
          listarEtiquetas(control.signal),
          listarMiembros(familiaId!, 'medico', control.signal),
        ]);
        if (!vigente) return;
        setDatos({ perfil, etiquetas: catalogo, medicos });
        // Con un solo médico en el círculo se deja elegido, como en el diseño.
        if (medicos.length === 1) setMedicoId(medicos[0].usuarioId);
      } catch (e) {
        if (!vigente || (e instanceof DOMException && e.name === 'AbortError')) return;
        if (e instanceof ApiError && e.esSesionInvalida) return;
        // Perfil inexistente, de otra familia o id mal formado: 404 en los tres casos.
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
  }, [perfilId, familiaId, intento]);

  // El aviso no bloquea la pantalla: si falla, AvisoEmergencias muestra el texto fijo.
  useEffect(() => {
    const control = new AbortController();
    obtenerAviso('emergencias', control.signal).then((a) => setAviso(a.texto), () => {});
    return () => control.abort();
  }, []);

  // El backend admite de 1 a 3 etiquetas; una cuarta no se deja marcar.
  function alternar(codigo: string) {
    setErrores((e) => ({ ...e, etiquetas: undefined }));
    setEtiquetas((prev) =>
      prev.includes(codigo) ? prev.filter((e) => e !== codigo) : prev.length >= 3 ? prev : [...prev, codigo]
    );
  }

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando || !datos) return;
    setErrorGeneral(null);
    const nuevos = validarConversacion({ titulo, etiquetas, medicoId });
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      // El botón está en la barra fija: se lleva la vista al primer error.
      requestAnimationFrame(() => {
        const campo = document.querySelector<HTMLInputElement>('#form-conversacion [aria-invalid="true"]');
        if (campo) campo.focus();
        else document.querySelector('#form-conversacion [role="alert"]')?.scrollIntoView({ block: 'center' });
      });
      return;
    }

    setEnviando(true);
    try {
      const creada = await crearConversacion(datos.perfil.id, {
        titulo: titulo.trim(),
        etiquetas,
        medicoId,
        prioridadIndicada: prioridad,
      });
      // enviando se queda en true: la pantalla se va y no debe aceptar otro envío.
      router.push(`/conversaciones/${creada.id}/borrador`);
    } catch (e) {
      // 409 y 422 se corrigen en este formulario: se muestran junto al botón (L-26).
      const deFormulario = e instanceof ApiError && (e.status === 409 || e.status === 422);
      setErrorGeneral(
        e instanceof ApiError && e.status === 422 ? `Revise los datos: ${e.message}.` : mensajeParaUsuario(e)
      );
      if (!deFormulario) await alertarError(e);
      setEnviando(false);
    }
  }

  if (noEncontrado) {
    return (
      <AppShell titulo="Nueva conversación" conVolver>
        <EstadoVacio
          icono="usuarios"
          titulo="Perfil no encontrado"
          texto="No existe o no pertenece a su familia."
          accion={<Button onClick={() => router.push('/perfiles')}>Volver a perfiles</Button>}
        />
      </AppShell>
    );
  }

  if (!datos) {
    return (
      <AppShell titulo="Nueva conversación" conVolver>
        {error ? (
          <div className={estilos.notaAviso} role="alert">
            <Icono nombre="alerta" tam={18} />
            <span className={estilos.notaCuerpo}>
              <span className="t-body-m-fuerte">No pudimos preparar la conversación</span>
              <span className={`${estilos.notaDetalle} t-body-s`}>{error}</span>
              <span>
                <Button size="sm" variant="secundario" onClick={() => setIntento((n) => n + 1)}>
                  Reintentar
                </Button>
              </span>
            </span>
          </div>
        ) : (
          <EsqueletoLista filas={2} mensaje="Cargando…" />
        )}
      </AppShell>
    );
  }

  // RF-09-AC-3: sin médicos en el círculo no se puede abrir una conversación.
  if (datos.medicos.length === 0) {
    return (
      <AppShell titulo="Nueva conversación" conVolver>
        <EstadoVacio
          icono="actividad"
          titulo="Agregue primero a un médico de su confianza"
          texto="Para abrir una conversación necesita al menos un médico en el círculo de su familia."
          accion={<Button onClick={() => router.push('/circulo')}>Invitar a un médico</Button>}
        />
      </AppShell>
    );
  }

  const { perfil } = datos;

  return (
    <AppShell
      titulo="Nueva conversación"
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
          <Button type="submit" form="form-conversacion" fullWidth loading={enviando} loadingText="Creando…">
            Crear borrador
          </Button>
        </div>
      }
    >
      <form id="form-conversacion" onSubmit={alEnviar} noValidate style={{ display: 'contents' }}>
        <p className={`${estilos.pastillaContexto} t-label`}>
          <Icono nombre="usuarios" tam={14} />
          Para {perfil.nombre} · {perfil.edadAnios} años
        </p>

        <AvisoEmergencias texto={aviso} />

        <Input
          label="Título de la conversación"
          placeholder="Por ejemplo: fiebre desde anoche"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          error={errores.titulo}
          required
        />

        <h2 className={`${estilos.rotulo} t-overline`} id="etiquetas">ETIQUETAS · DE 1 A 3</h2>
        <p className={`${estilos.apoyo} t-body-s`}>Definen qué preguntas de contexto se le harán.</p>
        <div className={estilos.listaChips} role="group" aria-labelledby="etiquetas">
          {datos.etiquetas.map((e) => (
            <ChipFiltro
              key={e.codigo}
              activo={etiquetas.includes(e.codigo)}
              onClick={() => alternar(e.codigo)}
              rolAria="checkbox"
            >
              {e.nombre}
            </ChipFiltro>
          ))}
        </div>
        {errores.etiquetas && (
          <p className={acceso.errorGeneral} role="alert">
            <Icono nombre="alerta" tam={16} />
            <span className="t-body-s">{errores.etiquetas}</span>
          </p>
        )}

        <h2 className={`${estilos.rotulo} t-overline`} id="medico">MÉDICO DEL CÍRCULO</h2>
        <div className={estilos.pila} role="radiogroup" aria-labelledby="medico">
          {datos.medicos.map((m) => (
            <FilaOpcion
              key={m.usuarioId}
              nombre={m.nombre}
              detalle={[m.especialidad, m.leyenda].filter(Boolean).join(' · ')}
              seleccionada={medicoId === m.usuarioId}
              onSelect={() => {
                setMedicoId(m.usuarioId);
                setErrores((e) => ({ ...e, medicoId: undefined }));
              }}
            />
          ))}
        </div>
        {errores.medicoId && (
          <p className={acceso.errorGeneral} role="alert">
            <Icono nombre="alerta" tam={16} />
            <span className="t-body-s">{errores.medicoId}</span>
          </p>
        )}

        <Casilla
          titulo="Necesito respuesta pronto"
          apoyo="Marca «Prioridad indicada por la familia». DAFI no evalúa la urgencia."
          checked={prioridad}
          onChange={setPrioridad}
        />
      </form>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaNuevaConversacion({ params }: { params: Promise<{ perfilId: string }> }) {
  const { perfilId } = use(params);
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido key={perfilId} perfilId={perfilId} />
    </RutaProtegida>
  );
}
