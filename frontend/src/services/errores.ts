/**
 * Contrato de errores del backend (S05-S06-A1, openapi_equipo.yaml):
 *   { "codigo": "DATOS_INVALIDOS", "mensaje": "...", "correlacionId": "uuid" }
 * más la cabecera X-Correlation-Id en toda respuesta.
 */

export type CodigoError =
  | 'NO_AUTENTICADO' | 'SIN_PERMISOS' | 'CUENTA_NO_VERIFICADA' | 'CUENTA_DESACTIVADA'
  | 'NO_ENCONTRADO' | 'TRANSICION_INVALIDA' | 'LIMITE_ALCANZADO' | 'CONSENTIMIENTO_PENDIENTE'
  | 'CORREO_REGISTRADO' | 'ENLACE_INVALIDO' | 'ARCHIVO_INVALIDO' | 'DATOS_INVALIDOS'
  | 'FOTO_RECHAZADA' | 'CONVERSACION_INCOMPLETA' | 'VERSION_DESACTUALIZADA'
  | 'SOLICITUD_MALFORMADA' | 'BLOQUEADO' | 'ERROR_INTERNO' | 'SIN_CONEXION';

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: CodigoError;
  readonly correlacionId?: string;

  constructor(status: number, codigo: CodigoError, mensaje: string, correlacionId?: string) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.correlacionId = correlacionId;
  }

  /** La sesión caducó o fue revocada en el servidor: hay que volver a entrar. */
  get esSesionInvalida() {
    return this.status === 401;
  }

  /** No llegó a haber respuesta: red caída, servidor apagado o CORS. */
  get esFalloDeRed() {
    return this.codigo === 'SIN_CONEXION';
  }
}

/**
 * Texto que ve la persona. El `mensaje` del API está escrito para quien
 * depura; aquí se traduce a algo accionable y específico por código, que es lo
 * que distingue «no se pudo guardar» de «ya existe una cuenta con ese correo».
 */
const MENSAJES: Partial<Record<CodigoError, string>> = {
  SIN_CONEXION: 'No pudimos contactar con DAFI. Revise su conexión e inténtelo de nuevo.',
  NO_AUTENTICADO: 'Su sesión se cerró por inactividad. Vuelva a entrar para continuar.',
  SIN_PERMISOS: 'Su rol no tiene permiso para esta operación.',
  CUENTA_DESACTIVADA: 'Esta cuenta está desactivada. Contacte con el administrador.',
  CUENTA_NO_VERIFICADA: 'Confirme su correo antes de continuar.',
  NO_ENCONTRADO: 'No encontramos lo que busca, o ya no está disponible para usted.',
  CORREO_REGISTRADO: 'Ya existe una cuenta con este correo.',
  BLOQUEADO: 'Demasiados intentos. Espere unos minutos antes de volver a intentarlo.',
  CONVERSACION_INCOMPLETA: 'Faltan respuestas obligatorias para poder enviar la conversación.',
  CONSENTIMIENTO_PENDIENTE: 'Esa persona todavía no ha dado su consentimiento.',
  TRANSICION_INVALIDA: 'Esa acción no es posible en el estado actual de la conversación.',
  LIMITE_ALCANZADO: 'Se alcanzó el límite permitido para esta operación.',
  VERSION_DESACTUALIZADA: 'Alguien más modificó esto mientras lo editaba. Vuelva a cargarlo.',
  DATOS_INVALIDOS: 'Revise los datos: alguno no tiene el formato esperado.',
  SOLICITUD_MALFORMADA: 'La petición no se pudo procesar. Vuelva a intentarlo.',
};

export function mensajeParaUsuario(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Ocurrió un error inesperado. Inténtelo de nuevo.';
  }
  // Si no hay traducción propia se usa el mensaje del API, que para 422 lista
  // el campo concreto que falló y es más útil que un texto genérico.
  return MENSAJES[error.codigo] ?? error.message;
}
