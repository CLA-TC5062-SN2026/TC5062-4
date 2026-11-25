import { expect, test } from '@playwright/test';
import { entrarComo } from './entrarComo';

// Tarea F10: pantalla informativa «Documentos». Sólo navega; no crea datos.
test('el botón Docs abre «Documentos · Próximamente» y se vuelve al perfil', async ({ page }) => {
  await entrarComo(page, 'maria');
  await page.getByRole('button', { name: /^Mateo Ruán/ }).click();
  await expect(page).toHaveURL(/\/perfiles\/[^/]+$/);
  const perfil = page.url();

  await page.getByRole('button', { name: 'Docs (recetas, análisis…)' }).click();
  await expect(page).toHaveURL(/\/documentos$/);
  await expect(page.getByRole('heading', { name: 'Documentos', level: 1 })).toBeVisible();
  await expect(page.getByText('Próximamente')).toBeVisible();
  await expect(page.getByText(/no guarda ningún archivo/)).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Volver al perfil' }).click();
  await expect(page).toHaveURL(perfil);
  await expect(page.getByRole('heading', { name: /^Mateo Ruán/, level: 1 })).toBeVisible();
});
