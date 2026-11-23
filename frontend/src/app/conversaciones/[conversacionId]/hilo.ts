/** Reglas del hilo de la cuidadora, sin React para poder probarlas solas. */
import type { Decision, EstadoConversacion, Evento, Pregunta } from '@/services/conversacionesService';

/** Igual que el backend (`POST /mensajes`): entre 1 y 4000 caracteres sin contar espacios de los extremos. */
export const MAX_MENSAJE = 4000;

const NOMBRE_ESTADO: Record<EstadoConversacion, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  EN_REVISION: 'En revisión',
  INFO_SOLICITADA: 'Información solicitada',
  CON_INDICACIONES: 'Con indicaciones',
  CERRADA: 'Cerrada',
  SIN_MEDICO: 'Sin médico',
};

/** Línea neutra de un `cambio_estado`, en palabras de la familia. */
export function textoCambioEstado(evento: Evento, medico: string | null): string {
  const autor = evento.autor.nombre;
  switch (evento.estadoNuevo) {
    case 'ENVIADA':
      return medico ? `Enviada a ${medico}` : 'Enviada';
    case 'EN_REVISION':
      return evento.estadoAnterior === 'ENVIADA' ? `${autor} abrió la conversación` : `${autor} retomó la revisión`;
    case 'CON_INDICACIONES':
      return `${autor} registró una indicación`;
    case 'INFO_SOLICITADA':
      return `${autor} pidió más información`;
    case 'CERRADA':
      return `${autor} cerró la conversación`;
    case 'SIN_MEDICO':
      return 'La conversación se quedó sin médico';
    default:
      return evento.estadoNuevo ? `Pasó a «${NOMBRE_ESTADO[evento.estadoNuevo]}»` : 'Cambió de estado';
  }
}

export function textoDecision(decision: Decision | null, plazoDias: number | null): string | null {
  if (decision === 'cuidado_en_casa') return 'Cuidado en casa';
  if (decision === 'acudir_a_urgencias') return 'Acudir a urgencias';
  if (decision === 'consulta_presencial') {
    return `Consulta presencial en ${plazoDias} ${plazoDias === 1 ? 'día' : 'días'}`;
  }
  return null;
}

/**
 * Orden cronológico. `cambio_estado` e `indicacion` nacen en la misma transacción
 * con la misma fecha (L-25): el cambio va primero para que la indicación cierre el bloque.
 */
export function ordenarEventos(eventos: Evento[]): Evento[] {
  const rango = (e: Evento) => (e.tipo === 'indicacion' ? 1 : 0);
  return [...eventos].sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha) || rango(a) - rango(b));
}

/** Los mismos estados que rechaza el backend con 409. */
export function puedeEnviarMensaje(estado: EstadoConversacion): boolean {
  return estado !== 'BORRADOR' && estado !== 'CERRADA';
}

export function motivoSinMensajes(estado: EstadoConversacion): string | null {
  if (estado === 'CERRADA') return 'La conversación está cerrada: ya no admite mensajes.';
  if (estado === 'BORRADOR') return 'Envíe primero el borrador para poder escribir mensajes.';
  return null;
}

/** null si se puede enviar; si no, el motivo. */
export function validarMensaje(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return 'Escriba un mensaje.';
  if (limpio.length > MAX_MENSAJE) return `El mensaje admite hasta ${MAX_MENSAJE} caracteres.`;
  return null;
}

/** Respuesta de contexto legible; el detalle trae `numero` como texto (L-32). */
export function textoRespuesta(q: Pregunta): string | null {
  const r = q.respuesta;
  if (!r) return null;
  if (r.numero != null) return `${Number(r.numero)}${q.tipoRespuesta === 'numero_u_opcion' ? ' °C' : ''}`;
  return [r.opcion, r.texto].filter(Boolean).join(' · ') || null;
}
