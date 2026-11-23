/**
 * Seed de la demo (tarea B5). SOLO local y con datos ficticios.
 *
 * No importa `app` ni el pool: los recibe, para que lo usen tanto el CLI
 * `demo_reset.mjs` (base del .env) como las pruebas de integración (dafi_test).
 * Lo que tiene endpoint se crea por la API, así pasa por las validaciones
 * reales; lo que todavía no lo tiene (respuestas B2, revisión B3, indicaciones
 * B4) y la médica (no hay alta sin invitación) se insertan por SQL.
 */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

export const CONTRASENA_DEMO = 'DafiDemo2026!';

export const CUENTA = {
  nombre: 'María Ruán Aguilar',
  correo: 'maria.ruan@correo.com',
  contrasena: CONTRASENA_DEMO,
  nombreFamilia: 'Familia Ruán',
  avisoVersion: 1,
  declaraciones: {
    mayorDeEdad: true,
    consentimientoDatosPropios: true,
    consentimientoDatosMenores: true,
  },
};

export const PERFILES = [
  { tipo: 'menor', nombre: 'Mateo Ruán', fechaNacimiento: '2021-03-14',
    alergias: ['Penicilina'], medicamentos: ['Salbutamol'] },
  { tipo: 'propio', nombre: 'María Ruán', fechaNacimiento: '1988-01-23',
    alergias: [], medicamentos: [], compartirConCocuidador: true },
  { tipo: 'adulto_representado', nombre: 'Rosa Aguilar', fechaNacimiento: '1955-06-02',
    correo: 'rosa.aguilar@correo.com', alergias: ['Sulfas'], medicamentos: ['Metformina'] },
];

export const MEDICA = {
  nombre: 'Dra. Laura Méndez Ortiz',
  correo: 'laura.mendez@correo.com',
  contrasena: CONTRASENA_DEMO,
  especialidad: 'Pediatría',
};

// Contenido que revisa el PO: catálogo y conversación histórica.
const ETIQUETAS = [['fiebre', 'Fiebre'], ['piel', 'Piel'], ['respiratorio', 'Respiratorio']];

// Códigos y textos del SRS (RF-10). G2 es general: aplica a toda conversación.
const PREGUNTAS = [
  { codigo: 'F1', texto: 'Temperatura más alta que midió', tipo: 'numero_u_opcion',
    opciones: ['No la he medido'], obligatoria: true, etiqueta: 'fiebre' },
  { codigo: 'F2', texto: '¿Dónde la midió?', tipo: 'opcion',
    opciones: ['Axila', 'Boca', 'Oído', 'Frente', 'Recto'], obligatoria: false, etiqueta: 'fiebre' },
  { codigo: 'G2', texto: '¿Qué le preocupa?', tipo: 'texto',
    opciones: [], obligatoria: true, etiqueta: null },
];

const HISTORICA = {
  titulo: 'Fiebre desde anoche',
  respuestas: [
    { codigo: 'F1', numero: 38.6, valor: '38.6' },
    { codigo: 'F2', opcion: 'Axila', valor: 'Axila' },
    { codigo: 'G2', texto: 'Tiene temperatura desde anoche y casi no quiso cenar. Hoy está más dormido de lo normal, aunque sí toma agua.' },
  ],
  indicacion: 'Ofrézcale líquidos con frecuencia y déjelo descansar. Si tiene molestias, puede darle paracetamol en la dosis que corresponde a su peso. Si mañana por la tarde sigue con fiebre, escríbame por aquí. Si le cuesta respirar o lo nota muy decaído, acuda a urgencias.',
  mensaje: 'Gracias, doctora. Ya le bajó la temperatura; mañana le cuento cómo amaneció.',
};

// Texto de ejemplo del contrato (schema Aviso); lo necesita la pantalla de nueva conversación (F4).
const AVISO_EMERGENCIAS = 'DAFI no atiende emergencias. Si la persona tiene dificultad para respirar, pierde el conocimiento o la situación le preocupa, llame al 911 o acuda a urgencias.';

const archivo = (ruta) => readFile(new URL(ruta, import.meta.url), 'utf8');

/** Borra todo y crea el esquema con el aviso de privacidad v1 que pide el registro. */
export async function recrearEsquema(pool) {
  // El esquema no es re-ejecutable (CREATE TYPE/TABLE sin IF NOT EXISTS): se parte de public vacío.
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  await pool.query(await archivo('../../S05_S06_A1/esquema_bd.sql'));
  await pool.query(await archivo('./seed_auth_demo.sql'));
}

/** fetch a la API; devuelve { status, body } sin lanzar. */
export async function peticion(base, ruta, { method = 'GET', token, body, headers } = {}) {
  const res = await fetch(base + ruta, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

/** Médica activa, con contraseña conocida y en el círculo de la familia (L-03, L-07). */
export async function insertarMedica(pool, { nombre, correo, hash, especialidad, familiaId }) {
  const { rows: [{ id }] } = await pool.query(`
    INSERT INTO usuario (tipo_usuario, nombre, correo, hash_contrasena, correo_verificado)
    VALUES ('medico', $1, $2, $3, true) RETURNING id
  `, [nombre, correo, hash]);
  await pool.query('INSERT INTO medico (id, especialidad, version_terminos) VALUES ($1, $2, 1)', [id, especialidad]);
  await pool.query('INSERT INTO miembro_circulo (familia_id, medico_id) VALUES ($1, $2)', [familiaId, id]);
  return id;
}

/**
 * Recrea el esquema y carga la demo completa. `base` es la URL de una `app`
 * escuchando sobre el mismo pool (p. ej. http://127.0.0.1:PUERTO/api/v1).
 */
export async function reiniciarDemo(pool, base) {
  const llamar = async (esperado, ruta, opciones) => {
    const r = await peticion(base, ruta, opciones);
    if (r.status !== esperado) {
      throw new Error(`${opciones?.method ?? 'GET'} ${ruta}: ${r.status} ${JSON.stringify(r.body)}`);
    }
    return r.body;
  };

  await recrearEsquema(pool);
  await pool.query(
    "INSERT INTO aviso (codigo, version, texto) VALUES ('emergencias', 1, $1)",
    [AVISO_EMERGENCIAS],
  );

  // Catálogo: etiquetas y preguntas de contexto.
  for (const [codigo, nombre] of ETIQUETAS) {
    await pool.query('INSERT INTO etiqueta (codigo, nombre) VALUES ($1, $2)', [codigo, nombre]);
  }
  const preguntaId = {};
  for (const p of PREGUNTAS) {
    const { rows: [{ id }] } = await pool.query(`
      INSERT INTO pregunta_contexto (codigo, texto, tipo_respuesta, opciones, obligatoria, es_general)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [p.codigo, p.texto, p.tipo, p.opciones, p.obligatoria, p.etiqueta === null]);
    preguntaId[p.codigo] = id;
    if (p.etiqueta) {
      await pool.query(`
        INSERT INTO etiqueta_pregunta (etiqueta_id, pregunta_id)
        SELECT id, $2 FROM etiqueta WHERE codigo = $1
      `, [p.etiqueta, id]);
    }
  }

  // María, su familia y sus perfiles, por la API.
  await llamar(201, '/auth/register', { method: 'POST', body: CUENTA });
  const { accessToken: token, usuario } = await llamar(200, '/auth/login', {
    method: 'POST', body: { correo: CUENTA.correo, contrasena: CUENTA.contrasena },
  });
  const perfiles = {};
  for (const perfil of PERFILES) {
    const creado = await llamar(201, `/familias/${usuario.familiaId}/perfiles`, { method: 'POST', token, body: perfil });
    perfiles[creado.nombre] = creado.id;
  }

  const medicaId = await insertarMedica(pool, {
    ...MEDICA, hash: await bcrypt.hash(MEDICA.contrasena, 12), familiaId: usuario.familiaId,
  });

  // Conversación histórica de Mateo, iniciada hace 18 días a las 21:00 UTC; en(m) = m minutos después.
  const { rows: [{ t0 }] } = await pool.query(
    "SELECT date_trunc('day', now() - interval '18 days') + interval '21 hours' AS t0",
  );
  const en = (minutos) => new Date(t0.getTime() + minutos * 60_000);
  // Lo que tiene endpoint va por la API.
  const conv = await llamar(201, `/perfiles/${perfiles['Mateo Ruán']}/conversaciones`, {
    method: 'POST', token,
    body: { titulo: HISTORICA.titulo, etiquetas: ['fiebre'], medicoId: medicaId, prioridadIndicada: false },
  });
  // Respuestas (B2 pendiente): valor vigente en respuesta y su evento, como RF-10-AC-1.
  for (const [i, r] of HISTORICA.respuestas.entries()) {
    const fecha = en(5 + i * 3);
    await pool.query(`
      INSERT INTO respuesta (conversacion_id, pregunta_id, opcion, texto, numero, registrada_en)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [conv.id, preguntaId[r.codigo], r.opcion ?? null, r.texto ?? null, r.numero ?? null, fecha]);
    await pool.query(`
      INSERT INTO evento (conversacion_id, tipo, autor_id, fecha, pregunta_id, valor)
      VALUES ($1, 'respuesta', $2, $3, $4, $5)
    `, [conv.id, usuario.id, fecha, preguntaId[r.codigo], r.valor ?? r.texto]);
  }
  await llamar(200, `/conversaciones/${conv.id}/envios`, {
    method: 'POST', token, headers: { 'Idempotency-Key': randomUUID() },
  });

  // La médica la abre (B3 pendiente) y registra la indicación (B4 pendiente).
  await pool.query(`
    INSERT INTO evento (conversacion_id, tipo, autor_id, fecha, estado_anterior, estado_nuevo)
    VALUES ($1, 'cambio_estado', $2, $3, 'ENVIADA', 'EN_REVISION')
  `, [conv.id, medicaId, en(70)]);
  await pool.query(`
    INSERT INTO evento (conversacion_id, tipo, autor_id, fecha, texto, decision, vigente)
    VALUES ($1, 'indicacion', $2, $3, $4, 'cuidado_en_casa', true)
  `, [conv.id, medicaId, en(90), HISTORICA.indicacion]);
  await pool.query(`
    INSERT INTO evento (conversacion_id, tipo, autor_id, fecha, estado_anterior, estado_nuevo)
    VALUES ($1, 'cambio_estado', $2, $3, 'EN_REVISION', 'CON_INDICACIONES')
  `, [conv.id, medicaId, en(90.02)]);
  await pool.query(
    "UPDATE conversacion SET estado = 'CON_INDICACIONES', version = version + 2 WHERE id = $1",
    [conv.id],
  );

  // María contesta por la API (mensaje ya existe).
  await llamar(201, `/conversaciones/${conv.id}/mensajes`, {
    method: 'POST', token, headers: { 'Idempotency-Key': randomUUID() }, body: { texto: HISTORICA.mensaje },
  });

  // Lo creado por la API quedó con now(): se lleva al mismo pasado que lo demás.
  await pool.query(`
    UPDATE conversacion SET creada_en = $2, enviada_en = $3 WHERE id = $1
  `, [conv.id, en(0), en(25)]);
  await pool.query(`
    UPDATE evento SET fecha = $2 WHERE conversacion_id = $1 AND tipo = 'cambio_estado' AND estado_nuevo = 'ENVIADA'
  `, [conv.id, en(25)]);
  await pool.query(`
    UPDATE evento SET fecha = $2 WHERE conversacion_id = $1 AND tipo = 'mensaje'
  `, [conv.id, en(185)]);

  return {
    familiaId: usuario.familiaId,
    cuidadoraId: usuario.id,
    medicaId,
    perfiles,
    conversacionId: conv.id,
  };
}
