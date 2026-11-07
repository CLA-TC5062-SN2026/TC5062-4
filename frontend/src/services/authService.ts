/** Identidad: POST /auth/register, POST /auth/login, GET /auth/me. */
import { peticion } from './clienteHttp';
import { borrarToken, guardarToken } from './almacenToken';

export type Rol = 'cuidador_principal' | 'cocuidador' | 'medico' | 'administrador';
export type PantallaInicio = 'perfiles' | 'bandeja' | 'reportes';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  familiaId: string | null;
  especialidad?: string | null;
  correoVerificado: boolean;
  avisoAceptadoVersion?: number;
}

export interface RespuestaLogin {
  accessToken: string;
  tipoToken: 'Bearer';
  /** El menor entre la expiración del JWT y MINUTOS_SESION del servidor. */
  expiraEnSegundos: number;
  usuario: Usuario;
  pantallaInicio: PantallaInicio;
}

/** Ruta a la que llevar a cada rol tras iniciar sesión. */
export const RUTA_INICIO: Record<PantallaInicio, string> = {
  perfiles: '/perfiles',
  bandeja: '/medico/bandeja',
  reportes: '/perfiles',
};

export async function login(correo: string, contrasena: string, signal?: AbortSignal) {
  const sesion = await peticion<RespuestaLogin>('/auth/login', {
    method: 'POST',
    body: { correo, contrasena },
    publica: true,
    signal,
  });
  // El token se guarda aquí, no en la pantalla: así ninguna vista necesita
  // saber dónde vive la sesión.
  guardarToken(sesion.accessToken);
  return sesion;
}

/** Revalida el token contra la BD: 401 si la sesión fue revocada. */
export function obtenerCuenta(signal?: AbortSignal) {
  return peticion<Usuario>('/auth/me', { signal });
}

export function cerrarSesion(): void {
  // El contrato define DELETE /sesiones/actual para revocar el jti en el
  // servidor, pero esa ruta todavía no existe en backend/. Hasta entonces el
  // cierre es local y la sesión caduca sola por inactividad.
  borrarToken();
}
