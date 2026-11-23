import { describe, expect, it } from 'vitest';
import { ApiError, mensajeParaUsuario } from './errores';

describe('mensajeParaUsuario', () => {
  it('401: pide volver a entrar', () => {
    const e = new ApiError(401, 'NO_AUTENTICADO', 'Token inválido');
    expect(mensajeParaUsuario(e)).toBe(
      'Su sesión se cerró por inactividad. Vuelva a entrar para continuar.',
    );
  });

  it('404: no revela si el recurso existe', () => {
    const e = new ApiError(404, 'NO_ENCONTRADO', 'Perfil no encontrado');
    expect(mensajeParaUsuario(e)).toBe(
      'No encontramos lo que busca, o ya no está disponible para usted.',
    );
  });

  it('409: correo ya registrado', () => {
    const e = new ApiError(409, 'CORREO_REGISTRADO', 'El correo ya existe');
    expect(mensajeParaUsuario(e)).toBe('Ya existe una cuenta con este correo.');
  });

  it('422: texto genérico de datos inválidos', () => {
    const e = new ApiError(422, 'DATOS_INVALIDOS', 'fechaNacimiento no puede ser futura');
    expect(mensajeParaUsuario(e)).toBe('Revise los datos: alguno no tiene el formato esperado.');
  });

  it('error de red: pide revisar la conexión', () => {
    const e = new ApiError(0, 'SIN_CONEXION', 'Failed to fetch');
    expect(e.esFalloDeRed).toBe(true);
    expect(mensajeParaUsuario(e)).toBe(
      'No pudimos contactar con DAFI. Revise su conexión e inténtelo de nuevo.',
    );
  });

  it('código sin traducción propia: usa el mensaje del API', () => {
    const e = new ApiError(500, 'ERROR_INTERNO', 'Fallo interno');
    expect(mensajeParaUsuario(e)).toBe('Fallo interno');
  });

  it('error que no viene del API: mensaje genérico', () => {
    expect(mensajeParaUsuario(new Error('x'))).toBe(
      'Ocurrió un error inesperado. Inténtelo de nuevo.',
    );
  });
});
