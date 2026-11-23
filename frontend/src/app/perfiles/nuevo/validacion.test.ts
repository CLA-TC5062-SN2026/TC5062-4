import { describe, expect, it } from 'vitest';
import { aLista, validarPerfil } from './validacion';
import type { DatosPerfil } from './validacion';

const HOY = '2026-11-23';
const MENOR: DatosPerfil = {
  tipo: 'menor',
  nombre: 'Niño Prueba',
  fechaNacimiento: '2021-03-14',
  alergias: 'penicilina',
  medicamentos: '',
  correo: '',
};

describe('validarPerfil', () => {
  it('casos válidos para cada tipo', () => {
    expect(validarPerfil(MENOR, HOY)).toEqual({});
    expect(validarPerfil({ ...MENOR, tipo: 'propio', fechaNacimiento: HOY }, HOY)).toEqual({});
    expect(
      validarPerfil({ ...MENOR, tipo: 'adulto_representado', correo: 'adulto.prueba@correo.com' }, HOY)
    ).toEqual({});
  });

  it.each(['menor', 'propio', 'adulto_representado'] as const)('fecha futura (%s)', (tipo) => {
    const e = validarPerfil({ ...MENOR, tipo, correo: 'a@b.co', fechaNacimiento: '2026-11-24' }, HOY);
    expect(e).toEqual({ fechaNacimiento: 'La fecha de nacimiento no puede ser futura.' });
  });

  it('fecha vacía o inexistente', () => {
    expect(validarPerfil({ ...MENOR, fechaNacimiento: '' }, HOY).fechaNacimiento).toBe(
      'Escriba la fecha de nacimiento.'
    );
    expect(validarPerfil({ ...MENOR, fechaNacimiento: '2023-02-30' }, HOY).fechaNacimiento).toBe(
      'Escriba una fecha válida.'
    );
  });

  it('adulto representado sin correo o con correo inválido', () => {
    const adulto = { ...MENOR, tipo: 'adulto_representado' as const };
    expect(validarPerfil(adulto, HOY)).toEqual({ correo: 'Escriba un correo válido.' });
    expect(validarPerfil({ ...adulto, correo: 'adulto@correo' }, HOY).correo).toBeDefined();
  });

  it('el correo no se pide a menores ni a perfiles propios', () => {
    expect(validarPerfil({ ...MENOR, tipo: 'propio' }, HOY).correo).toBeUndefined();
  });

  it('nombre vacío o de más de 80 caracteres', () => {
    expect(validarPerfil({ ...MENOR, nombre: '   ' }, HOY)).toEqual({ nombre: 'Escriba el nombre.' });
    expect(validarPerfil({ ...MENOR, nombre: 'x'.repeat(81) }, HOY).nombre).toBeDefined();
  });

  it('alergias: más de 30 o una de más de 100 caracteres', () => {
    const treintaYUna = Array.from({ length: 31 }, (_, i) => `a${i}`).join(',');
    expect(validarPerfil({ ...MENOR, alergias: treintaYUna }, HOY).alergias).toBe('Hasta 30 elementos.');
    expect(validarPerfil({ ...MENOR, medicamentos: 'x'.repeat(101) }, HOY).medicamentos).toBeDefined();
  });
});

describe('aLista', () => {
  it('separa por comas y descarta vacíos', () => {
    expect(aLista(' penicilina, , polen ,')).toEqual(['penicilina', 'polen']);
    expect(aLista('')).toEqual([]);
  });
});
