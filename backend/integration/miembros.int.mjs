import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, cerrar, api, crearCuidadora, crearMedicaEnCirculo, login } from './arnes.mjs';

before(iniciar);
after(cerrar);

async function cuidadoraConSesion() {
  const cuidadora = await crearCuidadora();
  const { accessToken } = await login(cuidadora.correo);
  return { ...cuidadora, token: accessToken };
}

test('la cuidadora ve a su médica con ?rol=medico', async () => {
  const cuidadora = await cuidadoraConSesion();
  const medica = await crearMedicaEnCirculo(cuidadora.familiaId);
  const r = await api(`/familias/${cuidadora.familiaId}/miembros?rol=medico`, { token: cuidadora.token });
  assert.equal(r.status, 200);
  assert.equal(r.body.length, 1);
  const [m] = r.body;
  assert.equal(m.usuarioId, medica.id);
  assert.equal(m.rol, 'medico');
  assert.equal(m.especialidad, 'Pediatría');
  assert.equal(m.leyenda, 'Contacto agregado por usted');
  assert.ok(!Number.isNaN(Date.parse(m.desde)));
});

test('sin filtro lista a la cuidadora y a la médica', async () => {
  const cuidadora = await cuidadoraConSesion();
  await crearMedicaEnCirculo(cuidadora.familiaId);
  const r = await api(`/familias/${cuidadora.familiaId}/miembros`, { token: cuidadora.token });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.map((m) => m.rol), ['cuidador_principal', 'medico']);
  assert.equal(r.body[0].leyenda, null);
});

test('lista vacía si no hay médicos en el círculo', async () => {
  const cuidadora = await cuidadoraConSesion();
  const r = await api(`/familias/${cuidadora.familiaId}/miembros?rol=medico`, { token: cuidadora.token });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, []);
});

test('cuidadora de otra familia recibe 404', async () => {
  const propia = await cuidadoraConSesion();
  const ajena = await cuidadoraConSesion();
  await crearMedicaEnCirculo(ajena.familiaId);
  const r = await api(`/familias/${ajena.familiaId}/miembros`, { token: propia.token });
  assert.equal(r.status, 404);
  assert.equal(r.body.codigo, 'NO_ENCONTRADO');
});

test('la médica recibe 403 aunque esté en el círculo', async () => {
  const cuidadora = await cuidadoraConSesion();
  const medica = await crearMedicaEnCirculo(cuidadora.familiaId);
  const { accessToken } = await login(medica.correo);
  const r = await api(`/familias/${cuidadora.familiaId}/miembros`, { token: accessToken });
  assert.equal(r.status, 403);
  assert.equal(r.body.codigo, 'SIN_PERMISOS');
});

test('rol fuera del enum es 422', async () => {
  const cuidadora = await cuidadoraConSesion();
  const r = await api(`/familias/${cuidadora.familiaId}/miembros?rol=doctor`, { token: cuidadora.token });
  assert.equal(r.status, 422);
  assert.equal(r.body.codigo, 'DATOS_INVALIDOS');
});

test('sin token, 401', async () => {
  const cuidadora = await crearCuidadora();
  const r = await api(`/familias/${cuidadora.familiaId}/miembros`);
  assert.equal(r.status, 401);
  assert.equal(r.body.codigo, 'NO_AUTENTICADO');
});
