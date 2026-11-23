import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { iniciar, cerrar, api, pool, crearCuidadora, crearMedicaEnCirculo, login } from './arnes.mjs';

// Catálogo mínimo: F1 y F3 obligatorias de fiebre, F2 opcional de fiebre y P1 de piel.
async function catalogo() {
  await pool.query("INSERT INTO etiqueta (codigo, nombre) VALUES ('fiebre', 'Fiebre'), ('piel', 'Piel')");
  const preguntas = [
    ['F1', 'Temperatura más alta que midió', 'numero_u_opcion', ['No la he medido'], true, 'fiebre'],
    ['F2', '¿Dónde la midió?', 'opcion', ['Axila', 'Boca'], false, 'fiebre'],
    ['F3', '¿Desde cuándo tiene fiebre?', 'texto', [], true, 'fiebre'],
    ['P1', '¿Dónde está la lesión?', 'opcion', ['Brazo', 'Pierna'], true, 'piel'],
  ];
  for (const [codigo, texto, tipo, opciones, obligatoria, etiqueta] of preguntas) {
    await pool.query(`
      WITH q AS (
        INSERT INTO pregunta_contexto (codigo, texto, tipo_respuesta, opciones, obligatoria)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      )
      INSERT INTO etiqueta_pregunta (etiqueta_id, pregunta_id)
      SELECT e.id, q.id FROM etiqueta e, q WHERE e.codigo = $6
    `, [codigo, texto, tipo, opciones, obligatoria, etiqueta]);
  }
}

before(async () => {
  await iniciar();
  await catalogo();
});
after(cerrar);

// Cuidadora con sesión, médica en su círculo y un borrador de fiebre.
async function borrador() {
  const cuidadora = await crearCuidadora();
  const { accessToken: token } = await login(cuidadora.correo);
  const medica = await crearMedicaEnCirculo(cuidadora.familiaId);
  const perfil = await api(`/familias/${cuidadora.familiaId}/perfiles`, {
    method: 'POST', token,
    body: { tipo: 'menor', nombre: 'Niño de Prueba', fechaNacimiento: '2021-03-14', alergias: [], medicamentos: [] },
  });
  assert.equal(perfil.status, 201);
  const conv = await api(`/perfiles/${perfil.body.id}/conversaciones`, {
    method: 'POST', token,
    body: { titulo: 'Fiebre de prueba', etiquetas: ['fiebre'], medicoId: medica.id },
  });
  assert.equal(conv.status, 201);
  return { token, medica, id: conv.body.id };
}

const responder = (id, pregunta, body, token) =>
  api(`/conversaciones/${id}/preguntas/${pregunta}/respuesta`, { method: 'PUT', token, body });
const enviar = (id, token) =>
  api(`/conversaciones/${id}/envios`, { method: 'POST', token, headers: { 'Idempotency-Key': randomUUID() } });

test('guardar da 201, reemplazar da 200 y el detalle lo refleja', async () => {
  const { token, id } = await borrador();
  const antes = await api(`/conversaciones/${id}`, { token });
  assert.deepEqual(antes.body.puntosPendientes.map((p) => p.referencia), ['F1', 'F3']);

  const primera = await responder(id, 'F1', { numero: 38.6 }, token);
  assert.equal(primera.status, 201);
  assert.equal(primera.body.preguntaId, 'F1');
  assert.equal(primera.body.numero, 38.6);
  assert.equal(primera.body.opcion, null);
  assert.equal(primera.body.autor.rol, 'cuidador_principal');
  assert.ok(!Number.isNaN(Date.parse(primera.body.registradaEn)));

  const segunda = await responder(id, 'F1', { opcion: 'No la he medido' }, token);
  assert.equal(segunda.status, 200);
  assert.equal(segunda.body.opcion, 'No la he medido');
  assert.equal(segunda.body.numero, null);

  // Repetir el mismo valor no crea otro evento.
  assert.equal((await responder(id, 'F1', { opcion: 'No la he medido' }, token)).status, 200);
  const eventos = await api(`/conversaciones/${id}/eventos`, { token });
  assert.deepEqual(eventos.body.datos.map((e) => e.tipo), ['respuesta', 'respuesta']);

  const despues = await api(`/conversaciones/${id}`, { token });
  const f1 = despues.body.preguntas.find((q) => q.id === 'F1');
  assert.equal(f1.respuesta.opcion, 'No la he medido');
  assert.deepEqual(despues.body.puntosPendientes.map((p) => p.referencia), ['F3']);
});

test('con las obligatorias respondidas el envío pasa de 422 a 200; después, 409', async () => {
  const { token, id } = await borrador();
  assert.equal((await responder(id, 'F1', { numero: 39 }, token)).status, 201);
  const incompleta = await enviar(id, token);
  assert.equal(incompleta.status, 422);
  assert.equal(incompleta.body.codigo, 'CONVERSACION_INCOMPLETA');

  assert.equal((await responder(id, 'F3', { texto: 'Desde anoche' }, token)).status, 201);
  assert.equal((await enviar(id, token)).status, 200);

  const tarde = await responder(id, 'F3', { texto: 'Desde ayer' }, token);
  assert.equal(tarde.status, 409);
  assert.equal(tarde.body.codigo, 'TRANSICION_INVALIDA');
});

test('la médica recibe 403', async () => {
  const { token, medica, id } = await borrador();
  assert.equal((await responder(id, 'F1', { numero: 38 }, token)).status, 201);
  const { accessToken } = await login(medica.correo);
  const r = await responder(id, 'F1', { numero: 39 }, accessToken);
  assert.equal(r.status, 403);
  assert.equal(r.body.codigo, 'SIN_PERMISOS');
});

test('cuidadora de otra familia recibe 404', async () => {
  const { id } = await borrador();
  const ajena = await crearCuidadora();
  const { accessToken } = await login(ajena.correo);
  assert.equal((await responder(id, 'F1', { numero: 38 }, accessToken)).status, 404);
});

test('pregunta que no aplica o no existe da 404', async () => {
  const { token, id } = await borrador();
  for (const pregunta of ['P1', 'Z9']) {
    const r = await responder(id, pregunta, { opcion: 'Brazo' }, token);
    assert.equal(r.status, 404);
    assert.equal(r.body.codigo, 'NO_ENCONTRADO');
  }
});

test('valor con tipo equivocado o fuera de rango da 422', async () => {
  const { token, id } = await borrador();
  for (const [pregunta, body] of [
    ['F1', { texto: '38' }],
    ['F1', { numero: 46 }],
    ['F2', { opcion: 'Pie' }],
    ['F3', { texto: '   ' }],
  ]) {
    const r = await responder(id, pregunta, body, token);
    assert.equal(r.status, 422, `${pregunta} ${JSON.stringify(body)}`);
    assert.equal(r.body.codigo, 'DATOS_INVALIDOS');
  }
});
