import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page, TestInfo } from '@playwright/test';
import { CUENTAS, entrarComo } from './entrarComo';
import type { Cuenta } from './entrarComo';

// Tarea F6: lista e hilo de la cuidadora (paso 11 del guion). Datos ficticios.
// Las conversaciones van en el perfil «María Ruán», no en Mateo (L-31).
// La parte de la médica (paso 10) se hace por API hasta que exista su pantalla (F7).

const API = 'http://localhost:4000/api/v1';

async function token(request: APIRequestContext, cuenta: Cuenta) {
  const r = await request.post(`${API}/auth/login`, { data: CUENTAS[cuenta] });
  expect(r.status()).toBe(200);
  const cuerpo = await r.json();
  return { headers: { Authorization: `Bearer ${cuerpo.accessToken}` }, familiaId: cuerpo.usuario.familiaId as string };
}

/** Paso 10 por API: la médica abre la conversación (pasa a EN_REVISION) y, si hay texto, registra una indicación. */
async function abrirComoMedica(request: APIRequestContext, id: string, indicacion?: string) {
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
async function enviadaPorApi(request: APIRequestContext, titulo: string) {
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

const tituloUnico = (info: TestInfo, prefijo: string) => `${prefijo} ${info.project.name} ${Date.now()}`;

/** María crea y envía desde la interfaz; devuelve el id de la conversación. */
async function enviarDesdeLaInterfaz(page: Page, titulo: string) {
  await entrarComo(page, 'maria');
  await page.getByRole('button', { name: /^María Ruán/ }).click();
  await page.getByRole('button', { name: 'Nueva conversación' }).click();
  await page.getByLabel('Título de la conversación').fill(titulo);
  await page.getByRole('checkbox', { name: 'Fiebre' }).click();
  await page.getByRole('radio', { name: /Laura Méndez Ortiz/ }).click();
  await page.getByRole('button', { name: 'Crear borrador' }).click();
  await expect(page).toHaveURL(/\/conversaciones\/[0-9a-f-]{36}\/borrador$/);
  const id = page.url().split('/').at(-2)!;

  const f1 = page.getByRole('region', { name: /^Temperatura más alta/ });
  await f1.getByLabel('Temperatura (°C)').fill('38.5');
  await f1.getByRole('button', { name: 'Guardar' }).click();
  await expect(f1.getByText('Guardado')).toBeVisible();
  const f3 = page.getByRole('region', { name: /^¿Desde cuándo/ });
  await f3.getByLabel('Su respuesta').fill('Desde ayer en la tarde');
  await f3.getByRole('button', { name: 'Guardar' }).click();
  await expect(f3.getByText('Guardado')).toBeVisible();
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page).toHaveURL(/\/conversaciones$/);
  return id;
}

test('la cuidadora ve la indicación de la médica en el hilo y responde (paso 11)', async ({ page, request }, info) => {
  const titulo = tituloUnico(info, 'F6 hilo');
  const id = await enviarDesdeLaInterfaz(page, titulo);
  const indicacion = 'Dele paracetamol cada 8 horas y tráigala a consulta.';
  await abrirComoMedica(request, id, indicacion);

  await page.goto(`/conversaciones/${id}`);
  await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
  await expect(page.getByText('CON INDICACIONES', { exact: true })).toBeVisible();
  await expect(page.getByText(/Enviada a Dra\. Laura Méndez Ortiz/)).toBeVisible();
  await expect(page.getByText(/Dra\. Laura Méndez Ortiz abrió la conversación/)).toBeVisible();
  await expect(page.getByText(indicacion)).toBeVisible();
  await expect(page.getByText('Consulta presencial en 2 días')).toBeVisible();
  await expect(page.getByText('Vigente', { exact: true })).toBeVisible();

  const campo = page.getByLabel('Mensaje para el médico');
  const enviar = page.getByRole('button', { name: 'Enviar el mensaje' });
  await campo.fill('   ');
  await expect(enviar).toBeDisabled();
  const respuesta = `Gracias, doctora. Ya le di la primera dosis (${info.project.name}).`;
  await campo.fill(respuesta);
  await enviar.click();
  await expect(page.getByText(respuesta)).toBeVisible();
  await expect(campo).toHaveValue('');

  // Sigue ahí tras recargar: lo guardó el backend.
  await page.reload();
  await expect(page.getByText(respuesta)).toBeVisible();
});

// En «En revisión» sólo caen las de esta prueba (dos por proyecto): tras demo:reset caben en la página 1.
test('la lista pone primero la actividad más reciente y el filtro de estado la acota', async ({ page, request }, info) => {
  const vieja = tituloUnico(info, 'F6 vieja');
  const nueva = tituloUnico(info, 'F6 nueva');
  const idVieja = await enviadaPorApi(request, vieja);
  await abrirComoMedica(request, idVieja);
  const idNueva = await enviadaPorApi(request, nueva);
  await abrirComoMedica(request, idNueva);

  // La más vieja recibe la respuesta de María: debe quedar por encima de la nueva.
  await entrarComo(page, 'maria');
  await page.goto(`/conversaciones/${idVieja}`);
  await page.getByLabel('Mensaje para el médico').fill('Ya bajó la fiebre.');
  await page.getByRole('button', { name: 'Enviar el mensaje' }).click();
  await expect(page.getByText('Ya bajó la fiebre.')).toBeVisible();

  await page.goto('/conversaciones');
  const filtro = page.getByRole('radio', { name: 'En revisión' });
  await filtro.click();
  await expect(filtro).toHaveAttribute('aria-checked', 'true');
  // Hasta que llegue la lista filtrada sigue a la vista la de «Todas»: se espera a que
  // sólo haya tarjetas «En revisión» y la vieja vaya antes que la nueva.
  await expect.poll(async () => {
    const tarjetas = await page.getByRole('main').getByRole('button').allTextContents();
    if (tarjetas.some((t) => /BORRADOR|ENVIADA|CON INDICACIONES|CERRADA/.test(t))) return 'hay otros estados';
    return tarjetas.filter((t) => t.includes(vieja) || t.includes(nueva)).map((t) => (t.includes(vieja) ? 'vieja' : 'nueva'));
  }).toEqual(['vieja', 'nueva']);

  await page.getByRole('radio', { name: 'Enviada' }).click();
  await expect(page.getByRole('radio', { name: 'Enviada' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('main').getByText('EN REVISIÓN', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: new RegExp(vieja) })).toHaveCount(0);
});

test('un id inventado muestra «Conversación no encontrada»', async ({ page }) => {
  await entrarComo(page, 'maria');
  await page.goto(`/conversaciones/${randomUUID()}`);
  await expect(page.getByText('Conversación no encontrada')).toBeVisible();
  await page.getByRole('button', { name: 'Ver conversaciones' }).click();
  await expect(page).toHaveURL(/\/conversaciones$/);
});
