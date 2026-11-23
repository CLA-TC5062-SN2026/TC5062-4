import type { Page } from '@playwright/test';

// Cuentas ficticias del seed de demo (backend/scripts/demo_seed.mjs), solo locales.
const CUENTAS = {
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
