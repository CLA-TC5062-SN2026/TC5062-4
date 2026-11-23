import type { Page } from '@playwright/test';

// Cuentas ficticias, solo locales.
const CUENTAS = {
  maria: { correo: 'maria.ruan@correo.com', contrasena: 'DafiDemo2026!' },
  // La médica llega con el seed de demo (B5); hasta entonces se pasa por entorno.
  medica: {
    correo: process.env.E2E_MEDICA_CORREO,
    contrasena: process.env.E2E_MEDICA_CONTRASENA,
  },
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
  if (!correo || !contrasena) {
    throw new Error(
      `Falta la cuenta "${cuenta}": pendiente de B5 (seed de la médica). ` +
        'Defina E2E_MEDICA_CORREO y E2E_MEDICA_CONTRASENA.'
    );
  }
  await llenarLogin(page, correo, contrasena);
  await page.waitForURL((url) => url.pathname !== '/entrar');
}
