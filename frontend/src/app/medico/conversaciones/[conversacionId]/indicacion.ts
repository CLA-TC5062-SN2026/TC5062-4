/**
 * Validación en cliente de una indicación. Repite `validIndicacion`
 * (backend/src/utils/http.js); el backend sigue validando.
 */
import type { Decision, EstadoConversacion, NuevaIndicacion } from '@/services/conversacionesService';

export const MAX_INDICACION = 4000;

export const DECISIONES: { valor: Decision | null; texto: string }[] = [
  { valor: 'cuidado_en_casa', texto: 'Cuidado en casa' },
  { valor: 'consulta_presencial', texto: 'Consulta presencial' },
  { valor: 'acudir_a_urgencias', texto: 'Acudir a urgencias' },
  { valor: null, texto: 'Sin decisión' },
];

export interface DatosIndicacion {
  texto: string;
  decision: Decision | null;
  /** Tal como viene del campo: '' si está vacío. */
  plazoDias: string;
}

export type ErroresIndicacion = Partial<Record<'texto' | 'plazoDias', string>>;

export function validarIndicacion(d: DatosIndicacion): ErroresIndicacion {
  const e: ErroresIndicacion = {};
  const texto = d.texto.trim();
  if (!texto) e.texto = 'Escriba la indicación.';
  else if (texto.length > MAX_INDICACION) e.texto = `La indicación admite hasta ${MAX_INDICACION} caracteres.`;
  const plazo = d.plazoDias.trim();
  if (d.decision === 'consulta_presencial') {
    const n = Number(plazo);
    if (!plazo) e.plazoDias = 'Indique en cuántos días debe ser la consulta.';
    else if (!Number.isInteger(n) || n < 1 || n > 90) e.plazoDias = 'El plazo es un número entero de 1 a 90 días.';
  } else if (plazo) {
    e.plazoDias = 'El plazo sólo aplica a la consulta presencial.';
  }
  return e;
}

/** Cuerpo de B4; llamar sólo si `validarIndicacion` no devolvió errores. */
export function cuerpoIndicacion(d: DatosIndicacion): NuevaIndicacion {
  return {
    texto: d.texto.trim(),
    decision: d.decision,
    plazoDias: d.decision === 'consulta_presencial' ? Number(d.plazoDias.trim()) : null,
  };
}

/** Los mismos estados en que el backend acepta B4; en los demás responde 409. */
export function motivoSinIndicacion(estado: EstadoConversacion): string | null {
  if (['EN_REVISION', 'INFO_SOLICITADA', 'CON_INDICACIONES'].includes(estado)) return null;
  if (estado === 'CERRADA') return 'La conversación está cerrada: ya no admite indicaciones.';
  return 'En este estado no se pueden registrar indicaciones.';
}
