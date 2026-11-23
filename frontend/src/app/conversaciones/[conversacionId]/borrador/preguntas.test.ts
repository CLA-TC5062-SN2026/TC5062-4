import { describe, expect, it } from 'vitest';
import { listoParaEnviar, textoPendientes, validarRespuesta } from './preguntas';
import type { Pregunta, PuntoPendiente } from '@/services/conversacionesService';

// Preguntas de fiebre del seed de demo (backend/scripts/demo_seed.mjs).
const F1: Pregunta = {
  id: 'F1', texto: 'Temperatura más alta que midió', tipoRespuesta: 'numero_u_opcion',
  opciones: ['No la he medido'], obligatoria: true, etiqueta: 'fiebre',
};
const F2: Pregunta = {
  id: 'F2', texto: '¿Dónde la midió?', tipoRespuesta: 'opcion',
  opciones: ['Axila', 'Boca', 'Oído', 'Frente', 'Recto'], obligatoria: false, etiqueta: 'fiebre',
};
const F3: Pregunta = {
  id: 'F3', texto: '¿Desde cuándo tiene fiebre?', tipoRespuesta: 'texto',
  opciones: [], obligatoria: true, etiqueta: 'fiebre',
};
const MIXTA: Pregunta = {
  id: 'X1', texto: 'Ficticia', tipoRespuesta: 'opcion_con_texto',
  opciones: ['Sí', 'No'], obligatoria: false, etiqueta: null,
};
const pendiente = (referencia: string): PuntoPendiente => ({ tipo: 'pregunta', referencia, mensaje: `Falta responder ${referencia}` });

describe('listoParaEnviar y textoPendientes', () => {
  it('sin pendientes está listo y no hay aviso', () => {
    expect(listoParaEnviar([])).toBe(true);
    expect(textoPendientes([], [F1, F3])).toBeNull();
  });

  it('con pendientes no está listo y nombra cada pregunta', () => {
    const puntos = [pendiente('F1'), pendiente('F3')];
    expect(listoParaEnviar(puntos)).toBe(false);
    expect(textoPendientes(puntos, [F1, F2, F3])).toBe(
      'Faltan 2 respuestas obligatorias: Temperatura más alta que midió · ¿Desde cuándo tiene fiebre?'
    );
    expect(textoPendientes([pendiente('F3')], [F3])).toBe('Falta 1 respuesta obligatoria: ¿Desde cuándo tiene fiebre?');
  });

  it('una referencia sin pregunta usa el mensaje del backend', () => {
    expect(textoPendientes([pendiente('G9')], [F1])).toBe('Falta 1 respuesta obligatoria: Falta responder G9');
  });
});

describe('validarRespuesta', () => {
  it('casos válidos por tipo', () => {
    expect(validarRespuesta(F1, { numero: 38.6 })).toBeNull();
    expect(validarRespuesta(F1, { numero: 30 })).toBeNull();
    expect(validarRespuesta(F1, { numero: 45 })).toBeNull();
    expect(validarRespuesta(F1, { opcion: 'No la he medido' })).toBeNull();
    expect(validarRespuesta(F2, { opcion: 'Axila' })).toBeNull();
    expect(validarRespuesta(F3, { texto: 'Desde anoche' })).toBeNull();
    expect(validarRespuesta(MIXTA, { opcion: 'Sí' })).toBeNull();
    expect(validarRespuesta(MIXTA, { opcion: 'Sí', texto: 'Dos veces' })).toBeNull();
  });

  it('número fuera de 30 a 45 o ilegible', () => {
    for (const numero of [29.9, 45.1, 386, Number.NaN]) {
      expect(validarRespuesta(F1, { numero })).toBe('Escriba un valor entre 30 y 45 °C.');
    }
  });

  it('texto vacío o demasiado largo', () => {
    expect(validarRespuesta(F3, { texto: '   ' })).toBe('Escriba su respuesta.');
    expect(validarRespuesta(F3, {})).toBe('Escriba su respuesta.');
    expect(validarRespuesta(F3, { texto: 'a'.repeat(2001) })).toBe('La respuesta tiene como máximo 2000 caracteres.');
  });

  it('opción que no está en la lista', () => {
    expect(validarRespuesta(F2, { opcion: 'Pie' })).toBe('Esa opción no está en la lista.');
    expect(validarRespuesta(F1, { opcion: 'Axila' })).toBe('Esa opción no está en la lista.');
  });

  it('campos que el tipo no admite o combinaciones inválidas', () => {
    expect(validarRespuesta(F1, {})).toBe('Escriba un número o elija una opción.');
    expect(validarRespuesta(F1, { numero: 38, opcion: 'No la he medido' })).toBe('Escriba un número o elija una opción, no ambos.');
    expect(validarRespuesta(F2, { texto: 'Axila' })).toBe('Esta pregunta no admite ese tipo de respuesta.');
    expect(validarRespuesta(MIXTA, { texto: 'Sin opción' })).toBe('Elija una opción.');
  });
});
