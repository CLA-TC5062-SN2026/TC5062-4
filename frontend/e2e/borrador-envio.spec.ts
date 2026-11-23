import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { entrarComo } from './entrarComo';

// Tarea F5: preguntas de contexto del borrador y envío. Datos ficticios.
// Las conversaciones van en el perfil «María Ruán», no en Mateo: detalle-perfil.spec.ts
// necesita la conversación del seed de Mateo en su primera página de 5 (L-31).

/** Crea un borrador con «Fiebre» y la médica, y deja la página en él. */
async function borradorNuevo(page: Page, info: TestInfo) {
  await entrarComo(page, 'maria');
  await page.getByRole('button', { name: /^María Ruán/ }).click();
  await page.getByRole('button', { name: 'Nueva conversación' }).click();
  const titulo = `F5 e2e ${info.project.name} ${info.title.length} ${Date.now()}`;
  await page.getByLabel('Título de la conversación').fill(titulo);
  await page.getByRole('checkbox', { name: 'Fiebre' }).click();
  await page.getByRole('radio', { name: /Laura Méndez Ortiz/ }).click();
  await page.getByRole('button', { name: 'Crear borrador' }).click();
  await expect(page).toHaveURL(/\/conversaciones\/[0-9a-f-]{36}\/borrador$/);
  await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
  return titulo;
}

const pregunta = (page: Page, inicio: string) => page.getByRole('region', { name: new RegExp(`^${inicio}`) });

test('responder lo obligatorio habilita «Enviar» y la conversación queda «Enviada» (paso 8)', async ({ page }, info) => {
  const titulo = await borradorNuevo(page, info);
  const enviar = page.getByRole('button', { name: 'Enviar', exact: true });
  await expect(enviar).toBeDisabled();
  await expect(page.getByText(/^Faltan 2 respuestas obligatorias/)).toBeVisible();

  const f1 = pregunta(page, 'Temperatura más alta');
  await f1.getByLabel('Temperatura (°C)').fill('38.5');
  await f1.getByRole('button', { name: 'Guardar' }).click();
  await expect(f1.getByText('Guardado')).toBeVisible();
  await expect(page.getByText(/^Falta 1 respuesta obligatoria: ¿Desde cuándo/)).toBeVisible();
  await expect(enviar).toBeDisabled();

  const f3 = pregunta(page, '¿Desde cuándo');
  await f3.getByLabel('Su respuesta').fill('Desde ayer en la tarde');
  await f3.getByRole('button', { name: 'Guardar' }).click();
  await expect(f3.getByText('Guardado')).toBeVisible();

  await expect(enviar).toBeEnabled();
  await enviar.click();
  await expect(page).toHaveURL(/\/conversaciones$/);
  // Con 5 por página y pruebas en paralelo puede no estar en la página 1 de «Todas»;
  // en «Enviada» es la de actividad más reciente.
  await page.getByRole('radio', { name: 'Enviada' }).click();
  const tarjeta = page.getByRole('button', { name: new RegExp(titulo) });
  await expect(tarjeta).toBeVisible();
  await expect(tarjeta.getByText('ENVIADA', { exact: true })).toBeVisible();
});

test('una temperatura fuera de rango muestra el error y no llama al backend', async ({ page }, info) => {
  await borradorNuevo(page, info);
  const puts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'PUT') puts.push(r.url());
  });

  const f1 = pregunta(page, 'Temperatura más alta');
  await f1.getByLabel('Temperatura (°C)').fill('50');
  await f1.getByRole('button', { name: 'Guardar' }).click();

  const error = f1.getByRole('alert').filter({ hasText: 'Escriba un valor entre 30 y 45 °C.' });
  await expect(error).toBeVisible();
  await expect(error).toBeInViewport();
  expect(puts).toEqual([]);
  await expect(page.getByRole('button', { name: 'Enviar', exact: true })).toBeDisabled();
});

test('las respuestas guardadas siguen ahí tras recargar', async ({ page }, info) => {
  await borradorNuevo(page, info);
  const f1 = pregunta(page, 'Temperatura más alta');
  await f1.getByLabel('Temperatura (°C)').fill('38.6');
  await f1.getByRole('button', { name: 'Guardar' }).click();
  await expect(f1.getByText('Guardado')).toBeVisible();

  const f2 = pregunta(page, '¿Dónde la midió?');
  await f2.getByRole('radio', { name: 'Axila' }).click();
  await expect(f2.getByText('Guardado')).toBeVisible();

  const f3 = pregunta(page, '¿Desde cuándo');
  await f3.getByLabel('Su respuesta').fill('Desde el domingo');
  await f3.getByRole('button', { name: 'Guardar' }).click();
  await expect(f3.getByText('Guardado')).toBeVisible();

  await page.reload();
  // El GET devuelve el número como texto ("38.6"); el campo lo muestra igual.
  await expect(pregunta(page, 'Temperatura más alta').getByLabel('Temperatura (°C)')).toHaveValue('38.6');
  await expect(pregunta(page, '¿Dónde la midió?').getByRole('radio', { name: 'Axila' })).toHaveAttribute('aria-checked', 'true');
  await expect(pregunta(page, '¿Desde cuándo').getByLabel('Su respuesta')).toHaveValue('Desde el domingo');
  await expect(page.getByRole('button', { name: 'Enviar', exact: true })).toBeEnabled();
});
