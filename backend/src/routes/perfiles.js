import { Router } from "express";
import { randomBytes, createHash } from "node:crypto";
import pool from "../config/database.js";
import {
  missing,
  assert,
  allowedKeys,
  requireObject,
  uuidOr404,
  validName,
  validDate,
  validTexts,
  validBoolean,
  validTipoSangre,
  transaction,
} from "../utils/http.js";

const router = Router();

// Campos que admite PATCH /perfiles/{id}: nombre del contrato -> columna.
// Fuera de la ruta y congelado: es configuración, no estado de la petición.
const COLUMNAS_PERFIL = Object.freeze({
  nombre: "nombre",
  fechaNacimiento: "fecha_nacimiento",
  alergias: "alergias",
  medicamentos: "medicamentos",
  tipoSangre: "tipo_sangre",
  compartirConCocuidador: "compartir_con_cocuidador",
  resumenActivo: "resumen_activo",
});

const selectPerfil = `
  SELECT p.id, p.familia_id AS "familiaId", p.tipo, p.nombre,
    to_char(p.fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento",
    p.edad_anios AS "edadAnios", p.alergias, p.medicamentos,
    p.tipo_sangre AS "tipoSangre", p.estado,
    p.compartir_con_cocuidador AS "compartirConCocuidador",
    p.resumen_activo AS "resumenActivo"
  FROM v_perfil_paciente p
`;

async function getPerfil(id, client = pool) {
  const result = await client.query(`${selectPerfil} WHERE p.id = $1`, [id]);
  if (!result.rowCount) throw missing("Perfil no encontrado");
  return result.rows[0];
}

router.get("/familias/:familiaId/perfiles", async (req, res) => {
  const id = uuidOr404(req.params.familiaId);
  const family = await pool.query("SELECT 1 FROM familia WHERE id = $1", [id]);
  if (!family.rowCount) throw missing("Familia no encontrada");
  const visibility =
    req.auth.rol === "cocuidador"
      ? "AND (p.tipo = 'menor' OR p.compartir_con_cocuidador = true)"
      : "";
  const result = await pool.query(
    `${selectPerfil} WHERE p.familia_id = $1 ${visibility} ORDER BY p.nombre`,
    [id],
  );
  res.json(result.rows);
});

router.post("/familias/:familiaId/perfiles", async (req, res) => {
  const familiaId = uuidOr404(req.params.familiaId);
  const body = requireObject(req.body);
  assert(
    ["menor", "propio", "adulto_representado"].includes(body.tipo),
    "tipo de perfil inválido",
  );
  const nombre = validName(body.nombre);
  const fecha = validDate(body.fechaNacimiento);
  const alergias = validTexts(body.alergias ?? [], "alergias");
  const medicamentos = validTexts(body.medicamentos ?? [], "medicamentos");
  const tipoSangre = validTipoSangre(body.tipoSangre) ?? null;
  const compartir = validBoolean(
    body.compartirConCocuidador ?? false,
    "compartirConCocuidador",
  );
  assert(
    body.tipo !== "menor" || !compartir,
    "Un menor no admite compartirConCocuidador",
  );
  if (body.tipo === "adulto_representado") {
    assert(
      typeof body.correo === "string" &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.correo),
      "correo obligatorio para adulto representado",
    );
  }

  const perfil = await transaction(pool, async (client) => {
    const family = await client.query("SELECT 1 FROM familia WHERE id = $1", [
      familiaId,
    ]);
    if (!family.rowCount) throw missing("Familia no encontrada");
    const created = await client.query(
      `
      INSERT INTO perfil_paciente (
        familia_id, tipo, nombre, fecha_nacimiento, alergias,
        medicamentos, compartir_con_cocuidador, tipo_sangre
      ) VALUES ($1,$2,$3,$4,$5::text[],$6::text[],$7,$8) RETURNING id
    `,
      [
        familiaId,
        body.tipo,
        nombre,
        fecha,
        alergias,
        medicamentos,
        compartir,
        tipoSangre,
      ],
    );
    const id = created.rows[0].id;

    if (body.tipo === "adulto_representado") {
      // A1 registra el consentimiento como pendiente; A2 implementará el envío y aceptación del enlace.
      const tokenHash = createHash("sha256")
        .update(randomBytes(32))
        .digest("hex");
      await client.query(
        `
        INSERT INTO consentimiento_adulto (perfil_id, correo, token_hash, vence_en)
        VALUES ($1,$2,$3, now() + interval '7 days')
      `,
        [id, body.correo, tokenHash],
      );
    }
    return getPerfil(id, client);
  });

  res.location(`/api/v1/perfiles/${perfil.id}`).status(201).json(perfil);
});

router.get("/perfiles/:perfilId", async (req, res) => {
  res.json(await getPerfil(uuidOr404(req.params.perfilId)));
});

router.patch("/perfiles/:perfilId", async (req, res) => {
  const id = uuidOr404(req.params.perfilId);
  const body = requireObject(req.body);
  const keys = allowedKeys(body, COLUMNAS_PERFIL);
  const current = await getPerfil(id);
  if ("nombre" in body) body.nombre = validName(body.nombre);
  if ("fechaNacimiento" in body)
    body.fechaNacimiento = validDate(body.fechaNacimiento);
  for (const key of ["alergias", "medicamentos"]) {
    if (key in body) body[key] = validTexts(body[key], key);
  }
  for (const key of ["compartirConCocuidador", "resumenActivo"]) {
    if (key in body) body[key] = validBoolean(body[key], key);
  }
  if ("tipoSangre" in body) validTipoSangre(body.tipoSangre);
  const compartir =
    body.compartirConCocuidador ?? current.compartirConCocuidador;
  assert(
    current.tipo !== "menor" || !compartir,
    "Un menor no admite compartirConCocuidador",
  );
  const values = keys.map((key) => body[key]);
  const assignments = keys
    .map((key, index) => `${COLUMNAS_PERFIL[key]} = $${index + 1}`)
    .join(", ");
  await pool.query(
    `UPDATE perfil_paciente SET ${assignments} WHERE id = $${keys.length + 1}`,
    [...values, id],
  );
  res.json(await getPerfil(id));
});

router.delete("/perfiles/:perfilId", async (req, res) => {
  const id = uuidOr404(req.params.perfilId);
  const result = await pool.query(
    "DELETE FROM perfil_paciente WHERE id = $1 RETURNING id",
    [id],
  );
  if (!result.rowCount) throw missing("Perfil no encontrado");
  res.status(204).end();
});

export default router;