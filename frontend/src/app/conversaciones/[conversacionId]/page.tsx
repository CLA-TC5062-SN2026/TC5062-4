'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import { ChipEstado, ChipEtiqueta, MarcaPrioridad } from '@/components/dafi/Chips';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { AvisoEmergencias, FilaDato } from '@/components/dafi/Piezas';
import {
  Compositor,
  EstadoVacio,
  EventoAviso,
  EventoCambioEstado,
  EventoMensaje,
} from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import { enviarMensaje, listarEventos, obtenerConversacion } from '@/services/conversacionesService';
import type { DetalleConversacion, Evento } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import {
  motivoSinMensajes, ordenarEventos, puedeEnviarMensaje, textoCambioEstado, textoDecision,
  textoRespuesta, validarMensaje,
} from './hilo';
import estilos from '@/components/dafi/Pantalla.module.css';
import acceso from '@/components/dafi/Acceso.module.css';

// Máximo que admite el backend por página; la demo queda muy por debajo.
const LIMITE_EVENTOS = 100;

const hora = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Pantalla 9: hilo de la cuidadora. GET /conversaciones/{id}, GET .../eventos
 * y POST .../mensajes con Idempotency-Key.
 */
function Contenido({ conversacionId }: { conversacionId: string }) {
  const router = useRouter();
  const [conversacion, setConversacion] = useState<DetalleConversacion | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [totalEventos, setTotalEventos] = useState(0);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [enviando, setEnviando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  // Una clave por intento; se reutiliza sólo si el anterior, con el mismo texto, no tuvo respuesta definitiva.
  const intentoMensaje = useRef<{ clave: string; texto: string } | null>(null);

  useEffect(() => {
    const control = new AbortController();
    let vigente = true;
    async function cargar() {
      setError(null);
      setNoEncontrada(false);
      try {
        const datos = await obtenerConversacion(conversacionId, control.signal);
        if (!vigente) return;
        // Un borrador se edita y envía en su propia pantalla.
        if (datos.estado === 'BORRADOR') return router.replace(`/conversaciones/${conversacionId}/borrador`);
        const pagina = await listarEventos(conversacionId, { limite: LIMITE_EVENTOS }, control.signal);
        if (!vigente) return;
        setEventos(pagina.datos);
        setTotalEventos(pagina.paginacion.total);
        setConversacion(datos);
      } catch (e) {
        if (!vigente || (e instanceof DOMException && e.name === 'AbortError')) return;
        if (e instanceof ApiError && e.esSesionInvalida) return;
        // Inexistente, de otra familia o id mal formado: el backend responde 404.
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
  }, [conversacionId, intento, router]);

  async function enviar(textoCrudo: string): Promise<boolean> {
    const invalido = validarMensaje(textoCrudo);
    if (invalido) {
      setErrorMensaje(invalido);
      return false;
    }
    const texto = textoCrudo.trim();
    if (intentoMensaje.current?.texto !== texto) intentoMensaje.current = { clave: crypto.randomUUID(), texto };
    setEnviando(true);
    setErrorMensaje(null);
    try {
      const m = await enviarMensaje(conversacionId, texto, intentoMensaje.current.clave);
      intentoMensaje.current = null;
      setEventos((lista) => [
        ...lista,
        { ...m, estadoAnterior: null, estadoNuevo: null, indicacion: null },
      ]);
      setTotalEventos((n) => n + 1);
      return true;
    } catch (e) {
      // Sin respuesta o 5xx: el mensaje pudo haberse guardado, así que el reintento usa la misma clave.
      const incierto = e instanceof ApiError && (e.esFalloDeRed || e.status >= 500);
      if (!incierto) intentoMensaje.current = null;
      if (e instanceof ApiError && e.esSesionInvalida) return false;
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) setErrorMensaje(mensajeParaUsuario(e));
      else await alertarError(e);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  if (noEncontrada) {
    return (
      <AppShell titulo="Conversación" conVolver>
        <EstadoVacio
          icono="mensaje"
          titulo="Conversación no encontrada"
          texto="No existe o no pertenece a su familia."
          accion={<Button onClick={() => router.push('/conversaciones')}>Ver conversaciones</Button>}
        />
      </AppShell>
    );
  }

  if (!conversacion) {
    return (
      <AppShell titulo="Conversación" conVolver>
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

  const bloqueo = motivoSinMensajes(conversacion.estado);
  const respondidas = conversacion.preguntas.filter((q) => textoRespuesta(q));
  const medico = conversacion.medico?.nombre ?? null;

  return (
    <AppShell
      titulo={conversacion.titulo}
      conVolver
      mostrarBarra={false}
      pie={
        <Compositor
          onEnviar={enviar}
          enviando={enviando}
          deshabilitado={!puedeEnviarMensaje(conversacion.estado)}
          aviso={
            errorMensaje ? (
              <p className={acceso.errorGeneral} role="alert">
                <Icono nombre="alerta" tam={16} />
                <span className="t-body-s">{errorMensaje}</span>
              </p>
            ) : (
              bloqueo && (
                <p className={`${estilos.apoyo} t-body-s`} role="status">
                  {bloqueo}
                </p>
              )
            )
          }
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

        <div className={estilos.tarjeta}>
          <FilaDato clave="Perfil" valor={conversacion.perfil.nombre} />
          <FilaDato clave="Médico" valor={medico ?? 'Sin médico'} />
        </div>

        {/* RF-13: aviso fijo del lado de la familia, antes del hilo; el backend lo quita al cerrar. */}
        {conversacion.estado !== 'CERRADA' && <AvisoEmergencias />}

        {respondidas.length > 0 && (
          <details className={estilos.tarjeta}>
            <summary className="t-body-m-fuerte">Respuestas de contexto ({respondidas.length})</summary>
            {respondidas.map((q) => (
              <FilaDato key={q.id} clave={q.texto} valor={textoRespuesta(q) ?? ''} />
            ))}
          </details>
        )}

        <h2 className={`${estilos.rotulo} t-overline`}>CONVERSACIÓN</h2>
        {totalEventos > eventos.length && (
          <p className={`${estilos.apoyo} t-body-s`}>
            Se muestran los primeros {eventos.length} de {totalEventos} eventos.
          </p>
        )}
        {/* Los eventos `respuesta` se omiten: sus valores están en «Respuestas de contexto». */}
        {ordenarEventos(eventos).map((e) => {
          if (e.tipo === 'mensaje') {
            return (
              <EventoMensaje
                key={e.id}
                autor={e.autor.nombre}
                rol={e.autor.rol === 'medico' ? 'medico' : 'familia'}
                hora={hora(e.fecha)}
                texto={e.texto ?? ''}
              />
            );
          }
          if (e.tipo === 'cambio_estado') {
            return <EventoCambioEstado key={e.id} texto={textoCambioEstado(e, medico)} hora={hora(e.fecha)} />;
          }
          if (e.tipo === 'indicacion' && e.indicacion) {
            const i = e.indicacion;
            return (
              <EventoAviso
                key={e.id}
                tipo="indicacion"
                titulo={`Indicación de ${i.medico.nombre} · ${hora(e.fecha)}`}
                detalle={i.texto}
                decision={textoDecision(i.decision, i.plazoDias) ?? undefined}
                marca={i.vigente ? 'Vigente' : 'Sustituida'}
              />
            );
          }
          return null;
        })}
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaConversacion({ params }: { params: Promise<{ conversacionId: string }> }) {
  const { conversacionId } = use(params);
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido key={conversacionId} conversacionId={conversacionId} />
    </RutaProtegida>
  );
}
