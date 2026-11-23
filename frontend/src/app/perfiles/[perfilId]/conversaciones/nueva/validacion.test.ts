import { describe, expect, it } from 'vitest';
import { validarConversacion } from './validacion';
import type { DatosConversacion } from './validacion';

const VALIDA: DatosConversacion = {
  titulo: 'Fiebre desde la tarde',
  etiquetas: ['fiebre'],
  medicoId: '3f1c2b9a-7d4e-4c1a-9b2e-5a6d7c8e9f01',
};

describe('validarConversacion', () => {
  it('caso válido, de 1 a 3 etiquetas', () => {
    expect(validarConversacion(VALIDA)).toEqual({});
    expect(validarConversacion({ ...VALIDA, etiquetas: ['fiebre', 'piel', 'respiratorio'] })).toEqual({});
  });

  it('sin etiquetas', () => {
    expect(validarConversacion({ ...VALIDA, etiquetas: [] })).toEqual({ etiquetas: 'Elija de 1 a 3 etiquetas.' });
  });

  it('cuatro etiquetas', () => {
    const e = validarConversacion({ ...VALIDA, etiquetas: ['fiebre', 'piel', 'respiratorio', 'otro'] });
    expect(e).toEqual({ etiquetas: 'Elija de 1 a 3 etiquetas.' });
  });

  it('sin médico', () => {
    expect(validarConversacion({ ...VALIDA, medicoId: '' })).toEqual({
      medicoId: 'Elija al médico que verá la conversación.',
    });
  });

  it('título vacío o de más de 80 caracteres', () => {
    expect(validarConversacion({ ...VALIDA, titulo: '   ' })).toEqual({ titulo: 'Escriba un título.' });
    expect(validarConversacion({ ...VALIDA, titulo: 'x'.repeat(81) }).titulo).toBeDefined();
    expect(validarConversacion({ ...VALIDA, titulo: `  ${'x'.repeat(80)}  ` })).toEqual({});
  });
});
