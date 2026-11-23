import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

// Cuentas ficticias del seed de demo (backend/scripts/demo_seed.mjs), solo locales.
export const CUENTAS = {
  maria: { correo: 'maria.ruan@correo.com', contrasena: 'DafiDemo2026!' },
  medica: { correo: 'laura.mendez@correo.com', contrasena: 'DafiDemo2026!' },
} as const;

export type Cuenta = keyof typeof CUENTAS;

export async function llenarLogin(page: Page, correo: string, contrasena: string) {
  await page.goto('/entrar');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(contrasena);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

/** Entra con una cuenta del seed y espera a salir de /entrar. */
export async function entrarComo(page: Page, cuenta: Cuenta) {
  const { correo, contrasena } = CUENTAS[cuenta];
  await llenarLogin(page, correo, contrasena);
  await page.waitForURL((url) => url.pathname !== '/entrar');
}

// Atajos por API para preparar datos (pasos 7, 8 y 10 del guion).
const API = 'http://localhost:4000/api/v1';

export async function token(request: APIRequestContext, cuenta: Cuenta) {
  const r = await request.post(`${API}/auth/login`, { data: CUENTAS[cuenta] });
  expect(r.status()).toBe(200);
  const cuerpo = await r.json();
  return { headers: { Authorization: `Bearer ${cuerpo.accessToken}` }, familiaId: cuerpo.usuario.familiaId as string };
}

/** Paso 10 por API: la médica abre la conversación (pasa a EN_REVISION) y, si hay texto, registra una indicación. */
export async function abrirComoMedica(request: APIRequestContext, id: string, indicacion?: string) {
  const { headers } = await token(request, 'medica');
  const lectura = await request.get(`${API}/conversaciones/${id}`, { headers });
  expect((await lectura.json()).estado).toBe('EN_REVISION');
  if (!indicacion) return;
  const r = await request.post(`${API}/conversaciones/${id}/indicaciones`, {
    headers: { ...headers, 'Idempotency-Key': randomUUID() },
    data: { texto: indicacion, decision: 'consulta_presencial', plazoDias: 2 },
  });
  expect(r.status()).toBe(201);
}

/** Pasos 7 y 8 por API: conversación de fiebre enviada en el perfil «María Ruán». */
export async function enviadaPorApi(request: APIRequestContext, titulo: string) {
  const { headers, familiaId } = await token(request, 'maria');
  const perfiles = await (await request.get(`${API}/familias/${familiaId}/perfiles`, { headers })).json();
  const perfil = perfiles.find((p: { nombre: string }) => p.nombre === 'María Ruán');
  const medicos = await (await request.get(`${API}/familias/${familiaId}/miembros?rol=medico`, { headers })).json();
  const conv = await request.post(`${API}/perfiles/${perfil.id}/conversaciones`, {
    headers, data: { titulo, etiquetas: ['fiebre'], medicoId: medicos[0].usuarioId },
  });
  expect(conv.status()).toBe(201);
  const { id } = await conv.json();
  for (const [pregunta, valor] of [['F1', { numero: 38.4 }], ['F3', { texto: 'Desde la mañana' }]] as const) {
    expect((await request.put(`${API}/conversaciones/${id}/preguntas/${pregunta}/respuesta`, { headers, data: valor })).ok()).toBe(true);
  }
  const envio = await request.post(`${API}/conversaciones/${id}/envios`, {
    headers: { ...headers, 'Idempotency-Key': randomUUID() }, data: {},
  });
  expect(envio.status()).toBe(200);
  return id as string;
}
