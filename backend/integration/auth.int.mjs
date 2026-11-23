import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, cerrar, api, crearCuidadora, crearMedicaEnCirculo, login } from './arnes.mjs';

before(iniciar);
after(cerrar);

test('POST /auth/login con credenciales válidas devuelve 200 y token', async () => {
  const cuidadora = await crearCuidadora();
  const r = await api('/auth/login', {
    method: 'POST',
    body: { correo: cuidadora.correo, contrasena: cuidadora.contrasena },
  });
  assert.equal(r.status, 200);
  assert.equal(typeof r.body.accessToken, 'string');
  assert.equal(r.body.usuario.rol, 'cuidador_principal');
});

test('POST /auth/login con contraseña mala devuelve 401 con el error del contrato', async () => {
  const cuidadora = await crearCuidadora();
  const r = await api('/auth/login', {
    method: 'POST',
    body: { correo: cuidadora.correo, contrasena: 'NoEsLaClave1!' },
  });
  assert.equal(r.status, 401);
  assert.deepEqual(Object.keys(r.body).sort(), ['codigo', 'correlacionId', 'mensaje']);
  assert.equal(r.body.codigo, 'NO_AUTENTICADO');
});

test('la médica creada en el círculo inicia sesión y ve la familia', async () => {
  const cuidadora = await crearCuidadora();
  const medica = await crearMedicaEnCirculo(cuidadora.familiaId);
  const sesion = await login(medica.correo);
  assert.equal(sesion.usuario.rol, 'medico');
  const r = await api(`/familias/${cuidadora.familiaId}`, { token: sesion.accessToken });
  assert.equal(r.status, 200);
});
