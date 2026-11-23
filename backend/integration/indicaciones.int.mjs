import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { iniciar, cerrar, api, base, pool, crearCuidadora, crearMedicaEnCirculo, login } from './arnes.mjs';

// B4 (RF-15): la médica asignada registra indicaciones y la conversación queda en CON_INDICACIONES.
before(async () => {
  await iniciar();
  await pool.query("INSERT INTO etiqueta (codigo, nombre) VALUES ('fiebre', 'Fiebre')");
  await pool.query(`
    WITH q AS (
      INSERT INTO pregunta_contexto (codigo, texto, tipo_respuesta, opciones, obligatoria)
      VALUES ('F1', '¿Desde cuándo tiene fiebre?', 'texto', '{}', true) RETURNING id
    )
    INSERT INTO etiqueta_pregunta (etiqueta_id, pregunta_id)
    SELECT e.id, q.id FROM etiqueta e, q WHERE e.codigo = 'fiebre'
  `);
});
after(cerrar);

// Conversación enviada con médica asignada; `abierta` hace que ella la lea (ENVIADA -> EN_REVISION).
async function conversacion({ enviada = true, abierta = true } = {}) {
  const cuidadora = await crearCuidadora();
  const { accessToken: token } = await login(cuidadora.correo);
  const medica = await crearMedicaEnCirculo(cuidadora.familiaId);
  const perfil = await api(`/familias/${cuidadora.familiaId}/perfiles`, {
    method: 'POST', token,
    body: { tipo: 'menor', nombre: 'Niño de Prueba', fechaNacimiento: '2020-05-02', alergias: [], medicamentos: [] },
  });
  assert.equal(perfil.status, 201);
  const conv = await api(`/perfiles/${perfil.body.id}/conversaciones`, {
    method: 'POST', token,
    body: { titulo: 'Fiebre de prueba', etiquetas: ['fiebre'], medicoId: medica.id },
  });
  assert.equal(conv.status, 201);
  const id = conv.body.id;
  const { accessToken: tokenMedica } = await login(medica.correo);
  if (enviada) {
    await api(`/conversaciones/${id}/preguntas/F1/respuesta`, { method: 'PUT', token, body: { texto: 'Desde ayer' } });
    const envio = await api(`/conversaciones/${id}/envios`, {
      method: 'POST', token, headers: { 'Idempotency-Key': randomUUID() },
    });
    assert.equal(envio.status, 200);
    if (abierta) assert.equal((await api(`/conversaciones/${id}`, { token: tokenMedica })).body.estado, 'EN_REVISION');
  }
  return { cuidadora, token, medica, tokenMedica, perfilId: perfil.body.id, id };
}

// fetch directo y no `api`: aquí también importan las cabeceras (Location, Idempotency-Replayed).
async function indicar(id, token, body, key = randomUUID()) {
  const res = await fetch(`${base}/conversaciones/${id}/indicaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'Idempotency-Key': key },
    body: JSON.stringify(body),
  });
  return { status: res.status, headers: res.headers, body: await res.json() };
}

async function eventos(id, token) {
  const r = await api(`/conversaciones/${id}/eventos`, { token });
  assert.equal(r.status, 200);
  return r.body.datos;
}
const contar = (lista, tipo) => lista.filter((e) => e.tipo === tipo).length;

test('indicación válida da 201, deja CON_INDICACIONES y registra cambio_estado + indicacion', async () => {
  const { token, medica, tokenMedica, id } = await conversacion();
  const antes = (await api(`/conversaciones/${id}`, { token })).body.version;
  const key = randomUUID();
  const body = { texto: 'Acuda a consulta esta semana', decision: 'consulta_presencial', plazoDias: 3 };
  const r = await indicar(id, tokenMedica, body, key);
  assert.equal(r.status, 201);
  assert.equal(r.body.texto, body.texto);
  assert.equal(r.body.decision, 'consulta_presencial');
  assert.equal(r.body.plazoDias, 3);
  assert.equal(r.body.vigente, true);
  assert.deepEqual(r.body.medico, { id: medica.id, nombre: 'Médica de Prueba', rol: 'medico' });
  assert.ok(r.body.registradaEn);
  assert.equal(r.headers.get('location'), `/api/v1/conversaciones/${id}/eventos/${r.body.id}`);

  const detalle = (await api(`/conversaciones/${id}`, { token })).body;
  assert.equal(detalle.estado, 'CON_INDICACIONES');
  assert.equal(detalle.version, antes + 1);
  const lista = await eventos(id, token);
  assert.equal(contar(lista, 'indicacion'), 1);
  assert.ok(lista.some((e) => e.estadoAnterior === 'EN_REVISION' && e.estadoNuevo === 'CON_INDICACIONES'));

  // Misma clave y mismo cuerpo: misma respuesta, marcada como repetida, sin filas nuevas.
  const otra = await indicar(id, tokenMedica, body, key);
  assert.equal(otra.status, 201);
  assert.equal(otra.headers.get('idempotency-replayed'), 'true');
  assert.deepEqual(otra.body, r.body);
  assert.equal((await eventos(id, token)).length, lista.length);
  assert.equal((await api(`/conversaciones/${id}`, { token })).body.version, antes + 1);

  // Misma clave con otro cuerpo: 422 como en /mensajes.
  assert.equal((await indicar(id, tokenMedica, { texto: 'Otra cosa' }, key)).status, 422);
});

test('segunda indicación en CON_INDICACIONES: solo evento indicacion y la anterior deja de ser vigente (L-23)', async () => {
  const { token, tokenMedica, id } = await conversacion();
  const primera = await indicar(id, tokenMedica, { texto: 'Líquidos y reposo', decision: 'cuidado_en_casa' });
  assert.equal(primera.status, 201);
  const cambiosAntes = contar(await eventos(id, token), 'cambio_estado');

  const segunda = await indicar(id, tokenMedica, { texto: 'Si sigue la fiebre, vaya a urgencias', decision: 'acudir_a_urgencias' });
  assert.equal(segunda.status, 201);
  assert.equal(segunda.body.vigente, true);
  const lista = await eventos(id, token);
  assert.equal(contar(lista, 'cambio_estado'), cambiosAntes);
  assert.equal(contar(lista, 'indicacion'), 2);
  assert.equal((await api(`/conversaciones/${id}`, { token })).body.estado, 'CON_INDICACIONES');

  const { rows } = await pool.query(
    "SELECT id, vigente FROM evento WHERE conversacion_id = $1 AND tipo = 'indicacion'", [id],
  );
  assert.deepEqual(Object.fromEntries(rows.map((e) => [e.id, e.vigente])), {
    [primera.body.id]: false,
    [segunda.body.id]: true,
  });
});

test('la cuidadora recibe 403', async () => {
  const { token, id } = await conversacion();
  assert.equal((await indicar(id, token, { texto: 'Hola' })).status, 403);
});

test('una médica no asignada no escribe, aunque tenga historial compartido (404)', async () => {
  const { cuidadora, token, perfilId, id } = await conversacion();
  const otra = await crearMedicaEnCirculo(cuidadora.familiaId);
  // No hay endpoint para el permiso (L-24): va directo.
  await pool.query(
    'INSERT INTO permiso_historial (perfil_id, medico_id, compartir_historial) VALUES ($1, $2, true)',
    [perfilId, otra.id],
  );
  const { accessToken } = await login(otra.correo);
  assert.equal((await api(`/conversaciones/${id}`, { token: accessToken })).status, 200);
  assert.equal((await indicar(id, accessToken, { texto: 'Hola' })).status, 404);
  assert.equal(contar(await eventos(id, token), 'indicacion'), 0);
});

test('estados inválidos: ENVIADA y CERRADA dan 409; BORRADOR es invisible para la médica (404)', async () => {
  const enviada = await conversacion({ abierta: false });
  const r = await indicar(enviada.id, enviada.tokenMedica, { texto: 'Hola' });
  assert.equal(r.status, 409);
  assert.equal(r.body.codigo, 'TRANSICION_INVALIDA');

  // Ningún endpoint cierra conversaciones todavía: se fuerza CERRADA con SQL.
  const cerrada = await conversacion();
  await pool.query("UPDATE conversacion SET estado = 'CERRADA' WHERE id = $1", [cerrada.id]);
  assert.equal((await indicar(cerrada.id, cerrada.tokenMedica, { texto: 'Hola' })).status, 409);

  const borrador = await conversacion({ enviada: false });
  assert.equal((await indicar(borrador.id, borrador.tokenMedica, { texto: 'Hola' })).status, 404);
});

test('consulta_presencial sin plazoDias da 422 y falta de Idempotency-Key da 400', async () => {
  const { token, tokenMedica, id } = await conversacion();
  const r = await indicar(id, tokenMedica, { texto: 'Vaya a consulta', decision: 'consulta_presencial' });
  assert.equal(r.status, 422);
  const sinClave = await api(`/conversaciones/${id}/indicaciones`, { method: 'POST', token: tokenMedica, body: { texto: 'Hola' } });
  assert.equal(sinClave.status, 400);
  assert.equal(contar(await eventos(id, token), 'indicacion'), 0);
  assert.equal((await api(`/conversaciones/${id}`, { token })).body.estado, 'EN_REVISION');
});
