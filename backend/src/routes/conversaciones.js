import { Router } from "express";
import { createHash } from "node:crypto";
import pool from "../config/database.js";
import {
  ApiError,
  invalid,
  missing,
  conflict,
  assert,
  requireObject,
  uuidOr404,
  isUuid,
  validName,
  validBoolean,
  pageParams,
  transaction,
} from "../utils/http.js";

const router = Router();
const base = `
  SELECT c.id, p.familia_id AS "familiaId", f.nombre AS "familiaNombre",
    json_build_object('id',p.id,'nombre',p.nombre) AS perfil,
    c.titulo, c.estado, c.prioridad_indicada AS "prioridadIndicada",
    c.creada_en AS "creadaEn", c.enviada_en AS "enviadaEn",
    c.ultimo_evento_en AS "ultimoEventoEn", c.version,
    CASE WHEN m.id IS NULL THEN NULL ELSE json_build_object(
      'id',m.id,'nombre',m.nombre,'rol','medico') END AS medico,
    COALESCE((SELECT array_agg(e.codigo ORDER BY e.codigo)
      FROM conversacion_etiqueta ce
      JOIN etiqueta e ON e.id = ce.etiqueta_id
      WHERE ce.conversacion_id = c.id), ARRAY[]::text[]) AS etiquetas
  FROM v_conversacion c
  JOIN perfil_paciente p ON p.id = c.perfil_id
  JOIN familia f ON f.id = p.familia_id
  LEFT JOIN usuario m ON m.id = c.medico_id
`;

async function resumen(id, client = pool) {
  const { rows } = await client.query(`${base} WHERE c.id = $1`, [id]);
  if (!rows.length) throw missing("Conversación no encontrada");
  return rows[0];
}

async function detalle(id, client = pool) {
  const data = await resumen(id, client);
  const [questions, photos] = await Promise.all([
    client.query(
      `
      SELECT DISTINCT q.codigo AS id, q.texto, q.tipo_respuesta AS "tipoRespuesta",
        q.opciones, q.obligatoria,
        CASE WHEN q.es_general THEN NULL ELSE (
          SELECT e.codigo FROM etiqueta_pregunta ep
          JOIN etiqueta e ON e.id = ep.etiqueta_id
          JOIN conversacion_etiqueta ce ON ce.etiqueta_id = e.id
          WHERE ep.pregunta_id = q.id AND ce.conversacion_id = $1 LIMIT 1
        ) END AS etiqueta,
        r.id AS "respuestaId", r.opcion, r.texto AS "respuestaTexto", r.numero
      FROM pregunta_contexto q
      LEFT JOIN respuesta r ON r.pregunta_id = q.id AND r.conversacion_id = $1
      WHERE q.es_general OR EXISTS (
        SELECT 1 FROM etiqueta_pregunta ep
        JOIN conversacion_etiqueta ce ON ce.etiqueta_id = ep.etiqueta_id
        WHERE ep.pregunta_id = q.id AND ce.conversacion_id = $1
      ) ORDER BY id
    `,
      [id],
    ),
    client.query(
      `
      SELECT id, conversacion_id AS "conversacionId", bytes,
        ancho_px AS "anchoPx", alto_px AS "altoPx",
        zona_sensible AS "zonaSensible", subida_en AS "subidaEn"
      FROM foto WHERE conversacion_id = $1 ORDER BY subida_en
    `,
      [id],
    ),
  ]);
  const preguntas = questions.rows.map((q) => {
    const { respuestaId, respuestaTexto, opcion, numero, ...pregunta } = q;
    if (respuestaId)
      pregunta.respuesta = {
        id: respuestaId,
        opcion,
        texto: respuestaTexto,
        numero,
      };
    return pregunta;
  });
  const puntosPendientes = preguntas
    .filter((q) => q.obligatoria && !q.respuesta)
    .map((q) => ({
      tipo: "pregunta",
      referencia: q.id,
      mensaje: `Falta responder ${q.id}`,
    }));
  return {
    ...data,
    preguntas,
    fotos: photos.rows.map((p) => ({
      ...p,
      url: `/api/v1/conversaciones/${id}/fotos/${p.id}`,
    })),
    puntosPendientes,
    mostrarAvisoEmergencias: data.estado !== "CERRADA",
  };
}

function validEtiquetas(etiquetas) {
  assert(
    Array.isArray(etiquetas) &&
      etiquetas.length >= 1 &&
      etiquetas.length <= 3 &&
      etiquetas.every(
        (e) => typeof e === "string" && /^[a-z_]{2,30}$/.test(e),
      ) &&
      new Set(etiquetas).size === etiquetas.length,
    "etiquetas debe incluir entre 1 y 3 códigos diferentes",
  );
  return etiquetas;
}

async function saveEtiquetas(client, id, etiquetas) {
  const found = await client.query(
    "SELECT id, codigo FROM etiqueta WHERE activa = true AND codigo = ANY($1::text[])",
    [etiquetas],
  );
  if (found.rowCount !== etiquetas.length)
    throw invalid("Hay etiquetas no disponibles en el catálogo");
  await client.query(
    "DELETE FROM conversacion_etiqueta WHERE conversacion_id = $1",
    [id],
  );
  for (const row of found.rows) {
    await client.query(
      "INSERT INTO conversacion_etiqueta (conversacion_id,etiqueta_id) VALUES ($1,$2)",
      [id, row.id],
    );
  }
}

async function list(req, res, where, params) {
  const { pagina, limite, offset } = pageParams(req.query);
  if (req.auth.rol === "medico") {
    params.push(req.auth.id);
    // El médico no ve borradores (la familia decide cuándo enviar, RF-12) y deja de ver
    // todo en cuanto sale del círculo de la familia (RF-08-AC-3).
    where.push(
      `(c.medico_id = $${params.length} OR EXISTS (SELECT 1 FROM permiso_historial ph WHERE ph.perfil_id = p.id AND ph.medico_id = $${params.length} AND ph.compartir_historial = true))`,
      `c.estado <> 'BORRADOR'`,
      `EXISTS (SELECT 1 FROM miembro_circulo mc WHERE mc.familia_id = p.familia_id AND mc.medico_id = $${params.length})`,
    );
  } else {
    params.push(req.auth.familiaId);
    where.push(`p.familia_id = $${params.length}`);
    if (req.auth.rol === "cocuidador") {
      where.push(`(p.tipo = 'menor' OR p.compartir_con_cocuidador = true)`);
    }
  }
  const conditions = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const count = await pool.query(
    `
    SELECT count(*)::int AS total FROM conversacion c
    JOIN perfil_paciente p ON p.id = c.perfil_id ${conditions}
  `,
    params,
  );
  const result = await pool.query(
    `
    ${base} ${conditions} ORDER BY c.creada_en DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `,
    [...params, limite, offset],
  );
  res.json({
    datos: result.rows,
    paginacion: { pagina, limite, total: count.rows[0].total },
  });
}

router.get("/conversaciones", async (req, res) => {
  const where = [];
  const values = [];
  if (req.query.familiaId) {
    uuidOr404(req.query.familiaId);
    values.push(req.query.familiaId);
    where.push(`p.familia_id = $${values.length}`);
  }
  if (req.query.estado) {
    assert(
      [
        "BORRADOR",
        "ENVIADA",
        "EN_REVISION",
        "INFO_SOLICITADA",
        "CON_INDICACIONES",
        "CERRADA",
        "SIN_MEDICO",
      ].includes(req.query.estado),
      "estado inválido",
    );
    values.push(req.query.estado);
    where.push(`c.estado::text = $${values.length}`);
  }
  await list(req, res, where, values);
});

router.get("/perfiles/:perfilId/conversaciones", async (req, res) => {
  const id = uuidOr404(req.params.perfilId);
  if (
    !(await pool.query("SELECT 1 FROM perfil_paciente WHERE id = $1", [id]))
      .rowCount
  ) {
    throw missing("Perfil no encontrado");
  }
  await list(req, res, ["c.perfil_id = $1"], [id]);
});

router.post("/perfiles/:perfilId/conversaciones", async (req, res) => {
  const perfilId = uuidOr404(req.params.perfilId);
  const body = requireObject(req.body);
  const titulo = validName(body.titulo, "titulo");
  const etiquetas = validEtiquetas(body.etiquetas);
  assert(isUuid(body.medicoId), "medicoId debe ser UUID");
  const prioridad = validBoolean(
    body.prioridadIndicada ?? false,
    "prioridadIndicada",
  );
  const conversacion = await transaction(pool, async (client) => {
    if (
      !(
        await client.query("SELECT 1 FROM perfil_paciente WHERE id = $1", [
          perfilId,
        ])
      ).rowCount
    ) {
      throw missing("Perfil no encontrado");
    }
    const circle = await client.query(
      `
      SELECT 1 FROM miembro_circulo m JOIN perfil_paciente p ON p.familia_id = m.familia_id
      WHERE p.id = $1 AND m.medico_id = $2
    `,
      [perfilId, body.medicoId],
    );
    if (!circle.rowCount)
      throw invalid("El médico no pertenece al círculo familiar");
    const inserted = await client.query(
      `
      INSERT INTO conversacion (perfil_id,medico_id,titulo,prioridad_indicada,abierta_por_id)
      VALUES ($1,$2,$3,$4,$5) RETURNING id
    `,
      [perfilId, body.medicoId, titulo, prioridad, req.auth.id],
    );
    const id = inserted.rows[0].id;
    await saveEtiquetas(client, id, etiquetas);
    return detalle(id, client);
  });
  res.set("ETag", `"${conversacion.version}"`);
  res
    .location(`/api/v1/conversaciones/${conversacion.id}`)
    .status(201)
    .json(conversacion);
});

router.get("/conversaciones/:conversacionId", async (req, res) => {
  const data = await detalle(uuidOr404(req.params.conversacionId));
  res.set("ETag", `"${data.version}"`).json(data);
});

router.patch("/conversaciones/:conversacionId", async (req, res) => {
  const id = uuidOr404(req.params.conversacionId);
  const body = requireObject(req.body);
  const allowed = ["titulo", "etiquetas", "medicoId", "prioridadIndicada"];
  const keys = Object.keys(body);
  assert(
    keys.length > 0 && keys.every((key) => allowed.includes(key)),
    "Campos de actualización inválidos",
  );
  if ("titulo" in body) body.titulo = validName(body.titulo, "titulo");
  if ("etiquetas" in body) validEtiquetas(body.etiquetas);
  if ("medicoId" in body) assert(isUuid(body.medicoId), "medicoId inválido");
  if ("prioridadIndicada" in body)
    validBoolean(body.prioridadIndicada, "prioridadIndicada");

  const data = await transaction(pool, async (client) => {
    const existing = await client.query(
      "SELECT estado, version FROM conversacion WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!existing.rowCount) throw missing("Conversación no encontrada");
    if (existing.rows[0].estado !== "BORRADOR")
      throw conflict("Solo se puede editar una conversación en BORRADOR");
    const etag = req.get("If-Match");
    if (etag && etag !== `"${existing.rows[0].version}"`) {
      throw new ApiError(
        412,
        "VERSION_DESACTUALIZADA",
        "La conversación fue modificada",
      );
    }
    const fields = {
      titulo: "titulo",
      medicoId: "medico_id",
      prioridadIndicada: "prioridad_indicada",
    };
    const changes = keys.filter((key) => key !== "etiquetas");
    const assignments = changes.map((key, i) => `${fields[key]} = $${i + 1}`);
    const values = changes.map((key) => body[key]);
    assignments.push("version = version + 1");
    await client.query(
      `UPDATE conversacion SET ${assignments.join(", ")} WHERE id = $${values.length + 1}`,
      [...values, id],
    );
    if ("etiquetas" in body) await saveEtiquetas(client, id, body.etiquetas);
    return detalle(id, client);
  });
  res.set("ETag", `"${data.version}"`).json(data);
});

router.delete("/conversaciones/:conversacionId", async (req, res) => {
  const id = uuidOr404(req.params.conversacionId);
  const result = await pool.query(
    "DELETE FROM conversacion WHERE id = $1 RETURNING id",
    [id],
  );
  if (!result.rowCount) throw missing("Conversación no encontrada");
  res.status(204).end();
});

router.get("/conversaciones/:conversacionId/eventos", async (req, res) => {
  const id = uuidOr404(req.params.conversacionId);
  await resumen(id);
  const { pagina, limite, offset } = pageParams(req.query);
  const total = await pool.query(
    "SELECT count(*)::int AS total FROM evento WHERE conversacion_id = $1",
    [id],
  );
  const eventos = await pool.query(
    `
    SELECT e.id, e.conversacion_id AS "conversacionId", e.tipo, e.fecha, e.texto,
      e.estado_anterior AS "estadoAnterior", e.estado_nuevo AS "estadoNuevo",
      CASE WHEN u.id IS NOT NULL THEN json_build_object('id',u.id,'nombre',u.nombre,
        'rol',CASE WHEN u.tipo_usuario = 'cuidador' THEN 'cuidador_principal' ELSE u.tipo_usuario::text END)
      ELSE json_build_object('id','00000000-0000-4000-8000-000000000000','nombre','DAFI','rol','administrador') END AS autor
    FROM evento e LEFT JOIN usuario u ON u.id = e.autor_id
    WHERE e.conversacion_id = $1 ORDER BY e.fecha ASC
    LIMIT $2 OFFSET $3
  `,
    [id, limite, offset],
  );
  res.json({
    datos: eventos.rows,
    paginacion: { pagina, limite, total: total.rows[0].total },
  });
});

router.post("/conversaciones/:conversacionId/envios", async (req, res) => {
  const id = uuidOr404(req.params.conversacionId);
  const key = req.get("Idempotency-Key");
  if (!isUuid(key))
    throw new ApiError(
      400,
      "SOLICITUD_MALFORMADA",
      "Idempotency-Key debe ser UUID",
    );
  const author = req.auth.id;
  const body = req.body ?? {};
  requireObject(body);
  assert(
    Object.keys(body).length === 0,
    "Envío desde BORRADOR no admite cuerpo",
  );
  const fingerprint = createHash("sha256")
    .update(`${id}:envio:${JSON.stringify(body)}`)
    .digest("hex");

  const result = await transaction(pool, async (client) => {
    const saved = await client.query(
      `
      INSERT INTO clave_idempotencia (usuario_id, clave, huella_cuerpo)
      VALUES ($1,$2,$3) ON CONFLICT (usuario_id, clave) DO NOTHING RETURNING id
    `,
      [author, key, fingerprint],
    );
    if (!saved.rowCount) {
      const prev = await client.query(
        `
        SELECT huella_cuerpo, codigo_http, cuerpo_respuesta
        FROM clave_idempotencia WHERE usuario_id = $1 AND clave = $2 FOR UPDATE
      `,
        [author, key],
      );
      if (prev.rows[0].huella_cuerpo !== fingerprint)
        throw invalid("Idempotency-Key reutilizada con otro cuerpo");
      if (!prev.rows[0].codigo_http) throw conflict("Solicitud en curso");
      return { replay: true, value: prev.rows[0].cuerpo_respuesta };
    }
    const existing = await client.query(
      `
      SELECT c.estado, c.medico_id, p.tipo, v.estado AS estado_perfil
      FROM conversacion c
      JOIN perfil_paciente p ON p.id = c.perfil_id
      JOIN v_perfil_paciente v ON v.id = p.id
      WHERE c.id = $1 FOR UPDATE OF c
    `,
      [id],
    );
    if (!existing.rowCount) throw missing("Conversación no encontrada");
    const c = existing.rows[0];
    if (c.estado !== "BORRADOR")
      throw conflict("Solo se pueden enviar borradores");
    if (!c.medico_id) throw invalid("La conversación debe tener médico");
    if (c.estado_perfil === "pendiente_consentimiento") {
      throw new ApiError(
        422,
        "CONSENTIMIENTO_PENDIENTE",
        "El adulto todavía no ha dado consentimiento",
      );
    }
    const current = await detalle(id, client);
    if (current.puntosPendientes.length) {
      throw new ApiError(
        422,
        "CONVERSACION_INCOMPLETA",
        "Faltan respuestas obligatorias",
      );
    }
    await client.query(
      `
      UPDATE conversacion SET estado = 'ENVIADA', enviada_en = now(), version = version + 1
      WHERE id = $1
    `,
      [id],
    );
    await client.query(
      `
      INSERT INTO evento (conversacion_id, tipo, autor_id, estado_anterior, estado_nuevo)
      VALUES ($1, 'cambio_estado', $2, 'BORRADOR', 'ENVIADA')
    `,
      [id, author],
    );
    const updated = await detalle(id, client);
    await client.query(
      `
      UPDATE clave_idempotencia SET codigo_http = 200, cuerpo_respuesta = $3::jsonb
      WHERE usuario_id = $1 AND clave = $2
    `,
      [author, key, JSON.stringify(updated)],
    );
    return { replay: false, value: updated };
  });
  if (result.replay) res.set("Idempotency-Replayed", "true");
  res.set("ETag", `"${result.value.version}"`).status(200).json(result.value);
});

// La identidad del autor proviene exclusivamente del JWT validado.
router.post("/conversaciones/:conversacionId/mensajes", async (req, res) => {
  const id = uuidOr404(req.params.conversacionId);
  const body = requireObject(req.body);
  const texto = body.texto;
  const fotoIds = body.fotoIds ?? [];
  assert(
    (typeof texto === "string" &&
      texto.trim().length >= 1 &&
      texto.length <= 4000) ||
      (Array.isArray(fotoIds) && fotoIds.length > 0),
    "Se requiere texto o fotoIds",
  );
  assert(
    Array.isArray(fotoIds) &&
      fotoIds.length <= 6 &&
      fotoIds.every(isUuid) &&
      new Set(fotoIds).size === fotoIds.length,
    "fotoIds inválidos",
  );
  validBoolean(body.respondeASolicitud ?? false, "respondeASolicitud");
  const key = req.get("Idempotency-Key");
  if (!isUuid(key))
    throw new ApiError(
      400,
      "SOLICITUD_MALFORMADA",
      "Idempotency-Key debe ser UUID",
    );
  const author = req.auth.id;
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");

  const result = await transaction(pool, async (client) => {
    const insert = await client.query(
      `
      INSERT INTO clave_idempotencia (usuario_id, clave, huella_cuerpo)
      VALUES ($1,$2,$3) ON CONFLICT (usuario_id, clave) DO NOTHING RETURNING id
    `,
      [author, key, fingerprint],
    );
    if (!insert.rowCount) {
      const prev = await client.query(
        `
        SELECT huella_cuerpo, codigo_http, cuerpo_respuesta
        FROM clave_idempotencia WHERE usuario_id = $1 AND clave = $2 FOR UPDATE
      `,
        [author, key],
      );
      if (prev.rows[0].huella_cuerpo !== fingerprint) {
        throw invalid("Idempotency-Key reutilizada con otro cuerpo");
      }
      if (!prev.rows[0].codigo_http) throw conflict("Solicitud en curso");
      return { replay: true, value: prev.rows[0].cuerpo_respuesta };
    }
    const conv = await client.query(
      "SELECT estado FROM conversacion WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!conv.rowCount) throw missing("Conversación no encontrada");
    if (["BORRADOR", "CERRADA"].includes(conv.rows[0].estado)) {
      throw conflict("No se puede enviar mensaje en este estado");
    }
    if (fotoIds.length) {
      const count = await client.query(
        `
        SELECT count(*)::int AS n FROM foto WHERE conversacion_id = $1 AND id = ANY($2::uuid[])
      `,
        [id, fotoIds],
      );
      if (count.rows[0].n !== fotoIds.length)
        throw invalid("Alguna foto no pertenece a la conversación");
    }
    const event = await client.query(
      `
      INSERT INTO evento (conversacion_id, tipo, autor_id, texto, responde_a_solicitud)
      VALUES ($1,'mensaje',$2,$3,$4) RETURNING id, fecha
    `,
      [
        id,
        author,
        typeof texto === "string" ? texto.trim() : null,
        body.respondeASolicitud ?? false,
      ],
    );
    for (const fotoId of fotoIds) {
      await client.query(
        "INSERT INTO mensaje_foto (evento_id, foto_id) VALUES ($1,$2)",
        [event.rows[0].id, fotoId],
      );
    }
    const user = await client.query(
      "SELECT nombre FROM usuario WHERE id = $1",
      [author],
    );
    const value = {
      id: event.rows[0].id,
      conversacionId: id,
      tipo: "mensaje",
      autor: {
        id: author,
        nombre: user.rows[0].nombre,
        rol: "cuidador_principal",
      },
      fecha: event.rows[0].fecha,
      texto: texto ?? null,
      fotoIds,
    };
    await client.query(
      `
      UPDATE clave_idempotencia SET codigo_http = 201, cuerpo_respuesta = $3::jsonb
      WHERE usuario_id = $1 AND clave = $2
    `,
      [author, key, JSON.stringify(value)],
    );
    return { replay: false, value };
  });
  if (result.replay) res.set("Idempotency-Replayed", "true");
  res
    .location(`/api/v1/conversaciones/${id}/eventos/${result.value.id}`)
    .status(result.replay ? 201 : 201)
    .json(result.value);
});

export default router;