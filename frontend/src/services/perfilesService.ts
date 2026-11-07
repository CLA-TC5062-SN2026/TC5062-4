/** Perfiles de paciente de una familia. */
import { peticion } from './clienteHttp';

export type TipoPerfil = 'menor' | 'propio' | 'adulto_representado';
export type EstadoPerfil = 'activo' | 'pendiente_consentimiento';

export interface Perfil {
  id: string;
  familiaId: string;
  tipo: TipoPerfil;
  nombre: string;
  fechaNacimiento: string;
  edadAnios: number;
  alergias: string[];
  medicamentos: string[];
  estado: EstadoPerfil;
  compartirConCocuidador: boolean;
  resumenActivo: boolean;
}

export interface NuevoPerfil {
  tipo: TipoPerfil;
  nombre: string;
  fechaNacimiento: string;
  alergias?: string[];
  medicamentos?: string[];
  compartirConCocuidador?: boolean;
  /** Obligatorio para `adulto_representado`: recibe el enlace de consentimiento. */
  correo?: string;
}

export function listarPerfiles(familiaId: string, signal?: AbortSignal) {
  return peticion<Perfil[]>(`/familias/${familiaId}/perfiles`, { signal });
}

export function obtenerPerfil(perfilId: string, signal?: AbortSignal) {
  return peticion<Perfil>(`/perfiles/${perfilId}`, { signal });
}

export function crearPerfil(familiaId: string, datos: NuevoPerfil, signal?: AbortSignal) {
  return peticion<Perfil>(`/familias/${familiaId}/perfiles`, {
    method: 'POST', body: datos, signal,
  });
}

export function actualizarPerfil(perfilId: string, cambios: Partial<NuevoPerfil>, signal?: AbortSignal) {
  return peticion<Perfil>(`/perfiles/${perfilId}`, { method: 'PATCH', body: cambios, signal });
}

export function borrarPerfil(perfilId: string, signal?: AbortSignal) {
  return peticion<void>(`/perfiles/${perfilId}`, { method: 'DELETE', signal });
}
