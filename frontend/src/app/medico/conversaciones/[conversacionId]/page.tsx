'use client';

import { use, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell, { NAV_MEDICO } from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { ChipEstado, ChipEtiqueta, ChipFiltro, MarcaPrioridad } from '@/components/dafi/Chips';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { FilaDato } from '@/components/dafi/Piezas';
import { EstadoVacio } from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import { useAuth } from '@/context/AuthContext';
import { listarEventos, obtenerConversacion, registrarIndicacion } from '@/services/conversacionesService';
import type { Decision, DetalleConversacion, Evento } from '@/services/conversacionesService';
import { obtenerPerfil } from '@/services/perfilesService';
import type { Perfil } from '@/services/perfilesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { CajaMensaje, ListaEventos, RespuestasContexto } from '@/app/conversaciones/[conversacionId]/piezasHilo';
import { cuerpoIndicacion, DECISIONES, MAX_INDICACION, motivoSinIndicacion, validarIndicacion } from './indicacion';
import type { ErroresIndicacion } from './indicacion';
import estilos from '@/components/dafi/Pantalla.module.css';
import acceso from '@/components/dafi/Acceso.module.css';
import campo from '@/components/ui/Input.module.css';

// Máximo que admite el backend por página; la demo queda muy por debajo.
const LIMITE_EVENTOS = 100;

const lista = (valores: string[]) => (valores.length ? valores.join(', ') : 'Ninguno registrado');

/**
 * Pantalla 11 y D6: GET /conversaciones/{id} (la médica asignada la pasa de ENVIADA a
 * EN_REVISION), GET /perfiles/{id}, GET .../eventos, POST .../indicaciones y POST .../mensajes.
 */
function Contenido({ conversacionId }: { conversacionId: string }) {
  const router = useRouter();
  const { usuario } = useAuth();
  const [conversacion, setConversacion] = useState<DetalleConversacion | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [totalEventos, setTotalEventos] = useState(0);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [plazoDias, setPlazoDias] = useState('');
  const [errores, setErrores] = useState<ErroresIndicacion>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [registrada, setRegistrada] = useState(false);
  // Igual que los mensajes: una clave por intento, reutilizada sólo si el anterior quedó incierto.
  const intentoIndicacion = useRef<{ clave: string; cuerpo: string } | null>(null);

  useEffect(() => {
    const control = new AbortController();
    let vigente = true;
    async function cargar() {
      setError(null);
      setNoEncontrada(false);
      try {
        // Primero el detalle: si la abre la médica asignada, este GET registra el cambio a
        // EN_REVISION, y los eventos se piden después para que ya lo incluyan.
        const datos = await obtenerConversacion(conversacionId, control.signal);
        if (!vigente) return;
        const [pagina, p] = await Promise.all([
          listarEventos(conversacionId, { limite: LIMITE_EVENTOS }, control.signal),
          obtenerPerfil(datos.perfil.id, control.signal),
        ]);
        if (!vigente) return;
        setEventos(pagina.datos);
        setTotalEventos(pagina.paginacion.total);
        setPerfil(p);
        setConversacion(datos);
      } catch (e) {
        if (!vigente || (e instanceof DOMException && e.name === 'AbortError')) return;
        if (e instanceof ApiError && e.esSesionInvalida) return;
        // Inexistente, borrador o asignada a otro médico: el backend responde 404.
        if (e instanceof ApiError && e.status === 404) return setNoEncontrada(true);
        setError(mensajeParaUsuario(e));
        if ((await alertarError(e, { reintentar: true })) && vigente) setIntento((n) => n + 1);
      }
    }
    void cargar();
    return () => {
      vigente = false;
      control.abort();
    };
  }, [conversacionId, intento]);

  async function alRegistrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (registrando) return;
    setErrorGeneral(null);
    setRegistrada(false);
    const datos = { texto, decision, plazoDias };
    const nuevos = validarIndicacion(datos);
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    const cuerpo = cuerpoIndicacion(datos);
    const huella = JSON.stringify(cuerpo);
    if (intentoIndicacion.current?.cuerpo !== huella) intentoIndicacion.current = { clave: crypto.randomUUID(), cuerpo: huella };
    setRegistrando(true);
    try {
      await registrarIndicacion(conversacionId, cuerpo, intentoIndicacion.current.clave);
      intentoIndicacion.current = null;
      setTexto('');
      setDecision(null);
      setPlazoDias('');
      setAbierto(false);
      setRegistrada(true);
      setConversacion((c) => c && { ...c, estado: 'CON_INDICACIONES' });
      // El hilo se vuelve a pedir: trae el cambio de estado y marca la anterior como sustituida.
      try {
        const pagina = await listarEventos(conversacionId, { limite: LIMITE_EVENTOS });
        setEventos(pagina.datos);
        setTotalEventos(pagina.paginacion.total);
      } catch (e) {
        if (!(e instanceof ApiError && e.esSesionInvalida)) await alertarError(e);
      }
    } catch (e) {
      const incierto = e instanceof ApiError && (e.esFalloDeRed || e.status >= 500);
      if (!incierto) intentoIndicacion.current = null;
      if (e instanceof ApiError && e.esSesionInvalida) return;
      // 409 (estado) y 422 (datos) se corrigen aquí: junto al botón (L-26).
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) setErrorGeneral(mensajeParaUsuario(e));
      else await alertarError(e);
    } finally {
      setRegistrando(false);
    }
  }

  const shell = { nav: NAV_MEDICO, usuario: { nombre: usuario?.nombre ?? '', rol: usuario?.especialidad ?? 'Médica' } };

  if (noEncontrada) {
    return (
      <AppShell titulo="Conversación" conVolver {...shell}>
        <EstadoVacio
          icono="mensaje"
          titulo="Conversación no encontrada"
          texto="No existe o no está asignada a usted."
          accion={<Button onClick={() => router.push('/medico/bandeja')}>Ir a la bandeja</Button>}
        />
      </AppShell>
    );
  }

  if (!conversacion || !perfil) {
    return (
      <AppShell titulo="Conversación" conVolver {...shell}>
        {error ? (
          <div className={estilos.notaAviso} role="alert">
            <Icono nombre="alerta" tam={18} />
            <span className={estilos.notaCuerpo}>
              <span className="t-body-m-fuerte">No pudimos cargar la conversación</span>
              <span className={`${estilos.notaDetalle} t-body-s`}>{error}</span>
              <span>
                <Button size="sm" variant="secundario" onClick={() => setIntento((n) => n + 1)}>
                  Reintentar
                </Button>
              </span>
            </span>
          </div>
        ) : (
          <EsqueletoLista filas={2} mensaje="Cargando la conversación…" />
        )}
      </AppShell>
    );
  }

  const sinIndicacion = motivoSinIndicacion(conversacion.estado);

  return (
    <AppShell
      titulo={conversacion.titulo}
      conVolver
      mostrarBarra={false}
      {...shell}
      pie={
        <CajaMensaje
          conversacionId={conversacionId}
          estado={conversacion.estado}
          etiqueta="Mensaje para la familia"
          onEnviado={(e) => {
            setEventos((l) => [...l, e]);
            setTotalEventos((n) => n + 1);
          }}
        />
      }
    >
      <div className={estilos.principal}>
        <div className={estilos.listaChips}>
          <ChipEstado estado={conversacion.estado} />
          {conversacion.etiquetas.map((codigo) => (
            <ChipEtiqueta key={codigo} codigo={codigo as CodigoEtiqueta} />
          ))}
          {conversacion.prioridadIndicada && <MarcaPrioridad />}
        </div>

        {/* El aviso de emergencias es sólo del lado de la familia (RF-13). */}
        <div className={estilos.tarjeta}>
          <FilaDato clave="Paciente" valor={`${perfil.nombre} · ${perfil.edadAnios} años`} />
          <FilaDato clave="Familia" valor={conversacion.familiaNombre} />
          <FilaDato clave="Alergias" valor={lista(perfil.alergias)} />
          <FilaDato clave="Medicamentos" valor={lista(perfil.medicamentos)} />
        </div>

        <RespuestasContexto preguntas={conversacion.preguntas} abierto />

        <h2 className={`${estilos.rotulo} t-overline`}>CONVERSACIÓN</h2>
        {totalEventos > eventos.length && (
          <p className={`${estilos.apoyo} t-body-s`}>
            Se muestran los primeros {eventos.length} de {totalEventos} eventos.
          </p>
        )}
        <ListaEventos eventos={eventos} medico={conversacion.medico?.nombre ?? null} />

        <h2 className={`${estilos.rotulo} t-overline`}>INDICACIÓN</h2>
        {sinIndicacion ? (
          <p className={`${estilos.apoyo} t-body-s`} role="status">{sinIndicacion}</p>
        ) : !abierto ? (
          <>
            {registrada && <p className={`${estilos.apoyo} t-body-s`} role="status">Indicación registrada.</p>}
            <Button variant="secundario" fullWidth onClick={() => { setAbierto(true); setRegistrada(false); }}>
              Registrar indicación
            </Button>
          </>
        ) : (
          <form className={estilos.tarjeta} onSubmit={alRegistrar} noValidate aria-label="Registrar indicación">
            <div className={`${campo.campo} ${campo.anchoCompleto}`}>
              <label htmlFor="indicacion-texto" className={campo.etiqueta}>Indicación para la familia</label>
              <textarea
                id="indicacion-texto"
                name="indicacion"
                className={`${campo.input} ${errores.texto ? campo.invalido : ''}`}
                style={{ minHeight: 120, padding: 'var(--space-12)' }}
                maxLength={MAX_INDICACION}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setErrores((x) => ({ ...x, texto: undefined }));
                }}
                aria-invalid={errores.texto ? true : undefined}
                aria-describedby={errores.texto ? 'indicacion-texto-error' : undefined}
              />
              {errores.texto && (
                <p id="indicacion-texto-error" role="alert" className={campo.error}>{errores.texto}</p>
              )}
            </div>

            <p className={`${estilos.rotulo} t-overline`} id="indicacion-decision">DECISIÓN</p>
            <div className={estilos.listaChips} role="radiogroup" aria-labelledby="indicacion-decision">
              {DECISIONES.map((d) => (
                <ChipFiltro
                  key={d.texto}
                  activo={decision === d.valor}
                  rolAria="radio"
                  onClick={() => {
                    setDecision(d.valor);
                    // El plazo sólo existe con consulta presencial: se descarta al cambiar.
                    if (d.valor !== 'consulta_presencial') setPlazoDias('');
                    setErrores((x) => ({ ...x, plazoDias: undefined }));
                  }}
                >
                  {d.texto}
                </ChipFiltro>
              ))}
            </div>

            {decision === 'consulta_presencial' && (
              <Input
                label="Días para la consulta"
                hint="De 1 a 90 días."
                type="number"
                inputMode="numeric"
                min={1}
                max={90}
                value={plazoDias}
                onChange={(e) => {
                  setPlazoDias(e.target.value);
                  setErrores((x) => ({ ...x, plazoDias: undefined }));
                }}
                error={errores.plazoDias}
                required
              />
            )}

            {/* Junto al botón: siempre a la vista en un teléfono (L-26). */}
            {errorGeneral && (
              <p className={acceso.errorGeneral} role="alert">
                <Icono nombre="alerta" tam={16} />
                <span className="t-body-s">{errorGeneral}</span>
              </p>
            )}
            <Button type="submit" fullWidth loading={registrando} loadingText="Registrando…">
              Registrar indicación
            </Button>
            <Button variant="secundario" fullWidth disabled={registrando} onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaConversacionMedico({ params }: { params: Promise<{ conversacionId: string }> }) {
  const { conversacionId } = use(params);
  return (
    <RutaProtegida roles={['medico']}>
      <Contenido key={conversacionId} conversacionId={conversacionId} />
    </RutaProtegida>
  );
}
