import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';

// Activa un usuario ficticio que ya creó seed_demo.sql para probar el 403.
// SOLO local. No crea cuentas reales ni modifica a usuarios distintos del ID de demostración.
if (process.env.NODE_ENV === 'production') {
  throw new Error('No ejecutar seed_medico_demo.mjs en producción');
}
try {
  const hash = await bcrypt.hash('MedicoDemo123!', 12);
  const result = await pool.query(`
    UPDATE usuario SET hash_contrasena = $1 WHERE id = $2 AND correo = $3
  `, [hash, '33333333-3333-4333-8333-333333333333', 'medico.demo@dafi.invalid']);
  if (!result.rowCount) throw new Error('Primero debes importar scripts/seed_demo.sql de A1');
  console.log('Credenciales de médico DEMO activadas para pruebas locales');
} finally {
  await pool.end();
}
