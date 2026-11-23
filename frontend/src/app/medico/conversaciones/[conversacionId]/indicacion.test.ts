import { describe, expect, it } from 'vitest';
import { cuerpoIndicacion, MAX_INDICACION, motivoSinIndicacion, validarIndicacion } from './indicacion';

const base = { texto: 'Paracetamol cada 8 horas.', decision: null, plazoDias: '' } as const;

describe('validarIndicacion', () => {
  it('pide texto y respeta el máximo', () => {
    expect(validarIndicacion({ ...base, texto: '   ' }).texto).toBe('Escriba la indicación.');
    expect(validarIndicacion({ ...base, texto: 'x'.repeat(MAX_INDICACION + 1) }).texto).toMatch(/4000/);
    expect(validarIndicacion({ ...base, texto: 'x'.repeat(MAX_INDICACION) })).toEqual({});
  });

  it('exige el plazo con consulta presencial, entero de 1 a 90', () => {
    const consulta = { ...base, decision: 'consulta_presencial' } as const;
    expect(validarIndicacion(consulta).plazoDias).toBe('Indique en cuántos días debe ser la consulta.');
    for (const plazo of ['0', '91', '2.5', 'abc']) {
      expect(validarIndicacion({ ...consulta, plazoDias: plazo }).plazoDias).toMatch(/1 a 90/);
    }
    expect(validarIndicacion({ ...consulta, plazoDias: '1' })).toEqual({});
    expect(validarIndicacion({ ...consulta, plazoDias: '90' })).toEqual({});
  });

  it('rechaza el plazo con otra decisión y acepta las demás sin plazo', () => {
    expect(validarIndicacion({ ...base, decision: 'cuidado_en_casa', plazoDias: '3' }).plazoDias).toMatch(/sólo aplica/);
    expect(validarIndicacion({ ...base, plazoDias: '3' }).plazoDias).toMatch(/sólo aplica/);
    expect(validarIndicacion({ ...base, decision: 'acudir_a_urgencias' })).toEqual({});
    expect(validarIndicacion(base)).toEqual({});
  });
});

describe('cuerpoIndicacion', () => {
  it('arma el cuerpo de B4 con el plazo sólo para consulta presencial', () => {
    expect(cuerpoIndicacion({ texto: '  Venga a consulta. ', decision: 'consulta_presencial', plazoDias: '2' }))
      .toEqual({ texto: 'Venga a consulta.', decision: 'consulta_presencial', plazoDias: 2 });
    expect(cuerpoIndicacion(base)).toEqual({ texto: base.texto, decision: null, plazoDias: null });
  });
});

describe('motivoSinIndicacion', () => {
  it('permite los mismos estados que el backend', () => {
    for (const e of ['EN_REVISION', 'INFO_SOLICITADA', 'CON_INDICACIONES'] as const) expect(motivoSinIndicacion(e)).toBeNull();
    expect(motivoSinIndicacion('CERRADA')).toMatch(/cerrada/);
    expect(motivoSinIndicacion('ENVIADA')).not.toBeNull();
  });
});
