/**
 * Arnés de pruebas de integración: base de prueba real, `app` en un puerto
 * libre y peticiones con fetch. SOLO local y con datos ficticios.
 *
 * La base sale de TEST_DB_* (con respaldo en DB_* del .env para host, puerto,
 * usuario y contraseña); el nombre por defecto es dafi_test y debe terminar en
 * _test, porque el arnés borra y recrea el esquema public.
 */
import 'dotenv/config';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { recrearEsquema, peticion, insertarMedica } from '../scripts/demo_seed.mjs';

const env = process.env;
const DB_NAME = env.TEST_DB_NAME || 'dafi_test';
if (!DB_NAME.endsWith('_test')) {
  throw new Error(`Las pruebas de integración se niegan a correr sobre "${DB_NAME}": el nombre de la base debe terminar en _test`);
}
// database.js lee DB_* al importarse: hay que fijarlas antes de importar app.
env.DB_HOST = env.TEST_DB_HOST || env.DB_HOST || 'localhost';
env.DB_PORT = env.TEST_DB_PORT || env.DB_PORT || '5432';
env.DB_USER = env.TEST_DB_USER || env.DB_USER;
env.DB_PASSWORD = env.TEST_DB_PASSWORD || env.DB_PASSWORD;
env.DB_NAME = DB_NAME;
env.JWT_SECRET ||= randomBytes(32).toString('hex');

const { default: app } = await import('../src/app.js');
export const { default: pool } = await import('../src/config/database.js');

export const CONTRASENA = 'PruebaInt2026!';
let server;
export let base;

export async function iniciar() {
  await recrearEsquema(pool);
  server = app.listen(0);
  await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
}

export async function cerrar() {
  server?.closeAllConnections();
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  await pool.end();
}

export const api = (ruta, opciones) => peticion(base, ruta, opciones);

const correoFicticio = (prefijo) => `${prefijo}.${randomUUID().slice(0, 8)}@dafi.invalid`;

export async function crearCuidadora() {
  const correo = correoFicticio('cuidadora');
  const r = await api('/auth/register', {
    method: 'POST',
    body: {
      nombre: 'Cuidadora de Prueba',
      correo,
      contrasena: CONTRASENA,
      nombreFamilia: 'Familia de Prueba',
      avisoVersion: 1,
      declaraciones: { mayorDeEdad: true, consentimientoDatosPropios: true, consentimientoDatosMenores: true },
    },
  });
  if (r.status !== 201) throw new Error(`crearCuidadora: ${r.status} ${JSON.stringify(r.body)}`);
  return { ...r.body, contrasena: CONTRASENA };
}

// No hay endpoint para dar de alta médicos sin invitación: se insertan directo,
// activos, con contraseña conocida y en el círculo de la familia (L-03, L-07).
export async function crearMedicaEnCirculo(familiaId) {
  const correo = correoFicticio('medica');
  const id = await insertarMedica(pool, {
    nombre: 'Médica de Prueba', correo, hash: await bcrypt.hash(CONTRASENA, 4), especialidad: 'Pediatría', familiaId,
  });
  return { id, correo, contrasena: CONTRASENA };
}

export async function login(correo, contrasena = CONTRASENA) {
  const r = await api('/auth/login', { method: 'POST', body: { correo, contrasena } });
  if (r.status !== 200) throw new Error(`login: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
}
