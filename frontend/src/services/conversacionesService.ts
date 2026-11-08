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

export function obtenerConversacion(conversacionId: string, signal?: AbortSignal) {
  return peticion<Conversacion>(`/conversaciones/${conversacionId}`, { signal });
}

export function listarEventos(conversacionId: string, signal?: AbortSignal) {
  return peticion<Pagina<unknown>>(`/conversaciones/${conversacionId}/eventos`, { signal });
}

/**
 * Enviar un borrador no debe repetirse si el usuario pulsa dos veces: la API
 * exige una Idempotency-Key en formato UUID y devuelve el resultado del primer
 * envío si recibe la misma clave.
 */
export function enviarConversacion(conversacionId: string, signal?: AbortSignal) {
  return peticion<Conversacion>(`/conversaciones/${conversacionId}/envios`, {
    method: 'POST',
    body: {},
    idempotencyKey: crypto.randomUUID(),
    signal,
  });
}
