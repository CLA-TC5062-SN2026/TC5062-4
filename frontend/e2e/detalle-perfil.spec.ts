import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { entrarComo, llenarLogin } from './entrarComo';

// Tarea F3: detalle de perfil con editar y borrar. Datos ficticios.
// Las mutaciones van en una cuenta desechable: login.spec.ts cuenta exactamente
// 3 perfiles de María y las pruebas corren en paralelo contra la misma base.

async function cuentaConPerfil(page: Page, info: TestInfo) {
  const sello = `${Date.now()}.${info.project.name}.${info.title.length}`;
  const correo = `e2e.detalle.${sello}@correo.com`;
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
  const nombre = `Niña Prueba ${sello}`;
  const creado = await page.request.post(`/api/v1/familias/${familiaId}/perfiles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { tipo: 'menor', nombre, fechaNacimiento: '2021-03-14', alergias: ['penicilina'] },
  });
  expect(creado.status()).toBe(201);
  const { id } = await creado.json();

  await llenarLogin(page, correo, contrasena);
  await expect(page).toHaveURL(/\/perfiles$/);
  await page.goto(`/perfiles/${id}`);
  await expect(page.getByText('Sin conversaciones todavía')).toBeVisible();
  return nombre;
}

test('editar un perfil y ver el cambio tras recargar', async ({ page }, info) => {
  await cuentaConPerfil(page, info);
  const nuevo = `Renombrada ${info.project.name} ${Date.now()}`;
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await page.getByLabel('Nombre').fill(nuevo);
  await page.getByLabel('Alergias').fill('penicilina, látex');
  await page.getByLabel('Medicamentos de uso continuo').fill('salbutamol');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('button', { name: 'Editar perfil', exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: nuevo, level: 1 })).toBeVisible();
  await expect(page.getByText('penicilina, látex')).toBeVisible();
  await expect(page.getByText('salbutamol')).toBeVisible();
});

test('cancelar el borrado no borra', async ({ page }, info) => {
  const nombre = await cuentaConPerfil(page, info);
  await page.getByRole('button', { name: 'Borrar perfil' }).click();
  await expect(page.getByText(/No se borran su cuenta/)).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();

  await page.goto('/perfiles');
  await expect(page.getByRole('button', { name: new RegExp(`^${nombre}`) })).toBeVisible();
});

test('borrar y confirmar lo quita de la lista', async ({ page }, info) => {
  const nombre = await cuentaConPerfil(page, info);
  await page.getByRole('button', { name: 'Borrar perfil' }).click();
  await page.getByRole('button', { name: 'Sí, borrar el perfil' }).click();

  await expect(page).toHaveURL(/\/perfiles$/);
  await expect(page.getByText('Todavía no hay perfiles')).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(`^${nombre}`) })).toHaveCount(0);
});

test('un id inventado o mal formado muestra «Perfil no encontrado»', async ({ page }) => {
  await entrarComo(page, 'maria');
  for (const id of ['3f1c2b9a-7d4e-4c1a-9b2e-5a6d7c8e9f01', 'no-es-un-uuid']) {
    await page.goto(`/perfiles/${id}`);
    await expect(page.getByText('Perfil no encontrado')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Volver a perfiles' }).click();
  await expect(page).toHaveURL(/\/perfiles$/);
});

test('el historial de Mateo muestra la conversación del seed (sólo lectura)', async ({ page }) => {
  await entrarComo(page, 'maria');
  await page.getByRole('button', { name: /^Mateo Ruán/ }).click();
  await expect(page.getByText('Fiebre desde anoche')).toBeVisible();
});
