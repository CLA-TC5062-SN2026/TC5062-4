/**
 * Operaciones de identidad contra el backend de S05-S06-A2.
 * Rutas implementadas: POST /auth/register, POST /auth/login, GET /auth/me.
 */
import { apiFetch } from './api';

export type Rol = 'cuidador_principal' | 'cocuidador' | 'medico' | 'administrador';

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
  /** Es el menor entre la expiración del JWT y MINUTOS_SESION del servidor. */
  expiraEnSegundos: number;
  usuario: Usuario;
  /** Pantalla inicial según el rol: 'perfiles' | 'bandeja' | 'reportes'. */
  pantallaInicio: 'perfiles' | 'bandeja' | 'reportes';
}

export interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
  nombreFamilia?: string;
  avisoVersion: number;
  declaraciones: {
    mayorDeEdad: true;
    consentimientoDatosPropios: true;
    consentimientoDatosMenores: true;
  };
}

export function login(correo: string, contrasena: string, signal?: AbortSignal) {
  return apiFetch<RespuestaLogin>('/auth/login', {
    method: 'POST',
    body: { correo, contrasena },
    signal,
  });
}

export function registrar(datos: DatosRegistro, signal?: AbortSignal) {
  return apiFetch<Usuario>('/auth/register', { method: 'POST', body: datos, signal });
}

/** Revalida el token contra la BD: devuelve 401 si la sesión fue revocada. */
export function obtenerCuenta(token: string, signal?: AbortSignal) {
  return apiFetch<Usuario>('/auth/me', { token, signal });
}
