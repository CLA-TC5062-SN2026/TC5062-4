import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, cerrar, api, login, pool, base } from './arnes.mjs';
import { reiniciarDemo, CUENTA, MEDICA } from '../scripts/demo_seed.mjs';

before(iniciar);
after(cerrar);

test('el seed de demo corre dos veces seguidas sin fallar ni duplicar datos', async () => {
  await reiniciarDemo(pool, base);
  const demo = await reiniciarDemo(pool, base);

  const { rows: [conteo] } = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM familia WHERE nombre = 'Familia Ruán') AS familias,
      (SELECT count(*)::int FROM perfil_paciente) AS perfiles,
      (SELECT count(*)::int FROM medico) AS medicas,
      (SELECT count(*)::int FROM etiqueta) AS etiquetas,
      (SELECT count(*)::int FROM conversacion WHERE estado = 'CON_INDICACIONES') AS historicas,
      (SELECT count(*)::int FROM conversacion) AS conversaciones
  `);
  assert.deepEqual(conteo, { familias: 1, perfiles: 3, medicas: 1, etiquetas: 3, historicas: 1, conversaciones: 1 });

  const maria = await login(CUENTA.correo, CUENTA.contrasena);
  const perfiles = await api(`/familias/${maria.usuario.familiaId}/perfiles`, { token: maria.accessToken });
  assert.equal(perfiles.status, 200);
  assert.equal(perfiles.body.length, 3);

  const medica = await login(MEDICA.correo, MEDICA.contrasena);
  assert.equal(medica.usuario.rol, 'medico');

  for (const sesion of [maria, medica]) {
    const lista = await api('/conversaciones', { token: sesion.accessToken });
    assert.equal(lista.status, 200);
    assert.deepEqual(lista.body.datos.map((c) => c.id), [demo.conversacionId]);

    const detalle = await api(`/conversaciones/${demo.conversacionId}`, { token: sesion.accessToken });
    assert.equal(detalle.status, 200);
    assert.equal(detalle.body.estado, 'CON_INDICACIONES');
    assert.deepEqual(detalle.body.puntosPendientes, []);
    assert.ok(new Date(detalle.body.creadaEn) < new Date(Date.now() - 14 * 864e5), 'la conversación es de hace más de 2 semanas');

    const eventos = await api(`/conversaciones/${demo.conversacionId}/eventos`, { token: sesion.accessToken });
    assert.equal(eventos.status, 200);
    assert.deepEqual(eventos.body.datos.map((e) => e.tipo), [
      'respuesta', 'respuesta', 'respuesta', 'cambio_estado', 'cambio_estado', 'indicacion', 'cambio_estado', 'mensaje',
    ]);
  }

  const etiquetas = await api('/etiquetas');
  assert.deepEqual(etiquetas.body.map((e) => e.codigo).sort(), ['fiebre', 'piel', 'respiratorio']);
});
