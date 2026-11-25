import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { entrarComo, llenarLogin } from './entrarComo';

// Tarea F4: nueva conversación y borrador con id. Datos ficticios.
// Cada corrida deja borradores de Mateo (uno por proyecto); detalle-perfil.spec.ts
// busca su conversación del seed en la primera página (5), así que se corre tras `demo:reset`.

/** De /perfiles abre el perfil (Mateo por defecto) y su «Nueva conversación». */
async function nuevaParaMateo(page: Page, perfil = /^Mateo Ruán/) {
  await entrarComo(page, 'maria');
  await page.getByRole('button', { name: perfil }).click();
  await page.getByRole('button', { name: 'Nueva conversación' }).click();
  await expect(page).toHaveURL(/\/perfiles\/[^/]+\/conversaciones\/nueva$/);
}

test('María crea una conversación para Mateo y llega al borrador (paso 7)', async ({ page }, info) => {
  await nuevaParaMateo(page);
  const titulo = `Fiebre e2e ${info.project.name} ${Date.now()}`;
  await page.getByLabel('Título de la conversación').fill(titulo);
  await page.getByRole('checkbox', { name: 'Fiebre' }).click();
  await page.getByRole('radio', { name: /Laura Méndez Ortiz/ }).click();
  await page.getByRole('button', { name: 'Crear borrador' }).click();

  await expect(page).toHaveURL(/\/conversaciones\/[0-9a-f-]{36}\/borrador$/);
  await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
  await expect(page.getByText('Dra. Laura Méndez Ortiz')).toBeVisible();
  await expect(page.getByText('Mateo Ruán')).toBeVisible();
});

// F11. En Rosa y no en Mateo, para no empujar su conversación del seed a la página 2 (L-31).
test('un borrador con «Piel» muestra sus preguntas del SRS (RF-10)', async ({ page }, info) => {
  await nuevaParaMateo(page, /^Rosa Aguilar/);
  await page.getByLabel('Título de la conversación').fill(`Piel e2e ${info.project.name} ${Date.now()}`);
  await page.getByRole('checkbox', { name: 'Piel' }).click();
  await page.getByRole('radio', { name: /Laura Méndez Ortiz/ }).click();
  await page.getByRole('button', { name: 'Crear borrador' }).click();

  await expect(page).toHaveURL(/\/conversaciones\/[0-9a-f-]{36}\/borrador$/);
  for (const texto of ['¿En qué parte del cuerpo?', '¿Pica o duele?', '¿Ha crecido o se ha extendido?']) {
    await expect(page.getByRole('heading', { name: texto, level: 3 })).toBeVisible();
  }
  await expect(page.getByRole('radio', { name: 'Zona del pañal o genital' })).toBeVisible();
});

test('sin etiqueta muestra el error y no envía nada', async ({ page }) => {
  await nuevaParaMateo(page);
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/conversaciones$/.test(new URL(r.url()).pathname)) posts.push(r.url());
  });

  await page.getByLabel('Título de la conversación').fill('Conversación que no se crea');
  await page.getByRole('button', { name: 'Crear borrador' }).click();

  const error = page.getByRole('alert').filter({ hasText: 'Elija de 1 a 3 etiquetas.' });
  await expect(error).toBeVisible();
  await expect(error).toBeInViewport();
  await expect(page).toHaveURL(/\/conversaciones\/nueva$/);
  expect(posts).toEqual([]);
});

test('sin médicos en el círculo pide agregar uno primero', async ({ page }, info) => {
  const correo = `e2e.conversacion.${Date.now()}.${info.project.name}@correo.com`;
  const contrasena = 'ClaveFicticia2026';
  const registro = await page.request.post('/api/v1/auth/register', {
    data: {
      nombre: 'Persona Prueba E2E',
      correo,
      contrasena,
      nombreFamilia: 'Familia Prueba E2E',
      declaraciones: { mayorDeEdad: true, consentimientoDatosPropios: true, consentimientoDatosMenores: true },
      avisoVersion: 1,
    },
  });
  expect(registro.status()).toBe(201);
  const { familiaId } = await registro.json();
  const login = await page.request.post('/api/v1/auth/login', { data: { correo, contrasena } });
  const { accessToken } = await login.json();
  const creado = await page.request.post(`/api/v1/familias/${familiaId}/perfiles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { tipo: 'menor', nombre: 'Niña Prueba E2E', fechaNacimiento: '2021-03-14' },
  });
  expect(creado.status()).toBe(201);
  const { id } = await creado.json();

  await llenarLogin(page, correo, contrasena);
  await expect(page).toHaveURL(/\/perfiles$/);
  await page.goto(`/perfiles/${id}/conversaciones/nueva`);
  await expect(page.getByText('Agregue primero a un médico de su confianza')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Crear borrador' })).toHaveCount(0);
});
