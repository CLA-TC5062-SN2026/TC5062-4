import { Router } from "express";
import pool from "../config/database.js";
import { missing, uuidOr404, validRol } from "../utils/http.js";

const router = Router();

const resumen = `
  SELECT f.id, f.nombre,
    EXISTS (SELECT 1 FROM cuidador c WHERE c.familia_id = f.id AND c.tipo = 'cocuidador') AS "tieneCocuidador",
    (SELECT count(*)::int FROM perfil_paciente p WHERE p.familia_id = f.id) AS "totalPerfiles"
  FROM familia f
`;

router.get("/familias", async (req, res) => {
  const filter =
    req.auth.rol === "medico"
      ? "WHERE EXISTS (SELECT 1 FROM miembro_circulo m WHERE m.familia_id = f.id AND m.medico_id = $1)"
      : "WHERE f.id = $1";
  const value = req.auth.rol === "medico" ? req.auth.id : req.auth.familiaId;
  const result = await pool.query(
    `${resumen} ${filter} ORDER BY f.creada_en DESC`,
    [value],
  );
  res.json(result.rows);
});

router.get("/familias/:familiaId", async (req, res) => {
  const id = uuidOr404(req.params.familiaId);
  const result = await pool.query(`${resumen} WHERE f.id = $1`, [id]);
  if (!result.rowCount) throw missing("Familia no encontrada");
  res.json(result.rows[0]);
});

// Cuidadores de la familia y médicos de su círculo (RF-07-AC-3, RF-09-AC-3).
router.get("/familias/:familiaId/miembros", async (req, res) => {
  const id = uuidOr404(req.params.familiaId);
  const rol = validRol(req.query.rol);
  const result = await pool.query(
    `
    SELECT * FROM (
      SELECT u.id AS "usuarioId", u.nombre,
        CASE c.tipo WHEN 'principal' THEN 'cuidador_principal' ELSE 'cocuidador' END AS rol,
        NULL AS especialidad, NULL AS leyenda, c.declarado_en AS desde
      FROM cuidador c JOIN usuario u ON u.id = c.id
      WHERE c.familia_id = $1
      UNION ALL
      SELECT u.id, u.nombre, 'medico', m.especialidad, 'Contacto agregado por usted', mc.desde
      FROM miembro_circulo mc
        JOIN medico m ON m.id = mc.medico_id
        JOIN usuario u ON u.id = m.id
      WHERE mc.familia_id = $1
    ) miembros
    WHERE $2::text IS NULL OR rol = $2
    ORDER BY desde, nombre
  `,
    [id, rol],
  );
  res.json(result.rows);
});

export default router;
