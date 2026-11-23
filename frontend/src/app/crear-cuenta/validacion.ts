/**
 * Validación en cliente del registro. Repite las reglas de
 * backend/src/routes/auth.js (`validName`, `validEmail`, `validPassword`,
 * `declarations`) para avisar antes de enviar; el backend sigue validando.
 */
const RE_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
  nombreFamilia: string;
  /** Las tres declaraciones de RF-01 más la lectura del aviso de privacidad. */
  aceptadas: Record<string, boolean>;
}

export type ErroresRegistro = Partial<
  Record<'nombre' | 'correo' | 'contrasena' | 'nombreFamilia' | 'declaraciones', string>
>;

export const CAMPOS_DECLARACION = [
  'mayorDeEdad',
  'consentimientoDatosPropios',
  'consentimientoDatosMenores',
  'aviso',
] as const;

export function validarRegistro(d: DatosRegistro): ErroresRegistro {
  const e: ErroresRegistro = {};
  const nombre = d.nombre.trim();
  if (!nombre) e.nombre = 'Escriba su nombre.';
  else if (nombre.length > 80) e.nombre = 'El nombre tiene como máximo 80 caracteres.';

  const correo = d.correo.trim();
  if (!RE_CORREO.test(correo) || correo.length > 254) e.correo = 'Escriba un correo válido.';

  if (d.contrasena.length < 8 || d.contrasena.length > 72) {
    e.contrasena = 'La contraseña debe tener entre 8 y 72 caracteres.';
  }

  const familia = d.nombreFamilia.trim();
  if (!familia) e.nombreFamilia = 'Escriba el nombre de su familia.';
  else if (familia.length > 80) e.nombreFamilia = 'El nombre tiene como máximo 80 caracteres.';

  if (!CAMPOS_DECLARACION.every((c) => d.aceptadas[c])) {
    e.declaraciones = 'Marque todas las declaraciones para crear la cuenta.';
  }
  return e;
}
