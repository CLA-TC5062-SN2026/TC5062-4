import { Router } from 'express';
import { randomUUID, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { ApiError, invalid, requireObject, validName, transaction } from '../utils/http.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
const mailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const badCredentials = () => new ApiError(401, 'NO_AUTENTICADO', 'Los datos no coinciden');

function validPassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 72) {
    throw invalid('contrasena debe tener entre 8 y 72 caracteres');
  }
  return value;
}
function validEmail(value) {
  if (typeof value !== 'string' || value.length > 254 || !mailRe.test(value.trim())) {
    throw invalid('correo inválido');
  }
  return value.trim().toLowerCase();
}
function declarations(value) {
  if (!value || value.mayorDeEdad !== true || value.consentimientoDatosPropios !== true ||
      value.consentimientoDatosMenores !== true) {
    throw invalid('Se requieren las tres declaraciones aceptadas');
  }
}
async function findAccount(id, client = pool) {
  const r = await client.query(`
    SELECT u.id, u.nombre, u.correo, u.tipo_usuario, u.correo_verificado, u.activo,
      c.familia_id, m.especialidad,
      CASE WHEN u.tipo_usuario = 'cuidador'
        THEN CASE WHEN c.tipo = 'principal' THEN 'cuidador_principal' ELSE 'cocuidador' END
        ELSE u.tipo_usuario::text END AS rol,
      (SELECT max(a.version) FROM aceptacion_aviso x JOIN aviso a ON a.id = x.aviso_id
        WHERE x.usuario_id = u.id AND a.codigo = 'privacidad') AS aviso_version
    FROM usuario u LEFT JOIN cuidador c ON c.id = u.id
    LEFT JOIN medico m ON m.id = u.id WHERE u.id = $1
  `, [id]);
  if (!r.rowCount) return null;
  const u = r.rows[0];
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol,
    familiaId: u.familia_id,
    especialidad: u.especialidad,
    correoVerificado: u.correo_verificado,
    activo: u.activo,
    ...(u.aviso_version ? { avisoAceptadoVersion: u.aviso_version } : {})
  };
}

router.post('/auth/register', async (req, res) => {
  const body = requireObject(req.body);
  const nombre = validName(body.nombre);
  const hash = await bcrypt.hash(validPassword(body.contrasena), 12);
  const invite = body.tokenInvitacion;

  const account = await transaction(pool, async (client) => {
    let correo;
    let tipo = 'cuidador';
    let familyId = null;
    let familyName = null;
    let invitation = null;

    if (invite !== undefined) {
      if (typeof invite !== 'string' || invite.length < 32) throw invalid('tokenInvitacion inválido');
      const tokenHash = createHash('sha256').update(invite).digest('hex');
      const found = await client.query(`
        SELECT * FROM invitacion WHERE token_hash = $1 AND estado = 'pendiente'
          AND vence_en > now() FOR UPDATE
      `, [tokenHash]);
      if (!found.rowCount) throw new ApiError(422, 'ENLACE_INVALIDO', 'Invitación expirada o inválida');
      invitation = found.rows[0];
      correo = validEmail(invitation.correo);
      familyId = invitation.familia_id;
      tipo = invitation.tipo === 'medico' ? 'medico' : 'cuidador';
      if (tipo === 'cuidador') declarations(body.declaraciones);
      else if (body.aceptaTerminosMedico !== true) throw invalid('Aceptación de términos obligatoria');
    } else {
      correo = validEmail(body.correo);
      declarations(body.declaraciones);
      if (!Number.isInteger(body.avisoVersion) || body.avisoVersion < 1) throw invalid('avisoVersion inválida');
      familyName = validName(body.nombreFamilia ?? `Familia de ${nombre}`);
    }

    const exists = await client.query('SELECT 1 FROM usuario WHERE lower(correo) = $1', [correo]);
    if (exists.rowCount) throw new ApiError(409, 'CORREO_REGISTRADO', 'Ya existe una cuenta con este correo');

    // La privacidad debe estar publicada previamente en tabla aviso.
    if (!invitation) {
      const aviso = await client.query(`
        SELECT id FROM aviso WHERE codigo = 'privacidad' AND version = $1
      `, [body.avisoVersion]);
      if (!aviso.rowCount) throw invalid('La versión del aviso de privacidad no existe');
      const createdFamily = await client.query('INSERT INTO familia (nombre) VALUES ($1) RETURNING id', [familyName]);
      familyId = createdFamily.rows[0].id;
    }

    let user;
    try {
      const r = await client.query(`
        INSERT INTO usuario (nombre, correo, hash_contrasena, tipo_usuario, correo_verificado)
        VALUES ($1,$2,$3,$4,$5) RETURNING id
      `, [nombre, correo, hash, tipo, Boolean(invitation)]);
      user = r.rows[0];
    } catch (error) {
      if (error.code === '23505') throw new ApiError(409, 'CORREO_REGISTRADO', 'Ya existe una cuenta con este correo');
      throw error;
    }

    if (tipo === 'cuidador') {
      await client.query(`
        INSERT INTO cuidador (id, familia_id, tipo, declara_mayor_de_edad,
          consiente_datos_propios, consiente_datos_menores)
        VALUES ($1,$2,$3,true,true,true)
      `, [user.id, familyId, invitation ? 'cocuidador' : 'principal']);
    } else {
      await client.query(`
        INSERT INTO medico (id, especialidad, version_terminos)
        VALUES ($1,$2,$3)
      `, [user.id, body.especialidad ?? null, 1]);
      await client.query(`
        INSERT INTO miembro_circulo (familia_id, medico_id) VALUES ($1,$2)
        ON CONFLICT DO NOTHING
      `, [familyId, user.id]);
    }

    if (invitation) {
      await client.query(`
        UPDATE invitacion SET estado = 'aceptada', aceptada_por_id = $2 WHERE id = $1
      `, [invitation.id, user.id]);
    } else {
      await client.query(`
        INSERT INTO aceptacion_aviso (usuario_id, aviso_id)
        SELECT $1, id FROM aviso WHERE codigo = 'privacidad' AND version = $2
      `, [user.id, body.avisoVersion]);
    }
    return findAccount(user.id, client);
  });
  res.location('/api/v1/auth/me').status(201).json(account);
});

router.post('/auth/login', async (req, res) => {
  const body = requireObject(req.body);
  const correo = validEmail(body.correo);
  if (typeof body.contrasena !== 'string') throw invalid('contrasena requerida');
  const r = await pool.query('SELECT id, hash_contrasena, activo FROM usuario WHERE lower(correo) = $1', [correo]);
  // Hash falso de respaldo: evita hacer obvia la existencia de un correo por tiempos.
  const fakeHash = '$2b$12$123456789012345678901uQ6X3mDng0bYrwPMkN7j6gD/5Mw6hllm';
  const ok = await bcrypt.compare(body.contrasena, r.rows[0]?.hash_contrasena ?? fakeHash).catch(() => false);
  if (!r.rowCount || !ok) throw badCredentials();
  if (!r.rows[0].activo) throw new ApiError(403, 'CUENTA_DESACTIVADA', 'Cuenta desactivada');

  const user = await findAccount(r.rows[0].id);
  const jti = randomUUID();
  const expiration = process.env.JWT_EXPIRATION || '30m';
  const token = jwt.sign({ rol: user.rol, familiaId: user.familiaId ?? null }, process.env.JWT_SECRET, {
    algorithm: 'HS256', issuer: 'dafi-api', audience: 'dafi-client',
    subject: user.id, jwtid: jti, expiresIn: expiration
  });
  await pool.query('INSERT INTO sesion (usuario_id, jti) VALUES ($1,$2)', [user.id, jti]);
  const tokenPayload = jwt.decode(token);
  const expires = Math.min(tokenPayload.exp - tokenPayload.iat, Number(process.env.MINUTOS_SESION || 30) * 60);
  res.json({
    accessToken: token,
    tipoToken: 'Bearer',
    expiraEnSegundos: expires,
    usuario: user,
    pantallaInicio: user.rol === 'medico' ? 'bandeja' : user.rol === 'administrador' ? 'reportes' : 'perfiles'
  });
});

router.get('/auth/me', authenticate, async (req, res) => {
  const account = await findAccount(req.auth.id);
  if (!account) throw new ApiError(401, 'NO_AUTENTICADO', 'Usuario no encontrado');
  res.json(account);
});

export default router;
