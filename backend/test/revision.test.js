// Pruebas unitarias de la regla de B3 (RF-16-AC-2). No necesitan PostgreSQL.
// Ejecutar desde backend/: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { debeIniciarRevision } from "../src/utils/revision.js";

const MEDICA = "11111111-1111-4111-8111-111111111111";
const OTRA = "22222222-2222-4222-8222-222222222222";
const base = { rol: "medico", usuarioId: MEDICA, estado: "ENVIADA", medicoId: MEDICA };

describe("debeIniciarRevision", () => {
  test("la médica asignada abre una ENVIADA: hay transición", () => {
    assert.equal(debeIniciarRevision(base), true);
  });

  test("una médica que no es la asignada no la dispara", () => {
    assert.equal(debeIniciarRevision({ ...base, usuarioId: OTRA }), false);
  });

  for (const rol of ["cuidador_principal", "cocuidador"]) {
    test(`el rol ${rol} no la dispara aunque su id coincida`, () => {
      assert.equal(debeIniciarRevision({ ...base, rol }), false);
    });
  }

  for (const estado of ["BORRADOR", "EN_REVISION", "INFO_SOLICITADA", "CON_INDICACIONES", "CERRADA", "SIN_MEDICO"]) {
    test(`en ${estado} no hay transición`, () => {
      assert.equal(debeIniciarRevision({ ...base, estado }), false);
    });
  }

  test("sin médico asignado no hay transición", () => {
    assert.equal(debeIniciarRevision({ ...base, usuarioId: undefined, medicoId: undefined }), false);
    assert.equal(debeIniciarRevision({ ...base, medicoId: null }), false);
  });
});
