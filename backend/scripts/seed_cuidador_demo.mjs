import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';

// Activa el cuidador ficticio que ya creó seed_demo.sql (familia 2222…, con la
// médica demo en su círculo) para las pruebas de regresión de S09-A1.
// SOLO local. Mismo patrón que seed_medico_demo.mjs.
if (process.env.NODE_ENV === 'production') {
  throw new Error('No ejecutar seed_cuidador_demo.mjs en producción');
}
try {
  const hash = await bcrypt.hash('CuidadorDemo123!', 12);
  const result = await pool.query(`
    UPDATE usuario SET hash_contrasena = $1 WHERE id = $2 AND correo = $3
  `, [hash, '11111111-1111-4111-8111-111111111111', 'cuidador.demo@dafi.invalid']);
  if (!result.rowCount) throw new Error('Primero debes importar scripts/seed_demo.sql de A1');
  console.log('Credenciales de cuidador DEMO activadas para pruebas locales');
} finally {
  await pool.end();
}
