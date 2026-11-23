import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { iniciar, cerrar, api, pool, crearCuidadora, crearMedicaEnCirculo, login } from './arnes.mjs';

// B3 (RF-16-AC-2): la médica asignada abre una conversación ENVIADA y pasa a EN_REVISION.
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

// Cuidadora, médica asignada en su círculo y un borrador de fiebre; `enviada` lo envía.
async function conversacion({ enviada = true } = {}) {
  const cuidadora = await crearCuidadora();
  const { accessToken: token } = await login(cuidadora.correo);
  const medica = await crearMedicaEnCirculo(cuidadora.familiaId);
  const perfil = await api(`/familias/${cuidadora.familiaId}/perfiles`, {
    method: 'POST', token,
    body: { tipo: 'menor', nombre: 'Niña de Prueba', fechaNacimiento: '2020-05-02', alergias: [], medicamentos: [] },
  });
  assert.equal(perfil.status, 201);
  const conv = await api(`/perfiles/${perfil.body.id}/conversaciones`, {
    method: 'POST', token,
    body: { titulo: 'Fiebre de prueba', etiquetas: ['fiebre'], medicoId: medica.id },
  });
  assert.equal(conv.status, 201);
  const id = conv.body.id;
  if (enviada) {
    const r = await api(`/conversaciones/${id}/preguntas/F1/respuesta`, { method: 'PUT', token, body: { texto: 'Desde ayer' } });
    assert.equal(r.status, 201);
    const envio = await api(`/conversaciones/${id}/envios`, {
      method: 'POST', token, headers: { 'Idempotency-Key': randomUUID() },
    });
    assert.equal(envio.status, 200);
  }
  const { accessToken: tokenMedica } = await login(medica.correo);
  return { cuidadora, token, medica, tokenMedica, perfilId: perfil.body.id, id };
}

async function cambios(id, token) {
  const r = await api(`/conversaciones/${id}/eventos`, { token });
  assert.equal(r.status, 200);
  return r.body.datos.filter((e) => e.tipo === 'cambio_estado');
}
const leer = (id, token) => api(`/conversaciones/${id}`, { token });

test('la primera lectura de la médica asignada pasa a EN_REVISION y registra 1 evento suyo', async () => {
  const { token, medica, tokenMedica, id } = await conversacion();
  const r = await leer(id, tokenMedica);
  assert.equal(r.status, 200);
  assert.equal(r.body.estado, 'EN_REVISION');

  const eventos = await cambios(id, token);
  assert.deepEqual(eventos.map((e) => [e.estadoAnterior, e.estadoNuevo]), [['BORRADOR', 'ENVIADA'], ['ENVIADA', 'EN_REVISION']]);
  assert.equal(eventos[1].autor.id, medica.id);
  assert.equal(eventos[1].autor.rol, 'medico');

  // La segunda lectura no crea otro evento ni cambia la versión.
  const otra = await leer(id, tokenMedica);
  assert.equal(otra.body.estado, 'EN_REVISION');
  assert.equal(otra.body.version, r.body.version);
  assert.equal((await cambios(id, token)).length, 2);
});

test('dos lecturas simultáneas de la médica crean un solo evento', async () => {
  const { token, tokenMedica, id } = await conversacion();
  const lecturas = await Promise.all([leer(id, tokenMedica), leer(id, tokenMedica), leer(id, tokenMedica)]);
  for (const r of lecturas) assert.equal(r.body.estado, 'EN_REVISION');
  assert.equal((await cambios(id, token)).filter((e) => e.estadoNuevo === 'EN_REVISION').length, 1);
});

test('la lista y /eventos de la médica no disparan la transición', async () => {
  const { token, tokenMedica, id } = await conversacion();
  const lista = await api('/conversaciones', { token: tokenMedica });
  assert.equal(lista.body.datos.find((c) => c.id === id).estado, 'ENVIADA');
  assert.equal((await cambios(id, tokenMedica)).length, 1);
  assert.equal((await leer(id, token)).body.estado, 'ENVIADA');
});

test('la lectura de la cuidadora no cambia nada', async () => {
  const { token, tokenMedica, id } = await conversacion();
  const r = await leer(id, token);
  assert.equal(r.status, 200);
  assert.equal(r.body.estado, 'ENVIADA');
  assert.equal((await cambios(id, token)).length, 1);
  // Después, la médica asignada sí la abre.
  assert.equal((await leer(id, tokenMedica)).body.estado, 'EN_REVISION');
});

test('una médica con historial compartido pero no asignada no dispara la transición', async () => {
  const { cuidadora, token, perfilId, id } = await conversacion();
  // Segunda médica del círculo con «Compartir historial» del perfil: authorize.js le deja
  // leer la conversación aunque no sea la asignada. No hay endpoint para el permiso: va directo.
  const otra = await crearMedicaEnCirculo(cuidadora.familiaId);
  await pool.query(
    'INSERT INTO permiso_historial (perfil_id, medico_id, compartir_historial) VALUES ($1, $2, true)',
    [perfilId, otra.id],
  );
  const { accessToken } = await login(otra.correo);
  const r = await leer(id, accessToken);
  assert.equal(r.status, 200);
  assert.equal(r.body.estado, 'ENVIADA');
  assert.equal((await cambios(id, token)).length, 1);
});

test('un BORRADOR no se toca', async () => {
  const { token, tokenMedica, id } = await conversacion({ enviada: false });
  // La médica no ve borradores (RF-12) y la cuidadora lo lee sin cambiarlo.
  assert.equal((await leer(id, tokenMedica)).status, 404);
  const r = await leer(id, token);
  assert.equal(r.body.estado, 'BORRADOR');
  assert.equal((await cambios(id, token)).length, 0);
});
