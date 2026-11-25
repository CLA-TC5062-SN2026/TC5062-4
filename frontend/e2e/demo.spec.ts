import { expect, test } from '@playwright/test';
import { CUENTAS, entrarComo, llenarLogin } from './entrarComo';

// Tarea Q4: el guion completo de la demo (docs/demo-final/PLAN.md, sección 3), pasos 1 a 11,
// con dos ventanas: María (cuidadora) y la Dra. Laura Méndez. Datos ficticios.
// Los dos proyectos corren en paralelo sobre la misma base: todo se localiza por un
// texto único por proyecto, nunca por posición (L-31, L-34).
// Cada corrida deja una conversación en Mateo; correr `demo:reset` antes de la suite (L-31).

test('guion de la demo, pasos 1 a 11', async ({ browser }, info) => {
  test.setTimeout(180_000);
  const sello = `${info.project.name} ${Date.now()}`;
  const nombrePerfil = `Perfil Demo ${sello}`;
  const titulo = `Demo fiebre ${sello}`;
  const indicacion = `Paracetamol cada 8 horas y consulta (${sello}).`;
  const respuesta = `Gracias, doctora. Ya le di la primera dosis (${sello}).`;

  const ventanaMaria = await browser.newContext();
  const ventanaMedica = await browser.newContext();
  const maria = await ventanaMaria.newPage();
  const medica = await ventanaMedica.newPage();
  const tarjetaPerfil = (nombre: string) => maria.getByRole('button', { name: new RegExp(`^${nombre}`) });
  let id = '';

  await test.step('1. María escribe mal la contraseña, ve el 401 y luego entra', async () => {
    await llenarLogin(maria, CUENTAS.maria.correo, 'NoEsLaClave123');
    await expect(
      maria.getByRole('alert').filter({ hasText: 'El correo o la contraseña no son correctos' })
    ).toBeVisible();
    await expect(maria).toHaveURL(/\/entrar$/);
    await entrarComo(maria, 'maria');
  });

  await test.step('2. Ve sus 3 perfiles', async () => {
    await expect(maria).toHaveURL(/\/perfiles$/);
    // Sin contar «3 perfiles»: el otro proyecto puede tener un perfil temporal a la vez (pasos 3 a 6).
    for (const nombre of ['Mateo Ruán', 'María Ruán', 'Rosa Aguilar']) {
      await expect(tarjetaPerfil(nombre)).toBeVisible();
    }
  });

  await test.step('3. Crea un perfil nuevo', async () => {
    await maria.getByRole('button', { name: 'Agregar un perfil' }).first().click();
    await expect(maria).toHaveURL(/\/perfiles\/nuevo$/);
    await maria.getByLabel('Nombre').fill(nombrePerfil);
    await maria.getByLabel('Fecha de nacimiento').fill('2021-03-14');
    await maria.getByLabel('Alergias').fill('penicilina');
    await maria.getByRole('button', { name: 'Guardar perfil' }).click();
  });

  await test.step('4. Lo ve en la lista', async () => {
    await expect(maria).toHaveURL(/\/perfiles$/);
    await expect(tarjetaPerfil(nombrePerfil)).toBeVisible();
  });

  await test.step('5. Edita alergias y guarda', async () => {
    await tarjetaPerfil(nombrePerfil).click();
    await expect(maria.getByRole('heading', { name: nombrePerfil, level: 1 })).toBeVisible();
    await maria.getByRole('button', { name: 'Editar perfil', exact: true }).click();
    await maria.getByLabel('Alergias').fill('penicilina, látex');
    await maria.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(maria.getByRole('button', { name: 'Editar perfil', exact: true })).toBeVisible();
    await expect(maria.getByText('penicilina, látex')).toBeVisible();
  });

  await test.step('6. Borra el perfil con confirmación y desaparece de la lista', async () => {
    await maria.getByRole('button', { name: 'Borrar perfil' }).click();
    await maria.getByRole('button', { name: 'Sí, borrar el perfil' }).click();
    await expect(maria).toHaveURL(/\/perfiles$/);
    await expect(tarjetaPerfil('Mateo Ruán')).toBeVisible();
    await expect(tarjetaPerfil(nombrePerfil)).toHaveCount(0);
  });

  await test.step('7. Abre conversación para Mateo: «Fiebre», Laura Méndez', async () => {
    await tarjetaPerfil('Mateo Ruán').click();
    await maria.getByRole('button', { name: 'Nueva conversación' }).click();
    await expect(maria).toHaveURL(/\/perfiles\/[^/]+\/conversaciones\/nueva$/);
    await maria.getByLabel('Título de la conversación').fill(titulo);
    await maria.getByRole('checkbox', { name: 'Fiebre' }).click();
    await maria.getByRole('radio', { name: /Laura Méndez Ortiz/ }).click();
    await maria.getByRole('button', { name: 'Crear borrador' }).click();
    await expect(maria).toHaveURL(/\/conversaciones\/[0-9a-f-]{36}\/borrador$/);
    await expect(maria.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
    id = maria.url().split('/').at(-2)!;
  });

  await test.step('8. Responde las preguntas de contexto y envía', async () => {
    const f1 = maria.getByRole('region', { name: /^Temperatura más alta/ });
    await f1.getByLabel('Temperatura (°C)').fill('38.5');
    await f1.getByRole('button', { name: 'Guardar' }).click();
    await expect(f1.getByText('Guardado')).toBeVisible();
    const f3 = maria.getByRole('region', { name: /^¿Desde cuándo/ });
    await f3.getByLabel('Su respuesta').fill('Desde ayer en la tarde');
    await f3.getByRole('button', { name: 'Guardar' }).click();
    await expect(f3.getByText('Guardado')).toBeVisible();
    const enviar = maria.getByRole('button', { name: 'Enviar', exact: true });
    await expect(enviar).toBeEnabled();
    await enviar.click();
    await expect(maria).toHaveURL(/\/conversaciones$/);
  });

  await test.step('9. La médica ve la conversación nueva en «Enviadas»', async () => {
    await entrarComo(medica, 'medica');
    await expect(medica).toHaveURL(/\/medico\/bandeja$/);
    const tarjeta = medica.getByRole('region', { name: 'Enviadas' }).getByRole('button', { name: new RegExp(titulo) });
    await expect(tarjeta).toBeVisible();
    await tarjeta.click();
    await expect(medica).toHaveURL(new RegExp(`/medico/conversaciones/${id}$`));
  });

  await test.step('10. La abre (pasa a «En revisión») y registra una indicación', async () => {
    await expect(medica.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
    await expect(medica.getByText('EN REVISIÓN', { exact: true })).toBeVisible();
    await expect(medica.getByText(/^Mateo Ruán · \d+ años?$/)).toBeVisible();
    await medica.getByRole('button', { name: 'Registrar indicación' }).click();
    await medica.getByLabel('Indicación para la familia').fill(indicacion);
    await medica.getByRole('radio', { name: 'Consulta presencial' }).click();
    await medica.getByLabel('Días para la consulta').fill('2');
    await medica.getByRole('button', { name: 'Registrar indicación' }).click();
    await expect(medica.getByText('Indicación registrada.')).toBeVisible();
    await expect(medica.getByText('CON INDICACIONES', { exact: true })).toBeVisible();
    await expect(medica.getByText(indicacion)).toBeVisible();
  });

  await test.step('11. María ve la indicación en el hilo y contesta', async () => {
    await maria.goto(`/conversaciones/${id}`);
    await expect(maria.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
    await expect(maria.getByText('CON INDICACIONES', { exact: true })).toBeVisible();
    await expect(maria.getByText(indicacion)).toBeVisible();
    await expect(maria.getByText('Consulta presencial en 2 días')).toBeVisible();
    const campo = maria.getByLabel('Mensaje para el médico');
    await campo.fill(respuesta);
    await maria.getByRole('button', { name: 'Enviar el mensaje' }).click();
    await expect(maria.getByText(respuesta)).toBeVisible();
    await expect(campo).toHaveValue('');
  });

  await ventanaMaria.close();
  await ventanaMedica.close();
});
