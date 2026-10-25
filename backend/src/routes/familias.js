import { Router } from 'express';
import pool from '../config/database.js';
import { missing, uuidOr404 } from '../utils/http.js';

const router = Router();

const resumen = `
  SELECT f.id, f.nombre,
    EXISTS (SELECT 1 FROM cuidador c WHERE c.familia_id = f.id AND c.tipo = 'cocuidador') AS "tieneCocuidador",
    (SELECT count(*)::int FROM perfil_paciente p WHERE p.familia_id = f.id) AS "totalPerfiles"
  FROM familia f
`;

// A1 sin autenticación: todas las familias son visibles solo en desarrollo local.
router.get('/familias', async (req, res) => {
  const result = await pool.query(`${resumen} ORDER BY f.creada_en DESC`);
  res.json(result.rows);
});

router.get('/familias/:familiaId', async (req, res) => {
  const id = uuidOr404(req.params.familiaId);
  const result = await pool.query(`${resumen} WHERE f.id = $1`, [id]);
  if (!result.rowCount) throw missing('Familia no encontrada');
  res.json(result.rows[0]);
});

export default router;
