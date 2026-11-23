import { expect, test } from '@playwright/test';
import { entrarComo, llenarLogin } from './entrarComo';

// Pasos 1 y 2 del guion (docs/demo-final/PLAN.md, sección 3).

test('contraseña mala muestra el 401 y se queda en /entrar', async ({ page }) => {
  await llenarLogin(page, 'maria.ruan@correo.com', 'NoEsLaClave123');
  await expect(
    page.getByRole('alert').filter({ hasText: 'El correo o la contraseña no son correctos' })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/entrar$/);
});

test('María entra y ve sus 3 perfiles', async ({ page }) => {
  await entrarComo(page, 'maria');
  await expect(page).toHaveURL(/\/perfiles$/);
  await expect(page.getByText('3 perfiles')).toBeVisible();
  for (const nombre of ['Mateo Ruán', 'María Ruán', 'Rosa Aguilar']) {
    // La tarjeta es un botón cuyo nombre empieza por el del perfil.
    await expect(page.getByRole('button', { name: new RegExp(`^${nombre}`) })).toBeVisible();
  }
});
