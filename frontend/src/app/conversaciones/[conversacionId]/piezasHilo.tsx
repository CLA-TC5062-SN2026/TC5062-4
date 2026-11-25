'use client';

import { useRef, useState } from 'react';
import Icono from '@/components/ui/Icono';
import { Compositor, EventoAviso, EventoCambioEstado, EventoMensaje } from '@/components/dafi/Bloques';
import { enviarMensaje } from '@/services/conversacionesService';
import type { EstadoConversacion, Evento } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { FilaDato } from '@/components/dafi/Piezas';
import type { Pregunta } from '@/services/conversacionesService';
import {
  motivoSinMensajes, ordenarEventos, puedeEnviarMensaje, textoCambioEstado, textoDecision, textoRespuesta,
  validarMensaje,
} from './hilo';
import estilos from '@/components/dafi/Pantalla.module.css';
import acceso from '@/components/dafi/Acceso.module.css';

const hora = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Respuestas de contexto ya dadas; plegadas para la familia, abiertas para la médica. */
export function RespuestasContexto({ preguntas, abierto = false }: { preguntas: Pregunta[]; abierto?: boolean }) {
  const respondidas = preguntas.filter((q) => textoRespuesta(q));
  if (!respondidas.length) return null;
  return (
    <details className={estilos.tarjeta} open={abierto}>
      <summary className="t-body-m-fuerte">Respuestas de contexto ({respondidas.length})</summary>
      {respondidas.map((q) => (
        <FilaDato key={q.id} clave={q.texto} valor={textoRespuesta(q) ?? ''} />
      ))}
    </details>
  );
}

/** Hilo de la cuidadora y de la médica: mensajes, cambios de estado e indicaciones. */
export function ListaEventos({ eventos, medico }: { eventos: Evento[]; medico: string | null }) {
  return (
    <>
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
    </>
  );
}

/** Compositor fijo al pie con POST /mensajes e Idempotency-Key; avisa con el evento creado. */
export function CajaMensaje({
  conversacionId, estado, etiqueta, onEnviado,
}: {
  conversacionId: string;
  estado: EstadoConversacion;
  etiqueta?: string;
  onEnviado: (evento: Evento) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  // Una clave por intento; se reutiliza sólo si el anterior, con el mismo texto, no tuvo respuesta definitiva.
  const intentoMensaje = useRef<{ clave: string; texto: string } | null>(null);

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
      onEnviado({ ...m, estadoAnterior: null, estadoNuevo: null, indicacion: null });
      return true;
    } catch (e) {
      // Sin respuesta o 5xx: el mensaje pudo haberse guardado, así que el reintento usa la misma clave.
      const incierto = e instanceof ApiError && (e.esFalloDeRed || e.status >= 500);
      if (!incierto) intentoMensaje.current = null;
      if (e instanceof ApiError && e.esSesionInvalida) return false;
      if (e instanceof ApiError && e.codigo === 'DATOS_INVALIDOS') setErrorMensaje(`Revise los datos: ${e.message}.`);
      else if (e instanceof ApiError && (e.status === 409 || e.status === 422)) setErrorMensaje(mensajeParaUsuario(e));
      else await alertarError(e);
      return false;
    } finally {
      setEnviando(false);
    }
  }

  const bloqueo = motivoSinMensajes(estado);
  return (
    <Compositor
      onEnviar={enviar}
      enviando={enviando}
      etiqueta={etiqueta}
      deshabilitado={!puedeEnviarMensaje(estado)}
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
  );
}
