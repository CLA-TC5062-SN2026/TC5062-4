import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import { abrirComoMedica, enviadaPorApi, entrarComo } from './entrarComo';

// Tarea F7: bandeja, detalle e indicaciones de la médica (pasos 9 y 10 del guion).
// María prepara la conversación por API en el perfil «María Ruán», no en Mateo (L-31).

const tituloUnico = (info: TestInfo, prefijo: string) => `${prefijo} ${info.project.name} ${Date.now()}`;

test('la médica ve la enviada, la abre y registra una indicación (pasos 9 y 10)', async ({ page, request }, info) => {
  const titulo = tituloUnico(info, 'F7 médica');
  const id = await enviadaPorApi(request, titulo);

  await entrarComo(page, 'medica');
  await expect(page).toHaveURL(/\/medico\/bandeja$/);
  const tarjeta = page.getByRole('region', { name: 'Enviadas' }).getByRole('button', { name: new RegExp(titulo) });
  await expect(tarjeta).toBeVisible();
  await tarjeta.click();
  await expect(page).toHaveURL(new RegExp(`/medico/conversaciones/${id}$`));

  // El mismo GET que muestra el detalle la pasa a revisión y deja la línea en el hilo.
  await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
  await expect(page.getByText('EN REVISIÓN', { exact: true })).toBeVisible();
  await expect(page.getByText('Dra. Laura Méndez Ortiz abrió la conversación', { exact: false })).toBeVisible();
  await expect(page.getByText(/^María Ruán · \d+ años$/)).toBeVisible();

  const indicacion = `Paracetamol cada 8 horas y consulta (${info.project.name}).`;
  await page.getByRole('button', { name: 'Registrar indicación' }).click();
  await page.getByLabel('Indicación para la familia').fill(indicacion);
  await page.getByRole('radio', { name: 'Consulta presencial' }).click();
  await page.getByLabel('Días para la consulta').fill('2');
  await page.getByRole('button', { name: 'Registrar indicación' }).click();

  await expect(page.getByText('CON INDICACIONES', { exact: true })).toBeVisible();
  await expect(page.getByText(indicacion)).toBeVisible();
  await expect(page.getByText('Consulta presencial en 2 días')).toBeVisible();
  await expect(page.getByText('Vigente', { exact: true })).toBeVisible();
  await expect(page.getByText('Indicación registrada.')).toBeVisible();

  await page.goto('/medico/bandeja');
  await expect(
    page.getByRole('region', { name: 'Con indicaciones' }).getByRole('button', { name: new RegExp(titulo) })
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Enviadas' }).getByRole('button', { name: new RegExp(titulo) })).toHaveCount(0);
});

test('consulta presencial sin días muestra el error y no llama a /indicaciones; una segunda sustituye a la primera', async ({ page, request }, info) => {
  // Ya con una indicación por API: así nunca queda «En revisión» (hilo-cuidadora cuenta esas).
  const id = await enviadaPorApi(request, tituloUnico(info, 'F7 validación'));
  await abrirComoMedica(request, id, 'Primera indicación por API.');

  let posts = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith('/indicaciones')) posts += 1;
  });

  await entrarComo(page, 'medica');
  await page.goto(`/medico/conversaciones/${id}`);
  await expect(page.getByText('Primera indicación por API.')).toBeVisible();
  await page.getByRole('button', { name: 'Registrar indicación' }).click();
  await page.getByLabel('Indicación para la familia').fill('Venga a consulta.');
  await page.getByRole('radio', { name: 'Consulta presencial' }).click();
  await page.getByRole('button', { name: 'Registrar indicación' }).click();
  await expect(page.getByText('Indique en cuántos días debe ser la consulta.')).toBeVisible();
  expect(posts).toBe(0);

  // Cambiar a otra decisión quita el campo de días; la nueva sustituye a la de la API.
  await page.getByRole('radio', { name: 'Cuidado en casa' }).click();
  await expect(page.getByLabel('Días para la consulta')).toHaveCount(0);
  await page.getByRole('button', { name: 'Registrar indicación' }).click();
  await expect(page.getByText('Indicación registrada.')).toBeVisible();
  await expect(page.getByText('Cuidado en casa', { exact: true })).toBeVisible();
  await expect(page.getByText('Sustituida', { exact: true })).toBeVisible();
  await expect(page.getByText('Vigente', { exact: true })).toHaveCount(1);
  expect(posts).toBe(1);
});

test('la médica con un id inventado ve «Conversación no encontrada»', async ({ page }) => {
  await entrarComo(page, 'medica');
  await page.goto(`/medico/conversaciones/${randomUUID()}`);
  await expect(page.getByText('Conversación no encontrada')).toBeVisible();
  await page.getByRole('button', { name: 'Ir a la bandeja' }).click();
  await expect(page).toHaveURL(/\/medico\/bandeja$/);
});
