/** Cuerpo del PATCH /perfiles/{id}: sólo los campos que la persona cambió. */
import type { NuevoPerfil, Perfil, TipoSangre } from '@/services/perfilesService';
import { aLista } from '../nuevo/validacion';

export interface PerfilEditado {
  nombre: string;
  /** Texto libre separado por comas, como en «Nuevo perfil». */
  alergias: string;
  medicamentos: string;
  tipoSangre: TipoSangre | null;
}

const iguales = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Objeto vacío si nada cambió: entonces no se envía la petición. */
export function construirPatch(
  original: Pick<Perfil, 'nombre' | 'alergias' | 'medicamentos' | 'tipoSangre'>,
  editado: PerfilEditado
): Partial<NuevoPerfil> {
  const patch: Partial<NuevoPerfil> = {};
  const nombre = editado.nombre.trim();
  if (nombre !== original.nombre) patch.nombre = nombre;
  const alergias = aLista(editado.alergias);
  if (!iguales(alergias, original.alergias)) patch.alergias = alergias;
  const medicamentos = aLista(editado.medicamentos);
  if (!iguales(medicamentos, original.medicamentos)) patch.medicamentos = medicamentos;
  // null también es un cambio: borra el valor registrado.
  if (editado.tipoSangre !== original.tipoSangre) patch.tipoSangre = editado.tipoSangre;
  return patch;
}
