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

// F9: tipoSangre opcional en POST, PATCH (null lo borra) y en la respuesta.
test('tipoSangre: se crea, se cambia, se borra y rechaza valores fuera del enum', async () => {
  const cuidadora = await crearCuidadora();
  const { accessToken: token } = await login(cuidadora.correo);
  const crear = (extra) => api(`/familias/${cuidadora.familiaId}/perfiles`, {
    method: 'POST', token, body: { tipo: 'menor', nombre: 'Niña de Prueba', fechaNacimiento: '2020-05-01', ...extra },
  });

  const sinTipo = await crear({});
  assert.equal(sinTipo.status, 201);
  assert.equal(sinTipo.body.tipoSangre, null);

  const creado = await crear({ tipoSangre: 'A+' });
  assert.equal(creado.status, 201);
  const ruta = `/perfiles/${creado.body.id}`;
  assert.equal((await api(ruta, { token })).body.tipoSangre, 'A+');

  const cambio = await api(ruta, { method: 'PATCH', token, body: { tipoSangre: 'AB-' } });
  assert.equal(cambio.status, 200);
  assert.equal(cambio.body.tipoSangre, 'AB-');

  const borrado = await api(ruta, { method: 'PATCH', token, body: { tipoSangre: null } });
  assert.equal(borrado.status, 200);
  assert.equal((await api(ruta, { token })).body.tipoSangre, null);

  for (const respuesta of [
    await crear({ tipoSangre: 'C+' }),
    await api(ruta, { method: 'PATCH', token, body: { tipoSangre: 'o+' } }),
  ]) {
    assert.equal(respuesta.status, 422);
    assert.equal(respuesta.body.codigo, 'DATOS_INVALIDOS');
  }
});
