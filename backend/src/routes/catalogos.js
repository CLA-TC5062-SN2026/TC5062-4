import { Router } from "express";
import pool from "../config/database.js";
import { missing } from "../utils/http.js";

const router = Router();

router.get("/salud", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      estado: "ok",
      baseDatos: "ok",
      version: "2.0.0",
      hora: new Date().toISOString(),
    });
  } catch {
    res
      .status(503)
      .json({
        estado: "degradado",
        baseDatos: "sin_conexion",
        version: "2.0.0",
        hora: new Date().toISOString(),
      });
  }
});

router.get("/etiquetas", async (req, res) => {
  const result = await pool.query(`
    SELECT e.codigo, e.nombre,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', p.codigo, 'texto', p.texto, 'tipoRespuesta', p.tipo_respuesta,
          'opciones', p.opciones, 'obligatoria', p.obligatoria, 'etiqueta', e.codigo
        ) ORDER BY p.codigo)
        FROM etiqueta_pregunta ep
        JOIN pregunta_contexto p ON p.id = ep.pregunta_id
        WHERE ep.etiqueta_id = e.id
      ), '[]'::jsonb) AS preguntas
    FROM etiqueta e WHERE e.activa = true ORDER BY e.nombre
  `);
  res.json(result.rows);
});

router.get("/avisos/:codigo", async (req, res) => {
  const result = await pool.query(
    `
    SELECT codigo, version, texto, requiere_aceptacion AS "requiereAceptacion"
    FROM aviso WHERE codigo::text = $1 ORDER BY version DESC LIMIT 1
  `,
    [req.params.codigo],
  );
  if (!result.rowCount) throw missing("Aviso no encontrado");
  res.json(result.rows[0]);
});

export default router;