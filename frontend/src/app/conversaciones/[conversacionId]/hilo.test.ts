import { describe, expect, it } from 'vitest';
import {
  MAX_MENSAJE, motivoSinMensajes, ordenarEventos, puedeEnviarMensaje, textoCambioEstado,
  textoDecision, textoRespuesta, validarMensaje,
} from './hilo';
import type { Evento, Pregunta } from '@/services/conversacionesService';

const MEDICA = { id: 'm', nombre: 'Dra. Laura Méndez Ortiz', rol: 'medico' };
const MARIA = { id: 'c', nombre: 'María Ruán Aguilar', rol: 'cuidador_principal' };

const evento = (cambios: Partial<Evento>): Evento => ({
  id: 'e', conversacionId: 'c1', tipo: 'mensaje', fecha: '2026-11-23T10:00:00.000Z', texto: null,
  estadoAnterior: null, estadoNuevo: null, autor: MARIA, indicacion: null, ...cambios,
});

describe('textoCambioEstado', () => {
  it('nombra a la médica al enviar y al abrir', () => {
    const enviada = evento({ tipo: 'cambio_estado', estadoAnterior: 'BORRADOR', estadoNuevo: 'ENVIADA' });
    expect(textoCambioEstado(enviada, MEDICA.nombre)).toBe('Enviada a Dra. Laura Méndez Ortiz');
    const abierta = evento({ tipo: 'cambio_estado', estadoAnterior: 'ENVIADA', estadoNuevo: 'EN_REVISION', autor: MEDICA });
    expect(textoCambioEstado(abierta, MEDICA.nombre)).toBe('Dra. Laura Méndez Ortiz abrió la conversación');
  });

  it('describe la indicación y el cierre', () => {
    const ind = evento({ tipo: 'cambio_estado', estadoAnterior: 'EN_REVISION', estadoNuevo: 'CON_INDICACIONES', autor: MEDICA });
    expect(textoCambioEstado(ind, null)).toBe('Dra. Laura Méndez Ortiz registró una indicación');
    const cerrada = evento({ tipo: 'cambio_estado', estadoAnterior: 'CON_INDICACIONES', estadoNuevo: 'CERRADA', autor: MARIA });
    expect(textoCambioEstado(cerrada, null)).toBe('María Ruán Aguilar cerró la conversación');
  });
});

describe('textoDecision', () => {
  it('traduce cada decisión a palabras llanas', () => {
    expect(textoDecision('cuidado_en_casa', null)).toBe('Cuidado en casa');
    expect(textoDecision('consulta_presencial', 3)).toBe('Consulta presencial en 3 días');
    expect(textoDecision('consulta_presencial', 1)).toBe('Consulta presencial en 1 día');
    expect(textoDecision('acudir_a_urgencias', null)).toBe('Acudir a urgencias');
    expect(textoDecision(null, null)).toBeNull();
  });
});

describe('ordenarEventos', () => {
  it('ordena por fecha y, con la misma fecha, pone el cambio de estado antes de la indicación', () => {
    const mismaFecha = '2026-11-23T11:00:00.000Z';
    const indicacion = evento({ id: 'i', tipo: 'indicacion', fecha: mismaFecha });
    const cambio = evento({ id: 'c', tipo: 'cambio_estado', fecha: mismaFecha });
    const mensajeTarde = evento({ id: 'm2', fecha: '2026-11-23T12:00:00.000Z' });
    const mensajeTemprano = evento({ id: 'm1', fecha: '2026-11-23T09:00:00.000Z' });
    const ordenados = ordenarEventos([mensajeTarde, indicacion, cambio, mensajeTemprano]);
    expect(ordenados.map((e) => e.id)).toEqual(['m1', 'c', 'i', 'm2']);
  });
});

describe('puedeEnviarMensaje y motivoSinMensajes', () => {
  it('bloquea BORRADOR y CERRADA, como el backend', () => {
    expect(puedeEnviarMensaje('BORRADOR')).toBe(false);
    expect(puedeEnviarMensaje('CERRADA')).toBe(false);
    for (const e of ['ENVIADA', 'EN_REVISION', 'INFO_SOLICITADA', 'CON_INDICACIONES', 'SIN_MEDICO'] as const) {
      expect(puedeEnviarMensaje(e)).toBe(true);
      expect(motivoSinMensajes(e)).toBeNull();
    }
    expect(motivoSinMensajes('CERRADA')).toMatch(/cerrada/);
  });
});

describe('validarMensaje', () => {
  it('rechaza vacío, sólo espacios y más de 4000 caracteres', () => {
    expect(validarMensaje('')).toBe('Escriba un mensaje.');
    expect(validarMensaje('   \n ')).toBe('Escriba un mensaje.');
    expect(validarMensaje('a'.repeat(MAX_MENSAJE + 1))).toMatch(/4000/);
    expect(validarMensaje(`  ${'a'.repeat(MAX_MENSAJE)}  `)).toBeNull();
    expect(validarMensaje('Gracias, doctora')).toBeNull();
  });
});

describe('textoRespuesta', () => {
  const F1: Pregunta = {
    id: 'F1', texto: 'Temperatura más alta que midió', tipoRespuesta: 'numero_u_opcion',
    opciones: ['No la he medido'], obligatoria: true, etiqueta: 'fiebre',
  };
  it('convierte el número que llega como texto y une opción y detalle', () => {
    expect(textoRespuesta({ ...F1, respuesta: { id: 'r', opcion: null, texto: null, numero: '38.60' } })).toBe('38.6 °C');
    expect(textoRespuesta({ ...F1, respuesta: { id: 'r', opcion: 'No la he medido', texto: null, numero: null } })).toBe('No la he medido');
    expect(textoRespuesta({ ...F1, tipoRespuesta: 'opcion_con_texto', respuesta: { id: 'r', opcion: 'Sí', texto: 'En la noche', numero: null } })).toBe('Sí · En la noche');
    expect(textoRespuesta(F1)).toBeNull();
  });
});
