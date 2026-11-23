import { defineConfig, devices } from '@playwright/test';

// Precondición: el stack ya está corriendo (frontend :3000, backend :4000,
// PostgreSQL) y los datos de demo están cargados con `demo:reset` (mientras no
// exista, tarea B5: `node scripts/seed_integracion_demo.mjs` desde `backend/`).
// Por eso no hay `webServer`: Playwright no arranca ni detiene nada.
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    {
      // Chromium a 375 × 812 para no descargar WebKit.
      name: 'movil',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
