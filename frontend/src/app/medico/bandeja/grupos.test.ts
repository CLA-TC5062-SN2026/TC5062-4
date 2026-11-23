import { describe, expect, it } from 'vitest';
import { agruparBandeja } from './grupos';
import type { Conversacion, EstadoConversacion } from '@/services/conversacionesService';

const conv = (id: string, estado: EstadoConversacion) => ({ id, estado }) as Conversacion;

describe('agruparBandeja', () => {
  it('ordena los grupos como el guion, conserva el orden del backend y omite los vacíos', () => {
    const grupos = agruparBandeja([
      conv('a', 'CON_INDICACIONES'), conv('b', 'ENVIADA'), conv('c', 'CERRADA'),
      conv('d', 'ENVIADA'), conv('e', 'INFO_SOLICITADA'),
    ]);
    expect(grupos.map((g) => [g.titulo, g.conversaciones.map((c) => c.id)])).toEqual([
      ['Enviadas', ['b', 'd']],
      ['Con indicaciones', ['a']],
      ['Otras', ['c', 'e']],
    ]);
  });

  it('sin conversaciones no hay grupos', () => {
    expect(agruparBandeja([])).toEqual([]);
  });
});
