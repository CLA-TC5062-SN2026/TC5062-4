/**
 * Cliente HTTP del API de DAFI.
 *
 * Centraliza tres cosas que, si se repiten en cada pantalla, acaban
 * divergiendo: la URL base, la cabecera Authorization y la traducción del
 * contrato de errores del backend a algo que la UI pueda mostrar.
 *
 * Contrato de errores (S05-S06-A1, openapi_equipo.yaml):
 *   { "codigo": "DATOS_INVALIDOS", "mensaje": "...", "correlacionId": "uuid" }
 * y la cabecera X-Correlation-Id en toda respuesta.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Códigos del contrato de errores del SRS, sección 3.0. */
export type CodigoError =
  | "NO_AUTENTICADO"
  | "SIN_PERMISOS"
  | "CUENTA_NO_VERIFICADA"
  | "CUENTA_DESACTIVADA"
  | "NO_ENCONTRADO"
  | "TRANSICION_INVALIDA"
  | "LIMITE_ALCANZADO"
  | "CONSENTIMIENTO_PENDIENTE"
  | "CORREO_REGISTRADO"
  | "ENLACE_INVALIDO"
  | "ARCHIVO_INVALIDO"
  | "DATOS_INVALIDOS"
  | "CONVERSACION_INCOMPLETA"
  | "VERSION_DESACTUALIZADA"
  | "SOLICITUD_MALFORMADA"
  | "BLOQUEADO"
  | "ERROR_INTERNO"
  | "SIN_CONEXION";

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: CodigoError;
  readonly correlacionId?: string;

  constructor(
    status: number,
    codigo: CodigoError,
    mensaje: string,
    correlacionId?: string,
  ) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.correlacionId = correlacionId;
  }

  /** true si la sesión caducó o fue revocada y hay que volver a entrar. */
  get esSesionInvalida() {
    return this.status === 401;
  }
}

export interface PeticionOpciones {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** JWT del usuario. Si falta, la petición sale sin Authorization. */
  token?: string | null;
  /**
   * Obligatorio en los POST con efectos irrepetibles (envíos, mensajes, fotos).
   * El backend exige que sea un UUID y responde 400 si no lo es.
   */
  idempotencyKey?: string;
  /** ETag para control de concurrencia optimista (PATCH de conversación). */
  ifMatch?: string;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  opciones: PeticionOpciones = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
    idempotencyKey,
    ifMatch,
    signal,
  } = opciones;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  if (ifMatch) headers["If-Match"] = ifMatch;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      // El backend usa Bearer, no cookies: no hace falta enviar credenciales.
      credentials: "omit",
    });
  } catch (causa) {
    // fetch sólo rechaza por fallo de red o CORS. Un 500 NO llega aquí.
    if (causa instanceof DOMException && causa.name === "AbortError")
      throw causa;
    throw new ApiError(
      0,
      "SIN_CONEXION",
      "No se pudo contactar con el servidor de DAFI.",
    );
  }

  const correlacionId = respuesta.headers.get("X-Correlation-Id") ?? undefined;

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      // Un cuerpo no-JSON con status de error sigue siendo un error legítimo.
      if (!respuesta.ok) {
        throw new ApiError(
          respuesta.status,
          "ERROR_INTERNO",
          "Respuesta ilegible del servidor.",
          correlacionId,
        );
      }
    }
  }

  if (!respuesta.ok) {
    const cuerpo = (datos ?? {}) as {
      codigo?: CodigoError;
      mensaje?: string;
      correlacionId?: string;
    };
    throw new ApiError(
      respuesta.status,
      cuerpo.codigo ?? "ERROR_INTERNO",
      cuerpo.mensaje ?? "Ocurrió un error inesperado.",
      cuerpo.correlacionId ?? correlacionId,
    );
  }

  return datos as T;
}

/** Mensajes para el usuario final. El `mensaje` del API es más técnico. */
export function mensajeParaUsuario(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Ocurrió un error inesperado. Inténtelo de nuevo.";
  }
  switch (error.codigo) {
    case "SIN_CONEXION":
      return "No pudimos contactar con DAFI. Revise su conexión e inténtelo de nuevo.";
    case "NO_AUTENTICADO":
      return "Su sesión se cerró. Vuelva a entrar para continuar.";
    case "SIN_PERMISOS":
      return "Su rol no tiene permiso para esta operación.";
    case "NO_ENCONTRADO":
      return "No encontramos lo que busca o ya no está disponible.";
    case "CORREO_REGISTRADO":
      return "Ya existe una cuenta con este correo.";
    case "BLOQUEADO":
      return "Demasiados intentos. Espere unos minutos antes de volver a intentarlo.";
    case "CONVERSACION_INCOMPLETA":
      return "Faltan respuestas obligatorias para poder enviar la conversación.";
    default:
      return error.message;
  }
}
