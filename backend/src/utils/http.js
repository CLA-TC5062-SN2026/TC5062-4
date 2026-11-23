export class ApiError extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

export const invalid = (mensaje) =>
  new ApiError(422, "DATOS_INVALIDOS", mensaje);
export const missing = (mensaje = "Recurso no encontrado") =>
  new ApiError(404, "NO_ENCONTRADO", mensaje);
export const conflict = (mensaje) =>
  new ApiError(409, "TRANSICION_INVALIDA", mensaje);

export const isUuid = (id) =>
  typeof id === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );

export function uuidOr404(id) {
  if (!isUuid(id)) throw missing();
  return id;
}

export function requireObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalid("El cuerpo debe ser un objeto JSON");
  }
  return value;
}

export function assert(condition, mensaje) {
  if (!condition) throw invalid(mensaje);
}

// Devuelve las claves del cuerpo si todas están en la lista de campos
// permitidos. Usa Object.hasOwn y no el operador `in`: `in` también recorre la
// cadena de prototipos, así que una clave como "toString" o "constructor"
// pasaba la validación y terminaba en un UPDATE con SQL inválido (500).
export function allowedKeys(body, allowed) {
  const keys = Object.keys(body);
  assert(
    keys.length > 0 && keys.every((key) => Object.hasOwn(allowed, key)),
    "Campos de actualización inválidos",
  );
  return keys;
}

export function validName(value, field = "nombre") {
  assert(
    typeof value === "string" && value.trim().length > 0 && value.length <= 80,
    `${field} debe tener entre 1 y 80 caracteres`,
  );
  return value.trim();
}

export function validDate(value) {
  assert(
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value),
    "fechaNacimiento debe tener formato AAAA-MM-DD",
  );
  const date = new Date(`${value}T00:00:00Z`);
  assert(
    !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= "1900-01-01" &&
      value <= new Date().toISOString().slice(0, 10),
    "fechaNacimiento inválida o futura",
  );
  return value;
}

export function validTexts(value, field) {
  assert(
    Array.isArray(value) &&
      value.length <= 30 &&
      value.every(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0 &&
          item.length <= 100,
      ),
    `${field} debe ser un arreglo de hasta 30 textos de 1 a 100 caracteres`,
  );
  return value;
}

export function validBoolean(value, field) {
  assert(typeof value === "boolean", `${field} debe ser booleano`);
  return value;
}

export function pageParams(query) {
  const pagina = Number(query.pagina ?? 1);
  const limite = Number(query.limite ?? 20);
  if (
    !Number.isInteger(pagina) ||
    pagina < 1 ||
    !Number.isInteger(limite) ||
    limite < 1 ||
    limite > 100
  ) {
    throw new ApiError(
      400,
      "SOLICITUD_MALFORMADA",
      "pagina y limite inválidos (limite máximo 100)",
    );
  }
  return { pagina, limite, offset: (pagina - 1) * limite };
}

export async function transaction(pool, callback) {
  const client = await pool.connect();
  let conexionDanada;
  try {
    await client.query("BEGIN");
    const value = await callback(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    // Si el ROLLBACK también falla, su excepción no debe sustituir a la que
    // abortó la transacción: esa es la causa que hay que diagnosticar.
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      conexionDanada = rollbackError;
      console.error("Falló el ROLLBACK de la transacción", {
        errorOriginal: error,
        errorRollback: rollbackError,
      });
    }
    throw error;
  } finally {
    // Con un error, pg-pool descarta la conexión en vez de devolverla al pool:
    // tras un ROLLBACK fallido podría seguir dentro de la transacción abortada.
    client.release(conexionDanada);
  }
}

const ROLES = ["cuidador_principal", "cocuidador", "medico", "administrador"];

// Filtro opcional `?rol=` (enum Rol del contrato). Ausente es «sin filtro».
export function validRol(value) {
  if (value === undefined) return null;
  assert(ROLES.includes(value), "rol inválido");
  return value;
}

// Campos de RespuestaEntrada que admite cada tipo_respuesta de la pregunta.
const CAMPOS_RESPUESTA = {
  opcion: ["opcion"],
  zona_cuerpo: ["opcion"],
  texto: ["texto"],
  opcion_con_texto: ["opcion", "texto"],
  numero_u_opcion: ["numero", "opcion"],
};

// Valida RespuestaEntrada contra el tipo y las opciones de la pregunta y
// devuelve { opcion, texto, numero } con null en los campos que no aplican.
export function validRespuesta(tipo, opciones, body) {
  const permitidos = CAMPOS_RESPUESTA[tipo] ?? [];
  const keys = Object.keys(body);
  assert(
    keys.length > 0 && keys.every((key) => permitidos.includes(key)),
    `Esta pregunta se responde con: ${permitidos.join(" o ")}`,
  );
  // numero_u_opcion lleva uno u otro; opcion_con_texto exige la opción.
  if (tipo === "numero_u_opcion") assert(keys.length === 1, "Envía numero u opcion, no ambos");
  if (tipo === "opcion_con_texto") assert(Object.hasOwn(body, "opcion"), "Falta opcion");
  const valor = { opcion: null, texto: null, numero: null };
  if (Object.hasOwn(body, "opcion")) {
    assert(opciones.includes(body.opcion), "La opción no está en la lista de la pregunta");
    valor.opcion = body.opcion;
  }
  if (Object.hasOwn(body, "texto")) {
    assert(
      typeof body.texto === "string" &&
        body.texto.trim().length > 0 &&
        body.texto.length <= 2000,
      "texto debe tener entre 1 y 2000 caracteres",
    );
    valor.texto = body.texto.trim();
  }
  if (Object.hasOwn(body, "numero")) {
    assert(
      typeof body.numero === "number" &&
        Number.isFinite(body.numero) &&
        body.numero >= 30 &&
        body.numero <= 45,
      "numero debe estar entre 30 y 45",
    );
    valor.numero = body.numero;
  }
  return valor;
}

const DECISIONES = ["cuidado_en_casa", "consulta_presencial", "acudir_a_urgencias"];

// Valida IndicacionNueva y devuelve { texto, decision, plazoDias } listos para guardar.
export function validIndicacion(body) {
  const texto = typeof body.texto === "string" ? body.texto.trim() : "";
  assert(
    texto.length >= 1 && texto.length <= 4000,
    "texto debe tener entre 1 y 4000 caracteres",
  );
  const decision = body.decision ?? null;
  assert(decision === null || DECISIONES.includes(decision), "decision inválida");
  const plazoDias = body.plazoDias ?? null;
  assert(
    plazoDias === null || (Number.isInteger(plazoDias) && plazoDias >= 1 && plazoDias <= 90),
    "plazoDias debe ser un entero entre 1 y 90",
  );
  // La BD (ck_evento_plazo_consulta) exige el plazo con consulta presencial y solo con ella.
  assert(
    (decision === "consulta_presencial") === (plazoDias !== null),
    "plazoDias es obligatorio con consulta_presencial y solo aplica a ella",
  );
  return { texto, decision, plazoDias };
}
