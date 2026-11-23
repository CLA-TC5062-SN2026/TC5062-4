/** Familias y su círculo médico. */
import { peticion } from './clienteHttp';

export interface Familia {
  id: string;
  nombre: string;
  tieneCocuidador: boolean;
  totalPerfiles: number;
}

export function listarFamilias(signal?: AbortSignal) {
  return peticion<Familia[]>('/familias', { signal });
}

export function obtenerFamilia(familiaId: string, signal?: AbortSignal) {
  return peticion<Familia>(`/familias/${familiaId}`, { signal });
}

export interface Miembro {
  usuarioId: string;
  nombre: string;
  rol: 'cuidador_principal' | 'cocuidador' | 'medico';
  especialidad: string | null;
  leyenda: string | null;
  desde: string;
}

export function listarMiembros(familiaId: string, rol?: Miembro['rol'], signal?: AbortSignal) {
  return peticion<Miembro[]>(`/familias/${familiaId}/miembros${rol ? `?rol=${rol}` : ''}`, { signal });
}
