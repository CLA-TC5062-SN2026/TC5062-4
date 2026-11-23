/** Conversaciones, su bitácora de eventos y el envío de borradores. */
import { peticion } from './clienteHttp';

export type EstadoConversacion =
  | 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'INFO_SOLICITADA'
  | 'CON_INDICACIONES' | 'CERRADA' | 'SIN_MEDICO';

export interface Conversacion {
  id: string;
  familiaId: string;
  familiaNombre: string;
  perfil: { id: string; nombre: string };
  titulo: string;
  estado: EstadoConversacion;
  prioridadIndicada: boolean;
  creadaEn: string;
  enviadaEn: string | null;
  ultimoEventoEn: string;
  version: number;
  medico: { id: string; nombre: string; rol: string } | null;
  etiquetas: string[];
}

export interface Pagina<T> {
  datos: T[];
  paginacion: { pagina: number; limite: number; total: number };
}

export interface FiltrosConversacion {
  familiaId?: string;
  estado?: EstadoConversacion;
  pagina?: number;
  limite?: number;
}

function consulta(filtros: FiltrosConversacion = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function listarConversaciones(filtros: FiltrosConversacion = {}, signal?: AbortSignal) {
  return peticion<Pagina<Conversacion>>(`/conversaciones${consulta(filtros)}`, { signal });
}

export function listarPorPerfil(perfilId: string, filtros: FiltrosConversacion = {}, signal?: AbortSignal) {
  return peticion<Pagina<Conversacion>>(`/perfiles/${perfilId}/conversaciones${consulta(filtros)}`, { signal });
}

export type TipoRespuesta = 'opcion' | 'zona_cuerpo' | 'texto' | 'opcion_con_texto' | 'numero_u_opcion';

export interface Pregunta {
  id: string;
  texto: string;
  tipoRespuesta: TipoRespuesta;
  opciones: string[];
  obligatoria: boolean;
  etiqueta: string | null;
  // El GET del detalle devuelve `numero` como texto ("38.6"); el PUT, como número.
  respuesta?: { id: string; opcion: string | null; texto: string | null; numero: number | string | null };
}

export interface PuntoPendiente {
  tipo: string;
  referencia: string;
  mensaje: string;
}

export interface DetalleConversacion extends Conversacion {
  preguntas: Pregunta[];
  puntosPendientes: PuntoPendiente[];
}

export function obtenerConversacion(conversacionId: string, signal?: AbortSignal) {
  return peticion<DetalleConversacion>(`/conversaciones/${conversacionId}`, { signal });
}

/** Cuerpo de B2: sólo los campos que admite el tipo de la pregunta. */
export interface ValorRespuesta {
  opcion?: string;
  texto?: string;
  numero?: number;
}

export interface RespuestaGuardada {
  preguntaId: string;
  opcion: string | null;
  texto: string | null;
  numero: number | null;
}

/** B2: crea o reemplaza la respuesta; repetir el mismo valor no cambia nada. */
export function responderPregunta(conversacionId: string, preguntaId: string, valor: ValorRespuesta) {
  return peticion<RespuestaGuardada>(`/conversaciones/${conversacionId}/preguntas/${preguntaId}/respuesta`, {
    method: 'PUT',
    body: valor,
  });
}

export interface NuevaConversacion {
  titulo: string;
  etiquetas: string[];
  medicoId: string;
  prioridadIndicada: boolean;
}

/** El backend no pide Idempotency-Key aquí; el botón en estado de carga evita el doble envío. */
export function crearConversacion(perfilId: string, datos: NuevaConversacion) {
  return peticion<Conversacion>(`/perfiles/${perfilId}/conversaciones`, { method: 'POST', body: datos });
}

export function listarEventos(conversacionId: string, signal?: AbortSignal) {
  return peticion<Pagina<unknown>>(`/conversaciones/${conversacionId}/eventos`, { signal });
}

/**
 * Enviar un borrador no debe repetirse si el usuario pulsa dos veces: la API
 * exige una Idempotency-Key en formato UUID y devuelve el resultado del primer
 * envío si recibe la misma clave. Quien llama genera la clave y la reutiliza
 * al reintentar tras un fallo de red o un 5xx.
 */
export function enviarConversacion(conversacionId: string, idempotencyKey: string, signal?: AbortSignal) {
  return peticion<DetalleConversacion>(`/conversaciones/${conversacionId}/envios`, {
    method: 'POST',
    body: {},
    idempotencyKey,
    signal,
  });
}
