export class ApiError extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

export const invalid = (mensaje) => new ApiError(422, 'DATOS_INVALIDOS', mensaje);
export const missing = (mensaje = 'Recurso no encontrado') => new ApiError(404, 'NO_ENCONTRADO', mensaje);
export const conflict = (mensaje) => new ApiError(409, 'TRANSICION_INVALIDA', mensaje);

export const isUuid = (id) => typeof id === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export function uuidOr404(id) {
  if (!isUuid(id)) throw missing();
  return id;
}

export function requireObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid('El cuerpo debe ser un objeto JSON');
  }
  return value;
}

export function assert(condition, mensaje) {
  if (!condition) throw invalid(mensaje);
}

export function validName(value, field = 'nombre') {
  assert(typeof value === 'string' && value.trim().length > 0 && value.length <= 80,
    `${field} debe tener entre 1 y 80 caracteres`);
  return value.trim();
}

export function validDate(value) {
  assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value),
    'fechaNacimiento debe tener formato AAAA-MM-DD');
  const date = new Date(`${value}T00:00:00Z`);
  assert(!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value &&
    value >= '1900-01-01' && value <= new Date().toISOString().slice(0, 10),
  'fechaNacimiento inválida o futura');
  return value;
}

export function validTexts(value, field) {
  assert(Array.isArray(value) && value.length <= 30 &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 100),
  `${field} debe ser un arreglo de hasta 30 textos de 1 a 100 caracteres`);
  return value;
}

export function validBoolean(value, field) {
  assert(typeof value === 'boolean', `${field} debe ser booleano`);
  return value;
}

export function pageParams(query) {
  const pagina = Number(query.pagina ?? 1);
  const limite = Number(query.limite ?? 20);
  if (!Number.isInteger(pagina) || pagina < 1 || !Number.isInteger(limite) || limite < 1 || limite > 100) {
    throw new ApiError(400, 'SOLICITUD_MALFORMADA', 'pagina y limite inválidos (limite máximo 100)');
  }
  return { pagina, limite, offset: (pagina - 1) * limite };
}

export async function transaction(pool, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const value = await callback(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}