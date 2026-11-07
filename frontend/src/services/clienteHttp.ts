/**
 * Cliente HTTP de DAFI.
 *
 * `fetch` no tiene interceptores como axios, así que se implementan aquí: dos
 * listas de funciones que se ejecutan antes de cada petición y después de cada
 * respuesta. Es el único sitio del frontend que sabe de cabeceras, del token y
 * del contrato de errores; los servicios por recurso sólo declaran rutas.
 *
 * Decisión y su motivo en S07_S08_A2/capa_servicios.md.
 */
import { ApiError } from './errores';
import type { CodigoError } from './errores';

/** Ruta relativa: Next reescribe /api/v1/* hacia Express (next.config.ts). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export interface PeticionConfig {
  ruta: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  /** Deja la petición sin Authorization (login, registro, catálogos). */
  publica?: boolean;
}

type InterceptorPeticion = (config: PeticionConfig) => PeticionConfig;
type InterceptorRespuesta = (error: ApiError, config: PeticionConfig) => void;

const interceptoresPeticion: InterceptorPeticion[] = [];
const interceptoresError: InterceptorRespuesta[] = [];

/** Se ejecuta antes de cada petición y puede modificar la configuración. */
export function registrarInterceptorPeticion(fn: InterceptorPeticion): () => void {
  interceptoresPeticion.push(fn);
  return () => {
    const i = interceptoresPeticion.indexOf(fn);
    if (i >= 0) interceptoresPeticion.splice(i, 1);
  };
}

/** Se ejecuta ante cualquier respuesta de error, antes de propagarla. */
export function registrarInterceptorError(fn: InterceptorRespuesta): () => void {
  interceptoresError.push(fn);
  return () => {
    const i = interceptoresError.indexOf(fn);
    if (i >= 0) interceptoresError.splice(i, 1);
  };
}

export interface OpcionesPeticion {
  method?: PeticionConfig['method'];
  body?: unknown;
  signal?: AbortSignal;
  publica?: boolean;
  /** Obligatoria en los POST con efectos irrepetibles. Debe ser un UUID. */
  idempotencyKey?: string;
  /** Control de concurrencia optimista (PATCH de conversación). */
  ifMatch?: string;
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { method = 'GET', body, signal, publica = false, idempotencyKey, ifMatch } = opciones;

  let config: PeticionConfig = {
    ruta,
    method,
    headers: { Accept: 'application/json' },
    body,
    signal,
    publica,
  };
  if (body !== undefined) config.headers['Content-Type'] = 'application/json';
  if (idempotencyKey) config.headers['Idempotency-Key'] = idempotencyKey;
  if (ifMatch) config.headers['If-Match'] = ifMatch;

  for (const interceptor of interceptoresPeticion) config = interceptor(config);

  let respuesta: Response;
  try {
    respuesta = await fetch(API_URL + config.ruta, {
      method: config.method,
      headers: config.headers,
      body: config.body === undefined ? undefined : JSON.stringify(config.body),
      signal: config.signal,
      credentials: 'omit',
    });
  } catch (causa) {
    // fetch sólo rechaza si la petición no llegó a completarse. Un 500 NO cae aquí.
    if (causa instanceof DOMException && causa.name === 'AbortError') throw causa;
    const error = new ApiError(0, 'SIN_CONEXION', 'No se pudo contactar con el servidor de DAFI.');
    for (const interceptor of interceptoresError) interceptor(error, config);
    throw error;
  }

  const correlacionId = respuesta.headers.get('X-Correlation-Id') ?? undefined;
  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      if (!respuesta.ok) {
        const error = new ApiError(respuesta.status, 'ERROR_INTERNO', 'Respuesta ilegible del servidor.', correlacionId);
        for (const interceptor of interceptoresError) interceptor(error, config);
        throw error;
      }
    }
  }

  if (!respuesta.ok) {
    const cuerpo = (datos ?? {}) as { codigo?: CodigoError; mensaje?: string; correlacionId?: string };
    const error = new ApiError(
      respuesta.status,
      cuerpo.codigo ?? 'ERROR_INTERNO',
      cuerpo.mensaje ?? 'Ocurrió un error inesperado.',
      cuerpo.correlacionId ?? correlacionId
    );
    for (const interceptor of interceptoresError) interceptor(error, config);
    throw error;
  }

  return datos as T;
}
