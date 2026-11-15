import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import pool from "../src/config/database.js";
import authRouter from "../src/routes/auth.js";

const login = authRouter.stack.find(
  (layer) => layer.route?.path === "/auth/login" && layer.route.methods.post,
)?.route.stack[0].handle;

assert.equal(typeof login, "function");

test("F-05: contraseña incorrecta conserva respuesta 401", async (t) => {
  t.mock.method(pool, "query", async () => ({
    rowCount: 1,
    rows: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        hash_contrasena: "hash-simulado",
        activo: true,
      },
    ],
  }));

  t.mock.method(bcrypt, "compare", async () => false);

  const req = {
    body: {
      correo: "prueba@example.com",
      contrasena: "incorrecta123",
    },
  };

  await assert.rejects(
    login(req, {}),
    (error) => error.status === 401 && error.codigo === "NO_AUTENTICADO",
  );
});

test("F-05: excepción inesperada de bcrypt no se oculta", async (t) => {
  t.mock.method(pool, "query", async () => ({
    rowCount: 1,
    rows: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        hash_contrasena: "hash-simulado",
        activo: true,
      },
    ],
  }));

  const falloOriginal = new Error("Fallo simulado de bcrypt");

  t.mock.method(bcrypt, "compare", async () => {
    throw falloOriginal;
  });

  const req = {
    body: {
      correo: "prueba@example.com",
      contrasena: "correcta123",
    },
  };

  await assert.rejects(login(req, {}), (error) => error === falloOriginal);
});