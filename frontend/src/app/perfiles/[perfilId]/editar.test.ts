import { describe, expect, it } from 'vitest';
import { construirPatch } from './editar';

const ORIGINAL = { nombre: 'Niño Prueba', alergias: ['penicilina', 'polen'], medicamentos: [] };
const SIN_CAMBIOS = { nombre: 'Niño Prueba', alergias: 'penicilina, polen', medicamentos: '' };

describe('construirPatch', () => {
  it('nada cambió: objeto vacío', () => {
    expect(construirPatch(ORIGINAL, SIN_CAMBIOS)).toEqual({});
  });

  it('sólo incluye los campos cambiados', () => {
    expect(construirPatch(ORIGINAL, { ...SIN_CAMBIOS, medicamentos: 'salbutamol' })).toEqual({
      medicamentos: ['salbutamol'],
    });
    expect(construirPatch(ORIGINAL, { ...SIN_CAMBIOS, nombre: 'Otro Nombre', alergias: '' })).toEqual({
      nombre: 'Otro Nombre',
      alergias: [],
    });
  });

  it('compara las listas por contenido, no por cómo se escribieron', () => {
    expect(construirPatch(ORIGINAL, { ...SIN_CAMBIOS, alergias: ' penicilina ,polen, ' })).toEqual({});
    expect(construirPatch(ORIGINAL, { ...SIN_CAMBIOS, alergias: 'penicilina' })).toEqual({ alergias: ['penicilina'] });
  });

  it('recorta el nombre antes de comparar y de enviar', () => {
    expect(construirPatch(ORIGINAL, { ...SIN_CAMBIOS, nombre: '  Niño Prueba  ' })).toEqual({});
    expect(construirPatch(ORIGINAL, { ...SIN_CAMBIOS, nombre: ' Nuevo ' })).toEqual({ nombre: 'Nuevo' });
  });
});
