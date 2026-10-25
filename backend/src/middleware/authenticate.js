import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { ApiError, isUuid } from '../utils/http.js';

const unauthorized = () => new ApiError(401, 'NO_AUTENTICADO', 'Token ausente, inválido o expirado');

export async function authenticate(req, res, next) {
  const header = req.get('Authorization') ?? '';
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  if (!match) throw unauthorized();

  let claims;
  try {
    claims = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'dafi-api',
      audience: 'dafi-client'
    });
  } catch {
    throw unauthorized();
  }
  if (!isUuid(claims.sub) || !isUuid(claims.jti)) throw unauthorized();

  // Consultar de nuevo la BD impide seguir usando cuentas desactivadas o sesiones revocadas.
  // La caducidad por inactividad también se verifica del lado del servidor.
  const result = await pool.query(`
    SELECT u.id, u.nombre, u.correo, u.tipo_usuario, u.correo_verificado,
      u.activo, c.familia_id,
      CASE WHEN u.tipo_usuario = 'cuidador'
        THEN CASE WHEN c.tipo = 'principal' THEN 'cuidador_principal' ELSE 'cocuidador' END
        ELSE u.tipo_usuario::text END AS rol,
      s.ultima_actividad
    FROM sesion s
    JOIN usuario u ON u.id = s.usuario_id
    LEFT JOIN cuidador c ON c.id = u.id
    WHERE s.jti = $1 AND s.usuario_id = $2 AND s.revocada_en IS NULL
  `, [claims.jti, claims.sub]);

  if (!result.rowCount || !result.rows[0].activo) throw unauthorized();
  const user = result.rows[0];
  if (claims.rol !== user.rol || (claims.familiaId ?? null) !== (user.familia_id ?? null)) {
    throw unauthorized();
  }
  const inactivityMinutes = Number(process.env.MINUTOS_SESION || 30);
  if (!Number.isFinite(inactivityMinutes) || inactivityMinutes <= 0) {
    throw new Error('MINUTOS_SESION inválido');
  }
  if (Date.now() - new Date(user.ultima_actividad).getTime() > inactivityMinutes * 60000) {
    await pool.query('UPDATE sesion SET revocada_en = now() WHERE jti = $1', [claims.jti]);
    throw unauthorized();
  }
  await pool.query('UPDATE sesion SET ultima_actividad = now() WHERE jti = $1', [claims.jti]);
  req.auth = {
    id: user.id,
    nombre: user.nombre,
    correo: user.correo,
    rol: user.rol,
    familiaId: user.familia_id,
    correoVerificado: user.correo_verificado,
    jti: claims.jti
  };
  next();
}
