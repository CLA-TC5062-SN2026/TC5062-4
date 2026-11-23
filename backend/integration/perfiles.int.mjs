import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, cerrar, api, crearCuidadora, login } from './arnes.mjs';

before(iniciar);
after(cerrar);

// Respaldo de la validación en cliente (F2): el backend rechaza la fecha futura.
test('POST perfil con fecha de nacimiento futura da 422', async () => {
  const cuidadora = await crearCuidadora();
  const { accessToken } = await login(cuidadora.correo);
  const manana = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  const r = await api(`/familias/${cuidadora.familiaId}/perfiles`, {
    method: 'POST',
    token: accessToken,
    body: { tipo: 'menor', nombre: 'Niño de Prueba', fechaNacimiento: manana },
  });
  assert.equal(r.status, 422);
  assert.equal(r.body.codigo, 'DATOS_INVALIDOS');
});
