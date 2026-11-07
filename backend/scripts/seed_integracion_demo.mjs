/**
 * Datos de demostración para la integración frontend-backend (S07-S08-A2).
 *
 * SOLO AMBIENTE LOCAL. Crea una familia ficticia con su cuidadora principal y
 * tres perfiles de paciente, usando la propia API: así los datos quedan sujetos
 * a las mismas validaciones y reglas de negocio que cualquier petición real,
 * en vez de insertarse por detrás saltándose el contrato.
 *
 *   node scripts/seed_integracion_demo.mjs
 *
 * Es idempotente: si la cuenta ya existe, se limita a iniciar sesión y a crear
 * los perfiles que falten.
 */
import 'dotenv/config';

if (process.env.NODE_ENV === 'production') {
  throw new Error('No ejecutar seed_integracion_demo.mjs en producción');
}

const API = process.env.API_URL ?? `http://localhost:${process.env.PORT || 4000}/api/v1`;

const CUENTA = {
  nombre: 'María Ruán Aguilar',
  correo: 'maria.ruan@correo.com',
  contrasena: 'DafiDemo2026!',
  nombreFamilia: 'Familia Ruán',
  avisoVersion: 1,
  declaraciones: {
    mayorDeEdad: true,
    consentimientoDatosPropios: true,
    consentimientoDatosMenores: true,
  },
};

const PERFILES = [
  { tipo: 'menor', nombre: 'Mateo Ruán', fechaNacimiento: '2021-03-14',
    alergias: ['Penicilina'], medicamentos: ['Salbutamol'] },
  { tipo: 'propio', nombre: 'María Ruán', fechaNacimiento: '1988-01-23',
    alergias: [], medicamentos: [], compartirConCocuidador: true },
  { tipo: 'adulto_representado', nombre: 'Rosa Aguilar', fechaNacimiento: '1955-06-02',
    correo: 'rosa.aguilar@correo.com', alergias: ['Sulfas'], medicamentos: ['Metformina'] },
];

async function pedir(ruta, { method = 'GET', body, token } = {}) {
  const cabeceras = { Accept: 'application/json' };
  if (body) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  const r = await fetch(API + ruta, {
    method,
    headers: cabeceras,
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await r.text();
  const datos = texto ? JSON.parse(texto) : null;
  if (!r.ok) {
    const e = new Error(datos?.mensaje ?? r.statusText);
    e.codigo = datos?.codigo;
    e.status = r.status;
    throw e;
  }
  return datos;
}

try {
  await pedir('/salud');
} catch {
  console.error(`No hay API escuchando en ${API}. Arranca el backend con "npm run dev".`);
  process.exit(1);
}

// 1. Cuenta de la cuidadora principal (crea también su familia).
try {
  await pedir('/auth/register', { method: 'POST', body: CUENTA });
  console.log('Cuenta creada:', CUENTA.correo);
} catch (e) {
  if (e.codigo === 'CORREO_REGISTRADO') console.log('La cuenta ya existía:', CUENTA.correo);
  else throw e;
}

const sesion = await pedir('/auth/login', {
  method: 'POST',
  body: { correo: CUENTA.correo, contrasena: CUENTA.contrasena },
});
const { accessToken: token, usuario } = sesion;
console.log(`Sesión iniciada como ${usuario.rol}, familia ${usuario.familiaId}`);

// 2. Perfiles de paciente, sin duplicar los que ya estén.
const existentes = await pedir(`/familias/${usuario.familiaId}/perfiles`, { token });
const nombres = new Set(existentes.map((p) => p.nombre));

for (const perfil of PERFILES) {
  if (nombres.has(perfil.nombre)) {
    console.log('Ya existía el perfil:', perfil.nombre);
    continue;
  }
  const creado = await pedir(`/familias/${usuario.familiaId}/perfiles`, {
    method: 'POST', token, body: perfil,
  });
  console.log(`Perfil creado: ${creado.nombre} (${creado.tipo}, ${creado.edadAnios} años)`);
}

const total = await pedir(`/familias/${usuario.familiaId}/perfiles`, { token });
console.log(`\nListo. La familia tiene ${total.length} perfiles.`);
console.log(`Credenciales de prueba: ${CUENTA.correo} / ${CUENTA.contrasena}`);
