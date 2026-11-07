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
