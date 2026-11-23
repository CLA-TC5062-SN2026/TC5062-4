/**
 * Reglas puras del borrador. `validarRespuesta` repite `validRespuesta`
 * (backend/src/utils/http.js) para no gastar un PUT en algo que el backend
 * rechazaría; el backend sigue validando.
 */
import type { Pregunta, PuntoPendiente, TipoRespuesta, ValorRespuesta } from '@/services/conversacionesService';

const CAMPOS: Record<TipoRespuesta, (keyof ValorRespuesta)[]> = {
  opcion: ['opcion'],
  zona_cuerpo: ['opcion'],
  texto: ['texto'],
  opcion_con_texto: ['opcion', 'texto'],
  numero_u_opcion: ['numero', 'opcion'],
};

/** Mensaje para mostrar junto a la pregunta, o null si el valor es válido. */
export function validarRespuesta(pregunta: Pregunta, valor: ValorRespuesta): string | null {
  const claves = (Object.keys(valor) as (keyof ValorRespuesta)[]).filter((k) => valor[k] !== undefined);
  const permitidos = CAMPOS[pregunta.tipoRespuesta];
  if (!claves.length) {
    return pregunta.tipoRespuesta === 'numero_u_opcion'
      ? 'Escriba un número o elija una opción.'
      : pregunta.tipoRespuesta === 'texto'
        ? 'Escriba su respuesta.'
        : 'Elija una opción.';
  }
  if (!claves.every((k) => permitidos.includes(k))) return 'Esta pregunta no admite ese tipo de respuesta.';
  if (pregunta.tipoRespuesta === 'numero_u_opcion' && claves.length > 1) return 'Escriba un número o elija una opción, no ambos.';
  if (pregunta.tipoRespuesta === 'opcion_con_texto' && valor.opcion === undefined) return 'Elija una opción.';
  if (valor.opcion !== undefined && !pregunta.opciones.includes(valor.opcion)) return 'Esa opción no está en la lista.';
  if (valor.texto !== undefined) {
    if (!valor.texto.trim()) return 'Escriba su respuesta.';
    if (valor.texto.length > 2000) return 'La respuesta tiene como máximo 2000 caracteres.';
  }
  if (valor.numero !== undefined && !(Number.isFinite(valor.numero) && valor.numero >= 30 && valor.numero <= 45)) {
    return 'Escriba un valor entre 30 y 45 °C.';
  }
  return null;
}

/** El backend sólo acepta el envío sin puntos pendientes (422 CONVERSACION_INCOMPLETA). */
export function listoParaEnviar(puntosPendientes: PuntoPendiente[]): boolean {
  return puntosPendientes.length === 0;
}

/** «Faltan 2 respuestas obligatorias: …», con el texto de cada pregunta; null si no falta nada. */
export function textoPendientes(puntosPendientes: PuntoPendiente[], preguntas: Pregunta[]): string | null {
  const n = puntosPendientes.length;
  if (!n) return null;
  const cuales = puntosPendientes.map((p) => preguntas.find((q) => q.id === p.referencia)?.texto ?? p.mensaje);
  const cabeza = n === 1 ? 'Falta 1 respuesta obligatoria' : `Faltan ${n} respuestas obligatorias`;
  return `${cabeza}: ${cuales.join(' · ')}`;
}
