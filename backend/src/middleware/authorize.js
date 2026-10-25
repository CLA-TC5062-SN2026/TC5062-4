import pool from '../config/database.js';
import { ApiError, missing, uuidOr404 } from '../utils/http.js';

const forbidden = () => new ApiError(403, 'SIN_PERMISOS', 'Tu rol no tiene permiso para esta operación');
const caregiverRoles = ['cuidador_principal', 'cocuidador'];

function roles(req, allowed) {
  if (!allowed.includes(req.auth.rol)) throw forbidden();
}

function sameFamily(req, familiaId) {
  if (req.auth.familiaId !== familiaId) throw missing();
}

async function profile(req, id, write = false) {
  const res = await pool.query('SELECT id, familia_id, tipo, compartir_con_cocuidador FROM perfil_paciente WHERE id = $1', [uuidOr404(id)]);
  if (!res.rowCount) throw missing();
  const p = res.rows[0];
  if (write) {
    roles(req, ['cuidador_principal']);
    sameFamily(req, p.familia_id);
    return p;
  }
  roles(req, [...caregiverRoles, 'medico']);
  if (req.auth.rol === 'medico') {
    // Solo si sigue en el círculo de la familia (RF-08-AC-3) y le enviaron al menos una
    // conversación del perfil o tiene «Compartir historial»; un borrador no cuenta (RF-12).
    const ok = await pool.query(`
      SELECT 1 FROM miembro_circulo m
      WHERE m.familia_id = $3 AND m.medico_id = $2
        AND (EXISTS (SELECT 1 FROM conversacion c WHERE c.perfil_id = $1 AND c.medico_id = $2
                       AND c.estado <> 'BORRADOR')
          OR EXISTS (SELECT 1 FROM permiso_historial h WHERE h.perfil_id = $1
                       AND h.medico_id = $2 AND h.compartir_historial = true))
    `, [p.id, req.auth.id, p.familia_id]);
    if (!ok.rowCount) throw missing();
  } else {
    sameFamily(req, p.familia_id);
    if (req.auth.rol === 'cocuidador' && p.tipo !== 'menor' && !p.compartir_con_cocuidador) {
      throw missing();
    }
  }
  return p;
}

async function conversation(req, id, opts = {}) {
  const r = await pool.query(`
    SELECT c.id, c.medico_id, c.estado, p.id AS perfil_id, p.familia_id, p.tipo, p.compartir_con_cocuidador
    FROM conversacion c JOIN perfil_paciente p ON p.id = c.perfil_id WHERE c.id = $1
  `, [uuidOr404(id)]);
  if (!r.rowCount) throw missing();
  const c = r.rows[0];
  if (opts.write) roles(req, caregiverRoles);
  else roles(req, [...caregiverRoles, 'medico']);
  if (req.auth.rol === 'medico') {
    // Un borrador es privado de la familia hasta que lo envía (RF-12), y un médico fuera
    // del círculo deja de ver todas las conversaciones de esa familia (RF-08-AC-3).
    if (c.estado === 'BORRADOR') throw missing();
    const inCircle = await pool.query(
      'SELECT 1 FROM miembro_circulo WHERE familia_id = $1 AND medico_id = $2',
      [c.familia_id, req.auth.id],
    );
    if (!inCircle.rowCount) throw missing();
    const canReadShared = !opts.messages && await pool.query(`
      SELECT 1 FROM permiso_historial WHERE perfil_id = $1 AND medico_id = $2 AND compartir_historial = true
    `, [c.perfil_id, req.auth.id]);
    if (c.medico_id !== req.auth.id && !canReadShared?.rowCount) throw missing();
  } else {
    sameFamily(req, c.familia_id);
    if (req.auth.rol === 'cocuidador' && c.tipo !== 'menor' && !c.compartir_con_cocuidador) throw missing();
  }
  return c;
}

// Autorización explícita para todas las rutas CRUD que implementó A1.
// Aplica rol antes de buscar el recurso (403), luego pertenencia/visibilidad (404).
export async function authorize(req, res, next) {
  const path = req.path;
  const method = req.method;
  const match = (pattern) => pattern.exec(path);
  let m;

  if (path === '/familias' && method === 'GET') {
    roles(req, [...caregiverRoles, 'medico']);
    return next();
  }
  if ((m = match(/^\/familias\/([^/]+)$/)) && method === 'GET') {
    roles(req, [...caregiverRoles, 'medico']);
    const id = uuidOr404(m[1]);
    if (req.auth.rol === 'medico') {
      const r = await pool.query('SELECT 1 FROM miembro_circulo WHERE familia_id = $1 AND medico_id = $2', [id, req.auth.id]);
      if (!r.rowCount) throw missing();
    } else sameFamily(req, id);
    return next();
  }
  if ((m = match(/^\/familias\/([^/]+)\/perfiles$/))) {
    roles(req, method === 'POST' ? ['cuidador_principal'] : caregiverRoles);
    if (!['GET', 'POST'].includes(method)) throw missing();
    sameFamily(req, uuidOr404(m[1]));
    return next();
  }
  if ((m = match(/^\/perfiles\/([^/]+)$/))) {
    roles(req, ['GET'].includes(method) ? [...caregiverRoles, 'medico'] : ['cuidador_principal']);
    await profile(req, m[1], method !== 'GET');
    return next();
  }
  if ((m = match(/^\/perfiles\/([^/]+)\/conversaciones$/))) {
    roles(req, method === 'POST' ? caregiverRoles : [...caregiverRoles, 'medico']);
    if (!['GET', 'POST'].includes(method)) throw missing();
    await profile(req, m[1]);
    return next();
  }
  if (path === '/conversaciones' && method === 'GET') {
    roles(req, [...caregiverRoles, 'medico']);
    if (req.query.familiaId && req.auth.rol !== 'medico') sameFamily(req, uuidOr404(req.query.familiaId));
    return next();
  }
  if ((m = match(/^\/conversaciones\/([^/]+)(?:\/(eventos|envios|mensajes))?$/))) {
    const [, id, action] = m;
    if (action === 'eventos' && method !== 'GET') throw missing();
    if (action === 'envios' && method !== 'POST') throw missing();
    if (action === 'mensajes' && method !== 'POST') throw missing();
    const writable = (!action && ['PATCH', 'DELETE'].includes(method)) || action === 'envios';
    const allowRead = (!action && method === 'GET') || action === 'eventos';
    const allowMessages = action === 'mensajes';
    if (!writable && !allowRead && !allowMessages) throw missing();
    roles(req, writable ? caregiverRoles : [...caregiverRoles, 'medico']);
    await conversation(req, id, { write: writable, messages: allowMessages });
    return next();
  }
  throw missing('Ruta no encontrada');
}
