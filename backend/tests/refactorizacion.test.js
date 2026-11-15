import test from "node:test";
import assert from "node:assert/strict";
import perfilesRouter from "../src/routes/perfiles.js";
import pool from "../src/config/database.js";
import conversacionesRouter from "../src/routes/conversaciones.js";
import bcrypt from "bcryptjs";
import authRouter from "../src/routes/auth.js";

const patchPerfil = perfilesRouter.stack.find(
  (layer) =>
    layer.route?.path === "/perfiles/:perfilId" && layer.route.methods.patch,
)?.route.stack[0].handle;

assert.equal(typeof patchPerfil, "function");

const perfilId = "550e8400-e29b-41d4-a716-446655440000";

for (const campo of ["toString", "constructor", "desconocido"]) {
  test(`F-01: PATCH rechaza el campo ${campo}`, async () => {
    const req = {
      params: { perfilId },
      body: { [campo]: "valor" },
    };

    await assert.rejects(
      patchPerfil(req, {}),
      (error) => error.status === 422 && error.codigo === "DATOS_INVALIDOS",
    );
  });
}

const postMensaje = conversacionesRouter.stack.find(
  (layer) =>
    layer.route?.path === "/conversaciones/:conversacionId/mensajes" &&
    layer.route.methods.post,
)?.route.stack[0].handle;

assert.equal(typeof postMensaje, "function");

test("F-02: el mensaje conserva el rol del autor autenticado", async (t) => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  const authorId = "550e8400-e29b-41d4-a716-446655440001";
  const messageId = "550e8400-e29b-41d4-a716-446655440002";
  const key = "550e8400-e29b-41d4-a716-446655440003";

  const client = {
    async query(sql) {
      if (sql.includes("INSERT INTO clave_idempotencia"))
        return { rowCount: 1, rows: [{ id: key }] };

      if (sql.includes("SELECT estado FROM conversacion"))
        return { rowCount: 1, rows: [{ estado: "ENVIADA" }] };

      if (sql.includes("INSERT INTO evento"))
        return {
          rowCount: 1,
          rows: [{ id: messageId, fecha: "2026-11-14T12:00:00Z" }],
        };

      if (sql.includes("SELECT nombre FROM usuario"))
        return { rowCount: 1, rows: [{ nombre: "Usuario de prueba" }] };

      if (sql.includes("UPDATE clave_idempotencia"))
        return { rowCount: 1, rows: [] };

      if (["BEGIN", "COMMIT", "ROLLBACK"].includes(sql))
        return { rowCount: 0, rows: [] };

      throw new Error(`Consulta no simulada: ${sql}`);
    },
    release() {},
  };

  t.mock.method(pool, "connect", async () => client);

  const req = {
    params: { conversacionId: id },
    auth: { id: authorId, rol: "cocuidador" },
    body: { texto: "Hola", fotoIds: [] },
    get: (header) => (header === "Idempotency-Key" ? key : undefined),
  };

  let response;

  const res = {
    location() {
      return this;
    },
    status() {
      return this;
    },
    json(body) {
      response = body;
      return this;
    },
  };

  await postMensaje(req, res);

  assert.equal(response.autor.id, authorId);
  assert.equal(response.autor.rol, "cocuidador");
});

const login = authRouter.stack.find(
  (layer) => layer.route?.path === "/auth/login" && layer.route.methods.post,
)?.route.stack[0].handle;

assert.equal(typeof login, "function");

test("F-05: contraseña incorrecta devuelve error 401", async (t) => {
  t.mock.method(pool, "query", async () => ({
    rowCount: 1,
    rows: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        hash_contrasena: "hash-de-prueba",
        activo: true,
      },
    ],
  }));

  t.mock.method(bcrypt, "compare", async () => false);

  const req = {
    body: {
      correo: "prueba@example.com",
      contrasena: "incorrecta",
    },
  };

  await assert.rejects(
    login(req, {}),
    (error) => error.status === 401 && error.codigo === "NO_AUTENTICADO",
  );
});

test("F-05: error interno de bcrypt se propaga", async (t) => {
  t.mock.method(pool, "query", async () => ({
    rowCount: 1,
    rows: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        hash_contrasena: "hash-de-prueba",
        activo: true,
      },
    ],
  }));

  const fallo = new Error("Fallo simulado de bcrypt");

  t.mock.method(bcrypt, "compare", async () => {
    throw fallo;
  });

  const req = {
    body: {
      correo: "prueba@example.com",
      contrasena: "password123",
    },
  };

  await assert.rejects(login(req, {}), (error) => error === fallo);
});

test("F-01: PATCH acepta campos válidos y ejecuta UPDATE", async (t) => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  const queries = [];

  t.mock.method(pool, "query", async (sql, params) => {
    queries.push({ sql, params });

    if (sql.includes("FROM v_perfil_paciente")) {
      return {
        rowCount: 1,
        rows: [
          {
            id,
            tipo: "propio",
            nombre: "Nombre actualizado",
            compartirConCocuidador: false,
          },
        ],
      };
    }

    if (sql.startsWith("UPDATE perfil_paciente SET")) {
      return { rowCount: 1, rows: [] };
    }

    throw new Error(`Consulta no simulada: ${sql}`);
  });

  const req = {
    params: { perfilId: id },
    body: { nombre: "Nombre actualizado" },
  };

  let response;

  const res = {
    json(body) {
      response = body;
      return this;
    },
  };

  await patchPerfil(req, res);

  const update = queries.find(({ sql }) =>
    sql.startsWith("UPDATE perfil_paciente SET"),
  );

  assert.ok(update);
  assert.match(update.sql, /SET nombre = \$1 WHERE id = \$2/);
  assert.deepEqual(update.params, ["Nombre actualizado", id]);
  assert.equal(response.nombre, "Nombre actualizado");
});