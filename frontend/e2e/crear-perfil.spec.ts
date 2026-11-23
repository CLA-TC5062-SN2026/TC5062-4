import { expect, test } from '@playwright/test';
import { entrarComo, llenarLogin } from './entrarComo';

// Tarea F2: crear perfil conectado a POST /familias/{id}/perfiles. Datos ficticios.

test('crear un perfil y verlo en la lista (pasos 3 y 4 del guion)', async ({ page }, info) => {
  // Cuenta desechable y no María: login.spec.ts cuenta exactamente 3 perfiles
  // de María y las pruebas corren en paralelo contra la misma base de demo.
  const correo = `e2e.perfil.${Date.now()}.${info.project.name}@correo.com`;
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
  await llenarLogin(page, correo, contrasena);
  await expect(page).toHaveURL(/\/perfiles$/);

  const nombre = `Niño Prueba ${info.project.name} ${Date.now()}`;
  await page.getByRole('button', { name: 'Agregar un perfil' }).first().click();
  await expect(page).toHaveURL(/\/perfiles\/nuevo$/);
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Fecha de nacimiento').fill('2021-03-14');
  await page.getByLabel('Alergias').fill('penicilina, polen');
  await page.getByRole('button', { name: 'Guardar perfil' }).click();

  await expect(page).toHaveURL(/\/perfiles$/);
  await expect(page.getByRole('button', { name: new RegExp(`^${nombre}`) })).toBeVisible();
  await expect(page.getByText('1 perfil', { exact: true })).toBeVisible();
});

test('fecha futura muestra el error sin llegar al backend', async ({ page }) => {
  await entrarComo(page, 'maria');
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/perfiles$/.test(new URL(r.url()).pathname)) posts.push(r.url());
  });

  await page.goto('/perfiles/nuevo');
  await page.getByLabel('Nombre').fill('Perfil Que No Se Crea');
  await page.getByLabel('Fecha de nacimiento').fill('2099-01-01');
  await page.getByRole('button', { name: 'Guardar perfil' }).click();

  const error = page.getByRole('alert').filter({ hasText: 'La fecha de nacimiento no puede ser futura.' });
  await expect(error).toBeVisible();
  await expect(error).toBeInViewport();
  await expect(page).toHaveURL(/\/perfiles\/nuevo$/);
  expect(posts).toEqual([]);
});
