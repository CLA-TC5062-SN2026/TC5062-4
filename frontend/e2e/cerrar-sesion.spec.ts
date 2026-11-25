import { expect, test } from '@playwright/test';
import { entrarComo } from './entrarComo';
import type { Cuenta } from './entrarComo';

// F8: «Cerrar sesión» está en la pestaña Cuenta de cada rol.
const CASOS: { cuenta: Cuenta; cuentaUrl: string; protegida: string }[] = [
  { cuenta: 'maria', cuentaUrl: '/cuenta', protegida: '/perfiles' },
  { cuenta: 'medica', cuentaUrl: '/medico/cuenta', protegida: '/medico/bandeja' },
];

for (const { cuenta, cuentaUrl, protegida } of CASOS) {
  test(`${cuenta} cierra sesión y ${protegida} vuelve a pedir login`, async ({ page }) => {
    await entrarComo(page, cuenta);
    await page.getByRole('link', { name: 'Cuenta', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${cuentaUrl}$`));

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/entrar$/);

    await page.goto(protegida);
    await expect(page).toHaveURL(/\/entrar$/);
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  });
}
