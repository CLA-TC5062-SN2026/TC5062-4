// Pruebas unitarias de utils/http.js para las refactorizaciones de S09-A1.
// No necesitan PostgreSQL: `transaction` recibe un pool falso.
// Ejecutar desde backend/: npm test
import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import { allowedKeys, transaction, validRol, ApiError } from "../src/utils/http.js";

const PERMITIDOS = Object.freeze({ nombre: "nombre", alergias: "alergias" });

describe("allowedKeys (R1 / F-01)", () => {
  test("devuelve las claves cuando todas están permitidas", () => {
    assert.deepEqual(allowedKeys({ nombre: "Ana", alergias: [] }, PERMITIDOS), [
      "nombre",
      "alergias",
    ]);
  });

  for (const clave of ["toString", "constructor", "hasOwnProperty", "valueOf"]) {
    test(`rechaza la propiedad heredada «${clave}» con 422`, () => {
      assert.throws(
        () => allowedKeys({ [clave]: "x" }, PERMITIDOS),
        (error) => error instanceof ApiError && error.status === 422,
      );
    });
  }

  test("rechaza «__proto__» enviado como clave propia del JSON", () => {
    // JSON.parse crea __proto__ como propiedad propia, igual que express.json().
    const cuerpo = JSON.parse('{"__proto__": {"nombre": "x"}}');
    assert.throws(() => allowedKeys(cuerpo, PERMITIDOS), { status: 422 });
  });

  test("rechaza un campo desconocido y un cuerpo vacío", () => {
    assert.throws(() => allowedKeys({ tipo: "menor" }, PERMITIDOS), { status: 422 });
    assert.throws(() => allowedKeys({}, PERMITIDOS), { status: 422 });
  });
});

function clienteFalso({ fallaRollback = false } = {}) {
  const consultas = [];
  const cliente = {
    consultas,
    release: mock.fn(),
    async query(sql) {
      consultas.push(sql);
      if (sql === "ROLLBACK" && fallaRollback) {
        throw new Error("conexión perdida durante ROLLBACK");
      }
    },
  };
  return { cliente, pool: { connect: async () => cliente } };
}

describe("transaction (R3 / F-08)", () => {
  test("confirma con COMMIT y libera la conexión", async () => {
    const { cliente, pool } = clienteFalso();
    const valor = await transaction(pool, async () => 42);
    assert.equal(valor, 42);
    assert.deepEqual(cliente.consultas, ["BEGIN", "COMMIT"]);
    assert.equal(cliente.release.mock.callCount(), 1);
  });

  test("ante un error hace ROLLBACK y propaga el error original", async () => {
    const { cliente, pool } = clienteFalso();
    const original = new Error("violación de llave única");
    await assert.rejects(
      transaction(pool, async () => {
        throw original;
      }),
      (error) => error === original,
    );
    assert.deepEqual(cliente.consultas, ["BEGIN", "ROLLBACK"]);
    // Un ROLLBACK correcto deja la conexión sana: vuelve al pool.
    assert.deepEqual(cliente.release.mock.calls[0].arguments, [undefined]);
  });

  test("si el ROLLBACK falla, sigue propagando el error original", async (t) => {
    const registro = t.mock.method(console, "error", () => {});
    const { cliente, pool } = clienteFalso({ fallaRollback: true });
    const original = new Error("violación de llave única");
    await assert.rejects(
      transaction(pool, async () => {
        throw original;
      }),
      (error) => error === original,
    );
    // El fallo del rollback queda en el registro, con ambas causas.
    assert.equal(registro.mock.callCount(), 1);
    const [, detalle] = registro.mock.calls[0].arguments;
    assert.equal(detalle.errorOriginal, original);
    assert.match(detalle.errorRollback.message, /ROLLBACK/);
    // La conexión se libera con el error para que pg-pool la descarte.
    assert.equal(cliente.release.mock.callCount(), 1);
    assert.equal(cliente.release.mock.calls[0].arguments[0], detalle.errorRollback);
  });
});

describe("validRol (B1, filtro ?rol= de miembros)", () => {
  test("sin parámetro no filtra", () => {
    assert.equal(validRol(undefined), null);
  });

  test("acepta los valores del enum Rol", () => {
    for (const rol of ["cuidador_principal", "cocuidador", "medico", "administrador"]) {
      assert.equal(validRol(rol), rol);
    }
  });

  for (const valor of ["doctor", "", "MEDICO", ["medico", "cocuidador"]]) {
    test(`rechaza ${JSON.stringify(valor)} con 422`, () => {
      assert.throws(() => validRol(valor), { status: 422, codigo: "DATOS_INVALIDOS" });
    });
  }
});
