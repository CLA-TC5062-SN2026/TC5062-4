/**
 * Validación en cliente de un perfil nuevo. Repite las reglas de
 * backend/src/routes/perfiles.js y utils/http.js (`validName`, `validDate`,
 * `validTexts`, correo del adulto representado) para avisar antes de enviar;
 * el backend sigue validando.
 */
import type { TipoPerfil } from '@/services/perfilesService';

const RE_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface DatosPerfil {
  tipo: TipoPerfil;
  nombre: string;
  fechaNacimiento: string;
  /** Texto libre separado por comas, tal como lo escribe el usuario. */
  alergias: string;
  medicamentos: string;
  correo: string;
}

export type ErroresPerfil = Partial<
  Record<'nombre' | 'fechaNacimiento' | 'alergias' | 'medicamentos' | 'correo', string>
>;

/** «penicilina, polen» → ['penicilina', 'polen'], sin vacíos. */
export function aLista(texto: string): string[] {
  return texto.split(',').map((t) => t.trim()).filter(Boolean);
}

function errorLista(texto: string): string | undefined {
  const lista = aLista(texto);
  if (lista.length > 30) return 'Hasta 30 elementos.';
  if (lista.some((t) => t.length > 100)) return 'Cada elemento tiene como máximo 100 caracteres.';
}

/**
 * `hoy` en AAAA-MM-DD; por omisión, la fecha UTC, igual que el backend
 * (`validDate` compara contra `new Date().toISOString()`).
 */
export function validarPerfil(d: DatosPerfil, hoy = new Date().toISOString().slice(0, 10)): ErroresPerfil {
  const e: ErroresPerfil = {};
  const nombre = d.nombre.trim();
  if (!nombre) e.nombre = 'Escriba el nombre.';
  else if (nombre.length > 80) e.nombre = 'El nombre tiene como máximo 80 caracteres.';

  const f = d.fechaNacimiento;
  const fecha = new Date(`${f}T00:00:00Z`);
  if (!f) e.fechaNacimiento = 'Escriba la fecha de nacimiento.';
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== f || f < '1900-01-01') {
    e.fechaNacimiento = 'Escriba una fecha válida.';
  } else if (f > hoy) e.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.';

  const alergias = errorLista(d.alergias);
  if (alergias) e.alergias = alergias;
  const medicamentos = errorLista(d.medicamentos);
  if (medicamentos) e.medicamentos = medicamentos;

  if (d.tipo === 'adulto_representado' && !RE_CORREO.test(d.correo.trim())) {
    e.correo = 'Escriba un correo válido.';
  }
  return e;
}
