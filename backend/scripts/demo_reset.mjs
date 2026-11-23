/**
 * npm --prefix backend run demo:reset
 *
 * BORRA TODA LA BASE de backend/.env (DB_*) y carga la demo de demo_seed.mjs.
 * Nunca en producción; si la base no es local, pide escribir su nombre.
 * Levanta `app` en un puerto libre dentro del proceso: no necesita el backend corriendo.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const env = process.env;
if (env.NODE_ENV === 'production') {
  console.error('demo:reset se niega a correr con NODE_ENV=production.');
  process.exit(1);
}

const host = env.DB_HOST || 'localhost';
const nombreBase = env.DB_NAME || 'dafi';
if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
  if (!process.stdin.isTTY) {
    console.error(`La base ${nombreBase} está en ${host} (no local) y no hay terminal para confirmar. No se hizo nada.`);
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = await rl.question(`Se borrará TODA la base "${nombreBase}" en ${host}. Escriba su nombre para confirmar: `);
  rl.close();
  if (respuesta.trim() !== nombreBase) {
    console.error('Confirmación incorrecta. No se hizo nada.');
    process.exit(1);
  }
}

// Los tokens solo se usan dentro de este proceso.
env.JWT_SECRET ||= randomBytes(32).toString('hex');
const { default: app } = await import('../src/app.js');
const { default: pool } = await import('../src/config/database.js');
const { reiniciarDemo, CUENTA, MEDICA, PERFILES } = await import('./demo_seed.mjs');

const server = app.listen(0, '127.0.0.1');
try {
  await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject));
  const demo = await reiniciarDemo(pool, `http://127.0.0.1:${server.address().port}/api/v1`);
  console.log(`Base "${nombreBase}" en ${host}:${env.DB_PORT || 5432} recreada con la demo.`);
  console.log(`- Familia Ruán (${demo.familiaId}) con ${PERFILES.length} perfiles: ${PERFILES.map((p) => p.nombre).join(', ')}`);
  console.log(`- ${MEDICA.nombre} (${MEDICA.especialidad}) en el círculo de la familia`);
  console.log('- Etiquetas: fiebre, piel, respiratorio; preguntas F1, F2 (fiebre) y G2 (general)');
  console.log(`- Conversación histórica de Mateo con indicaciones: ${demo.conversacionId}`);
  console.log('\nCredenciales de demo (solo locales, datos ficticios):');
  console.log(`  Cuidadora: ${CUENTA.correo} / ${CUENTA.contrasena}`);
  console.log(`  Médica:    ${MEDICA.correo} / ${MEDICA.contrasena}`);
} catch (error) {
  console.error('demo:reset falló:', error.message);
  process.exitCode = 1;
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
}
