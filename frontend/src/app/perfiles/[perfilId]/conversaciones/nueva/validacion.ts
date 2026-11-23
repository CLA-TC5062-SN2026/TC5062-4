/**
 * Validación en cliente de una conversación nueva. Repite las reglas de
 * `POST /perfiles/{perfilId}/conversaciones` (backend/src/routes/conversaciones.js:
 * `validName` para el título, `validEtiquetas` y `medicoId`); el backend sigue validando.
 */
export interface DatosConversacion {
  titulo: string;
  etiquetas: string[];
  medicoId: string;
}

export type ErroresConversacion = Partial<Record<'titulo' | 'etiquetas' | 'medicoId', string>>;

export function validarConversacion(d: DatosConversacion): ErroresConversacion {
  const e: ErroresConversacion = {};
  const titulo = d.titulo.trim();
  if (!titulo) e.titulo = 'Escriba un título.';
  else if (titulo.length > 80) e.titulo = 'El título tiene como máximo 80 caracteres.';
  if (d.etiquetas.length < 1 || d.etiquetas.length > 3) e.etiquetas = 'Elija de 1 a 3 etiquetas.';
  if (!d.medicoId) e.medicoId = 'Elija al médico que verá la conversación.';
  return e;
}
