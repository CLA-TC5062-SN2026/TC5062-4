// Pruebas unitarias de utils/http.js para las refactorizaciones de S09-A1.
// No necesitan PostgreSQL: `transaction` recibe un pool falso.
// Ejecutar desde backend/: npm test
import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import { allowedKeys, transaction, validRol, validRespuesta, validIndicacion, validTipoSangre, ApiError } from "../src/utils/http.js";

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

describe("validTipoSangre (F9, tipoSangre del perfil)", () => {
  test("acepta los 8 tipos", () => {
    for (const tipo of ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]) {
      assert.equal(validTipoSangre(tipo), tipo);
    }
  });

  test("undefined es «no enviado» y null lo borra", () => {
    assert.equal(validTipoSangre(undefined), undefined);
    assert.equal(validTipoSangre(null), null);
  });

  for (const valor of ["C+", "o+", "", "A", 1, true, ["O+"], { tipo: "O+" }]) {
    test(`rechaza ${JSON.stringify(valor)} con 422`, () => {
      assert.throws(() => validTipoSangre(valor), { status: 422, codigo: "DATOS_INVALIDOS" });
    });
  }
});

describe("validRespuesta (B2, RespuestaEntrada por tipo)", () => {
  const LUGARES = ["Axila", "Boca"];
  const NO_MEDIDA = ["No la he medido"];
  const rechaza = (tipo, opciones, cuerpo) =>
    assert.throws(() => validRespuesta(tipo, opciones, cuerpo), { status: 422, codigo: "DATOS_INVALIDOS" });

  test("opción de la lista", () => {
    assert.deepEqual(validRespuesta("opcion", LUGARES, { opcion: "Boca" }), { opcion: "Boca", texto: null, numero: null });
  });

  test("texto se guarda sin espacios sobrantes", () => {
    assert.equal(validRespuesta("texto", [], { texto: "  Desde anoche " }).texto, "Desde anoche");
  });

  test("numero_u_opcion acepta número o la opción", () => {
    assert.equal(validRespuesta("numero_u_opcion", NO_MEDIDA, { numero: 38.6 }).numero, 38.6);
    assert.equal(validRespuesta("numero_u_opcion", NO_MEDIDA, { numero: 30 }).numero, 30);
    assert.equal(validRespuesta("numero_u_opcion", NO_MEDIDA, { numero: 45 }).numero, 45);
    assert.equal(validRespuesta("numero_u_opcion", NO_MEDIDA, { opcion: "No la he medido" }).opcion, "No la he medido");
  });

  test("opcion_con_texto acepta opción con texto opcional", () => {
    assert.deepEqual(validRespuesta("opcion_con_texto", ["Sí", "No"], { opcion: "Sí", texto: "Paracetamol" }), {
      opcion: "Sí", texto: "Paracetamol", numero: null,
    });
    rechaza("opcion_con_texto", ["Sí", "No"], { texto: "Paracetamol" });
  });

  test("opción fuera de la lista", () => {
    rechaza("opcion", LUGARES, { opcion: "Pie" });
    rechaza("numero_u_opcion", NO_MEDIDA, { opcion: "38" });
  });

  for (const numero of [29.9, 45.1, Infinity, NaN, "38.5", null]) {
    test(`número inválido ${String(numero)}`, () => rechaza("numero_u_opcion", NO_MEDIDA, { numero }));
  }

  for (const texto of ["", "   ", "x".repeat(2001), 5]) {
    test(`texto inválido de largo ${String(texto).length}`, () => rechaza("texto", [], { texto }));
  }

  test("campo equivocado para el tipo", () => {
    rechaza("texto", [], { opcion: "Axila" });
    rechaza("opcion", LUGARES, { texto: "Axila" });
    rechaza("opcion", LUGARES, { numero: 38 });
    rechaza("numero_u_opcion", NO_MEDIDA, { texto: "38" });
    rechaza("numero_u_opcion", NO_MEDIDA, { numero: 38, opcion: "No la he medido" });
    rechaza("opcion", LUGARES, { opcion: "Axila", extra: 1 });
    rechaza("opcion", LUGARES, {});
  });
});

describe("validIndicacion (B4, IndicacionNueva)", () => {
  const rechaza = (body) => assert.throws(() => validIndicacion(body), { status: 422 });

  test("solo texto: recorta y deja decision y plazo en null", () => {
    assert.deepEqual(validIndicacion({ texto: "  Líquidos y reposo " }), {
      texto: "Líquidos y reposo",
      decision: null,
      plazoDias: null,
    });
  });

  test("consulta_presencial con plazo y las otras decisiones sin plazo", () => {
    assert.deepEqual(validIndicacion({ texto: "Vaya a consulta", decision: "consulta_presencial", plazoDias: 90 }), {
      texto: "Vaya a consulta",
      decision: "consulta_presencial",
      plazoDias: 90,
    });
    assert.equal(validIndicacion({ texto: "x".repeat(4000), decision: "acudir_a_urgencias", plazoDias: null }).decision, "acudir_a_urgencias");
    assert.equal(validIndicacion({ texto: "En casa", decision: null }).decision, null);
  });

  for (const texto of [undefined, "", "   ", "x".repeat(4001), 5]) {
    test(`texto inválido (${String(texto).length} caracteres)`, () => rechaza({ texto }));
  }

  test("decision fuera del catálogo", () => rechaza({ texto: "x", decision: "llamar" }));

  test("consulta_presencial sin plazoDias", () => {
    rechaza({ texto: "x", decision: "consulta_presencial" });
    rechaza({ texto: "x", decision: "consulta_presencial", plazoDias: null });
  });

  for (const plazoDias of [0, 91, 2.5, "7"]) {
    test(`plazoDias inválido: ${JSON.stringify(plazoDias)}`, () =>
      rechaza({ texto: "x", decision: "consulta_presencial", plazoDias }));
  }

  test("plazoDias sin consulta_presencial (la BD lo prohíbe)", () => {
    rechaza({ texto: "x", plazoDias: 7 });
    rechaza({ texto: "x", decision: "cuidado_en_casa", plazoDias: 7 });
  });
});
