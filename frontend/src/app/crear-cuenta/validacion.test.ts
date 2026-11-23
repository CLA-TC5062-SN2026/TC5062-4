import { describe, expect, it } from 'vitest';
import { validarRegistro } from './validacion';
import type { DatosRegistro } from './validacion';

const VALIDOS: DatosRegistro = {
  nombre: 'Ana Prueba López',
  correo: 'ana.prueba@correo.com',
  contrasena: 'ClaveFicticia1',
  nombreFamilia: 'Familia Prueba',
  aceptadas: {
    mayorDeEdad: true,
    consentimientoDatosPropios: true,
    consentimientoDatosMenores: true,
    aviso: true,
  },
};

describe('validarRegistro', () => {
  it('datos completos: sin errores', () => {
    expect(validarRegistro(VALIDOS)).toEqual({});
  });

  it('correo inválido', () => {
    expect(validarRegistro({ ...VALIDOS, correo: 'ana@correo' })).toEqual({
      correo: 'Escriba un correo válido.',
    });
  });

  it('contraseña corta (menos de 8)', () => {
    expect(validarRegistro({ ...VALIDOS, contrasena: 'corta12' }).contrasena).toBe(
      'La contraseña debe tener entre 8 y 72 caracteres.',
    );
  });

  it('contraseña de más de 72 caracteres', () => {
    expect(validarRegistro({ ...VALIDOS, contrasena: 'x'.repeat(73) }).contrasena).toBeDefined();
  });

  it('falta una declaración', () => {
    const aceptadas = { ...VALIDOS.aceptadas, consentimientoDatosMenores: false };
    expect(validarRegistro({ ...VALIDOS, aceptadas })).toEqual({
      declaraciones: 'Marque todas las declaraciones para crear la cuenta.',
    });
  });

  it('campos obligatorios vacíos o solo con espacios', () => {
    const e = validarRegistro({ ...VALIDOS, nombre: '  ', nombreFamilia: '' });
    expect(e.nombre).toBe('Escriba su nombre.');
    expect(e.nombreFamilia).toBe('Escriba el nombre de su familia.');
  });
});
