import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { iniciar, cerrar, api, pool, crearCuidadora, crearMedicaEnCirculo, login } from './arnes.mjs';

// L-29: la lista se ordena por último evento antes de paginar, no por fecha de creación.
before(async () => {
  await iniciar();
  await pool.query("INSERT INTO etiqueta (codigo, nombre) VALUES ('fiebre', 'Fiebre')");
});
after(cerrar);

test('una conversación más vieja con actividad reciente sale primero, también con limite=1', async () => {
  const cuidadora = await crearCuidadora();
  const { accessToken: token } = await login(cuidadora.correo);
  const medica = await crearMedicaEnCirculo(cuidadora.familiaId);
  const perfil = await api(`/familias/${cuidadora.familiaId}/perfiles`, {
    method: 'POST', token,
    body: { tipo: 'menor', nombre: 'Niña de Prueba', fechaNacimiento: '2020-05-02', alergias: [], medicamentos: [] },
  });
  assert.equal(perfil.status, 201);
  const crear = async (titulo) => {
    const r = await api(`/perfiles/${perfil.body.id}/conversaciones`, {
      method: 'POST', token, body: { titulo, etiquetas: ['fiebre'], medicoId: medica.id },
    });
    assert.equal(r.status, 201);
    return r.body.id;
  };
  const vieja = await crear('Vieja');
  const nueva = await crear('Nueva');
  // La vieja recibe actividad después de crear la nueva: se envía (sin preguntas pendientes).
  const envio = await api(`/conversaciones/${vieja}/envios`, {
    method: 'POST', token, headers: { 'Idempotency-Key': randomUUID() },
  });
  assert.equal(envio.status, 200);

  const lista = await api('/conversaciones?limite=1', { token });
  assert.equal(lista.status, 200);
  assert.deepEqual(lista.body.datos.map((c) => c.id), [vieja]);
  const historial = await api(`/perfiles/${perfil.body.id}/conversaciones`, { token });
  assert.deepEqual(historial.body.datos.map((c) => c.id), [vieja, nueva]);
});
