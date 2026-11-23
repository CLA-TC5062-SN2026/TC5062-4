import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Tarea F1: registro conectado a POST /auth/register. Datos ficticios.

const DECLARACIONES = [
  'Soy mayor de edad',
  'Consiento el tratamiento de mis datos de salud',
  'Consiento el tratamiento de los datos de los menores a mi cargo',
  'He leído el aviso de privacidad',
];

async function llenarRegistro(page: Page, correo: string) {
  await page.goto('/crear-cuenta');
  await page.getByLabel('Nombre completo').fill('Persona Prueba E2E');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill('ClaveFicticia2026');
  await page.getByLabel('Nombre de la familia').fill('Familia Prueba E2E');
  for (const d of DECLARACIONES) await page.getByLabel(d).check();
}

test('registro nuevo abre sesión y llega a /perfiles vacío', async ({ page }, info) => {
  // Correo único por corrida y por proyecto: escritorio y móvil no chocan.
  const correo = `e2e.${Date.now()}.${info.project.name}@correo.com`;
  await llenarRegistro(page, correo);
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(page).toHaveURL(/\/perfiles$/);
  await expect(page.getByText('Todavía no hay perfiles')).toBeVisible();
});

test('correo ya registrado muestra el 409 y se queda en la pantalla', async ({ page }) => {
  await llenarRegistro(page, 'maria.ruan@correo.com');
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Ya existe una cuenta con este correo.' })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/crear-cuenta$/);
});

test('el botón no se habilita hasta marcar todas las declaraciones', async ({ page }) => {
  await page.goto('/crear-cuenta');
  const boton = page.getByRole('button', { name: 'Crear cuenta', exact: true });
  await expect(boton).toBeDisabled();
  for (const d of DECLARACIONES.slice(0, -1)) {
    await page.getByLabel(d).check();
    await expect(boton).toBeDisabled();
  }
  await page.getByLabel(DECLARACIONES.at(-1)!).check();
  await expect(boton).toBeEnabled();
});
