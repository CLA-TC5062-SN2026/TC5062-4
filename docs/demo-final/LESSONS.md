# Lecciones: errores y particularidades del desarrollo

Aquí va cada error raro, configuración que costó trabajo o comportamiento inesperado del proyecto, para que no se repita. Se escribe el mismo día en que aparece, aunque la solución sea provisional.

## Cómo agregar una entrada

Copia la plantilla al final de la sección que corresponda. Una entrada por problema.

```markdown
### L-XX. Título corto del problema
- **Fecha / quién:** 2026-11-23, Nombre
- **Síntoma:** lo que se vio (mensaje de error exacto, pantalla, comando).
- **Causa:** por qué pasó.
- **Solución:** qué se hizo (commit o PR si aplica).
- **Cómo evitarlo:** regla, prueba o paso de checklist que lo previene.
```

Si la lección cambia una regla de trabajo, también se agrega a [PLAN.md](PLAN.md) sección 8 o a la tarea de [TASKS.md](TASKS.md) que corresponda.

---

## Entorno y configuración

### L-01. El puerto de PostgreSQL no es el del `.env.example`
- **Fecha / quién:** S07-S08-A2, equipo
- **Síntoma:** el backend no conecta a la base (`ECONNREFUSED 127.0.0.1:5432`).
- **Causa:** el contenedor de Docker publica PostgreSQL en el **5434** (`-p 5434:5432`) y `backend/.env.example` trae `DB_PORT=5432`.
- **Solución:** poner `DB_PORT=5434` en `backend/.env` cuando se usa el contenedor.
- **Cómo evitarlo:** el README dice qué puerto usar según se instale PostgreSQL local o en Docker.

### L-02. `JWT_SECRET` corto impide arrancar el backend
- **Fecha / quién:** S09-A1, equipo
- **Síntoma:** el servidor termina con «JWT_SECRET debe configurarse con al menos 32 bytes aleatorios».
- **Causa:** `backend/src/server.js` exige 32 bytes o más.
- **Solución:** generar el secreto con `openssl rand -hex 32`.
- **Cómo evitarlo:** nunca copiar el valor de ejemplo `replace_with_a_random_secret`.

### L-03. Las cuentas de `seed_demo.sql` no pueden iniciar sesión
- **Fecha / quién:** S05-S06-A2, equipo
- **Síntoma:** login de `medico.demo@dafi.invalid` responde 401.
- **Causa:** el seed SQL guarda `NO_ES_UN_HASH_VALIDO_SOLO_DEMO` como hash; las cuentas existen pero están inutilizables a propósito.
- **Solución:** correr `seed_medico_demo.mjs` o `seed_cuidador_demo.mjs` para activarlas.
- **Cómo evitarlo:** usar `demo:reset` (tarea B5), que crea las cuentas de la demo con contraseña conocida.

### L-04. El navegador no debe conocer la URL del backend
- **Fecha / quién:** S07-S08-A2, Armando
- **Síntoma:** tentación de poner `http://localhost:4000` en una variable `NEXT_PUBLIC_*`.
- **Causa:** Next reescribe `/api/v1/*` hacia Express (`frontend/next.config.ts`); el cliente usa rutas relativas y así no hay CORS.
- **Solución:** `NEXT_PUBLIC_API_URL=/api/v1` y `BACKEND_URL` (sin prefijo) para el destino real.
- **Cómo evitarlo:** si aparece un error de CORS en la consola, alguien llamó al backend directo en vez de pasar por el proxy.

### L-05. `tsc --noEmit` falla en un clon limpio
- **Fecha / quién:** S07-S08-A2, Armando
- **Síntoma:** errores de tipos como `LayoutProps` no encontrado.
- **Causa:** Next genera esos tipos durante el build.
- **Solución:** correr `npm --prefix frontend run build` antes de `tsc --noEmit`.
- **Cómo evitarlo:** usar el build como verificación de tipos (es lo que pide PLAN.md sección 8).

## Backend y contrato

### L-06. Las operaciones con efectos exigen `Idempotency-Key`
- **Fecha / quién:** S09-A1, equipo
- **Síntoma:** `400 SOLICITUD_MALFORMADA` «Idempotency-Key debe ser UUID» al enviar una conversación o un mensaje.
- **Causa:** `POST /envios` y `POST /mensajes` (y `POST /indicaciones`, tarea B4) requieren el encabezado con un UUID.
- **Solución:** generar `crypto.randomUUID()` por intento y **reutilizarlo** si el usuario reintenta la misma acción; reusar la clave con otro cuerpo da 422.
- **Cómo evitarlo:** las pruebas de integración de esos endpoints cubren repetición y clave reutilizada.

### L-07. La médica no ve borradores ni familias fuera de su círculo
- **Fecha / quién:** S05-S06-A2, equipo
- **Síntoma:** la médica recibe 404 en una conversación que sí existe.
- **Causa:** un `BORRADOR` es privado de la familia (RF-12) y la médica debe estar en `miembro_circulo` de esa familia (RF-08-AC-3). `authorize.js` responde 404, no 403, para no revelar que el recurso existe.
- **Solución:** enviar la conversación antes de probar como médica, y verificar que el seed la agrega al círculo.
- **Cómo evitarlo:** el e2e del guion (Q4) recorre el orden real: crear, responder, enviar y luego abrir como médica.

### L-08. Un perfil `menor` no acepta `compartirConCocuidador`
- **Fecha / quién:** S07-S08-A2, equipo
- **Síntoma:** 422 al crear un menor con esa casilla marcada.
- **Causa:** regla de negocio en `routes/perfiles.js`: los menores ya se comparten con el cocuidador.
- **Solución:** el formulario oculta la casilla cuando el tipo es `menor`.
- **Cómo evitarlo:** prueba unitaria de la validación del formulario por tipo (F2).

### L-09. La sesión caduca por inactividad del lado del servidor
- **Fecha / quién:** S07-S08-A2, equipo
- **Síntoma:** a media demo, una pantalla responde 401 aunque el token no ha expirado.
- **Causa:** `authenticate.js` revoca la sesión tras `MINUTOS_SESION` (30) sin actividad.
- **Solución:** iniciar sesión justo antes de grabar; para ensayos largos se puede subir `MINUTOS_SESION` en el `.env` local.
- **Cómo evitarlo:** el checklist de grabación (D5) incluye entrar de nuevo con las dos cuentas antes de empezar.

## Frontend

### L-10. Un login fallido se trataba como sesión caducada
- **Fecha / quién:** 2026-11-08, Francisco (PR #56)
- **Síntoma:** con la contraseña mala, la app mandaba a «sesión expirada» en vez de decir que las credenciales eran incorrectas.
- **Causa:** el backend usa `401 NO_AUTENTICADO` tanto para credenciales incorrectas como para sesión revocada, y el interceptor de 401 no distinguía las peticiones públicas.
- **Solución:** `services/interceptores.ts` ignora el 401 de las peticiones marcadas `publica` (como el login) y `/entrar` muestra un mensaje específico.
- **Cómo evitarlo:** toda petición nueva sin token (por ejemplo `registrar()` en F1) se marca `publica`. El e2e de login (Q2) prueba la contraseña incorrecta, que además es el error que se muestra en la demo.

### L-11. Pantallas que parecen funcionar pero usan datos fijos
- **Fecha / quién:** S11-A1, Daniel (matriz de trazabilidad)
- **Síntoma:** una vista se ve completa pero no cambia aunque cambie la base.
- **Causa:** importa `frontend/src/lib/datos-demo.ts`.
- **Solución:** conectar la vista a su servicio y quitar el import.
- **Cómo evitarlo:** antes de dar por terminada una tarea de frontend, `grep -rn "datos-demo" frontend/src/app` no debe mostrar la pantalla tocada. Al final de la semana el archivo debería poder borrarse.

## Pruebas

### L-12. `node --test` sin argumentos corre todo lo que parezca prueba
- **Fecha / quién:** 2026-11-22, plan de la demo
- **Síntoma esperado:** al agregar pruebas de integración, `npm test` empieza a fallar en máquinas sin PostgreSQL.
- **Causa:** `node --test` busca por defecto archivos como `*.test.js` y todo lo que esté bajo carpetas `test/`.
- **Solución:** pruebas de integración en `backend/integration/` con extensión `.int.mjs` y su propio script (tarea Q1).
- **Cómo evitarlo:** después de agregar el arnés, confirmar que `npm test` sigue en verde sin base de datos.

## Git y flujo de trabajo

### L-13. Comandos corridos desde la carpeta equivocada
- **Fecha / quién:** S09-A1, equipo (retrospectiva)
- **Síntoma:** `npm` o `git` fallan o actúan sobre otro proyecto.
- **Causa:** el repo tiene dos paquetes (`backend/` y `frontend/`) y la raíz no tiene `package.json`.
- **Solución:** usar `npm --prefix backend ...` y `npm --prefix frontend ...` desde la raíz, como en el README.
- **Cómo evitarlo:** todos los comandos de PLAN.md y TASKS.md usan `--prefix`.

### L-14. Ramas largas terminan en conflictos
- **Fecha / quién:** S09-A1, equipo (PR #58 y #60)
- **Síntoma:** varias ramas tocando `backend/src/routes/` el mismo día y merges con conflictos.
- **Causa:** PRs grandes que tardan en fusionarse.
- **Solución:** un PR por tarea de TASKS.md, fusionado el mismo día; `git pull --rebase origin main` antes de abrir el PR.
- **Cómo evitarlo:** regla de PLAN.md sección 8.

---

## Entradas de esta semana

<!-- Agreguen aquí, con número consecutivo desde L-15, lo que aparezca entre el 23 y el 26 de noviembre. -->

### L-15. El README raíz no trae los comandos de Docker
- **Fecha / quién:** 2026-11-22, Francisco y agente (E0)
- **Síntoma:** al levantar el entorno desde cero, «Instalación local» del README solo explica PostgreSQL instalado en la máquina (`createuser`, `createdb`, `psql -W`). Con Docker no hay `psql` local ni rol `dafi_app`.
- **Causa:** los comandos de Docker viven en `S07_S08_A2/capa_servicios.md` sección 8 y en PLAN.md sección 9, no en el README.
- **Solución:** se siguió `capa_servicios.md`: `docker run` en el 5434, `docker exec -i dafi-postgres psql -U dafi -d dafi < archivo.sql` para esquema y seeds, `DB_PORT=5434`, `DB_USER=dafi` y `seed_integracion_demo.mjs` con el backend ya arriba. Funcionó sin cambios.
- **Cómo evitarlo:** D2 agrega la ruta de Docker al README; con B5 basta `demo:reset`.

### L-16. Vitest 5 no se instala con `@types/node` 20
- **Fecha / quién:** 2026-11-22, agente (Q3, PR #62)
- **Síntoma:** `npm i -D vitest` termina con `ERESOLVE could not resolve`; al intentar `vitest@4`, npm 11.4 falla con `Cannot read properties of null (reading 'edgesOut')` y deja `node_modules` a medias.
- **Causa:** Vitest 5 declara `@types/node@"^22.0.0 || >=24.0.0"` como peer y el frontend tenía `^20`.
- **Solución:** `npm i -D vitest @types/node@^22` (el runtime local ya es Node 22). Tras el fallo de npm hubo que borrar `node_modules` y restaurar el lockfile.
- **Cómo evitarlo:** no usar `--force` ni `--legacy-peer-deps`; si npm deja la instalación rota, `git checkout frontend/package-lock.json` y `npm ci`.

### L-17. `esquema_bd.sql` no se puede ejecutar dos veces
- **Fecha / quién:** 2026-11-22, agente (Q1, PR #63)
- **Síntoma:** cargar el esquema sobre una base que ya lo tiene falla en el primer `CREATE TYPE`.
- **Causa:** el archivo usa `CREATE TYPE` y `CREATE TABLE` sin `IF NOT EXISTS`.
- **Solución:** el arnés de integración hace `DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;` y luego carga el archivo completo.
- **Cómo evitarlo:** como ese `DROP` borra todo, el arnés se niega a correr si la base no termina en `_test`. `demo:reset` (B5) necesita la misma protección contra bases que no sean locales.

### L-18. El arnés de integración no debe leer `DB_NAME`
- **Fecha / quién:** 2026-11-22, agente (Q1, PR #63)
- **Síntoma esperado:** las pruebas de integración borran la base de la demo.
- **Causa:** `backend/.env` trae `DB_NAME=dafi` y `src/config/database.js` lee `DB_*` al importarse. Si el arnés usara `DB_NAME` como respaldo, o importara `app` antes de fijar el entorno, apuntaría a `dafi`.
- **Solución:** el nombre sale solo de `TEST_DB_NAME` (por defecto `dafi_test`); el arnés asigna `process.env.DB_*` y después importa `app` con `await import()`.
- **Cómo evitarlo:** toda prueba de integración importa `app` desde `integration/arnes.mjs`, nunca directo de `src/app.js`.

### L-19. Las pruebas de integración se quedan colgadas si no se cierran conexiones
- **Fecha / quién:** 2026-11-22, agente (Q1, PR #63)
- **Síntoma:** `node --test` no termina aunque todas las pruebas pasen.
- **Causa:** `fetch` deja conexiones keep-alive abiertas contra el servidor de prueba y el pool de `pg` sigue vivo.
- **Solución:** `server.closeAllConnections()` antes de `server.close()`, y `pool.end()`. Además `--test-concurrency=1`, porque cada archivo `*.int.mjs` recrea el esquema y en paralelo competirían por la misma base.
- **Cómo evitarlo:** cada archivo nuevo usa `before(iniciar)` y `after(cerrar)` del arnés.

### L-20. El e2e móvil usa Chromium, no un perfil de iPhone
- **Fecha / quién:** 2026-11-22, agente (Q2, PR #64)
- **Síntoma esperado:** `npx playwright install chromium` no basta y las pruebas móviles fallan pidiendo WebKit.
- **Causa:** los perfiles `iPhone` de Playwright usan WebKit, que es otra descarga.
- **Solución:** proyecto `movil` con `Desktop Chrome`, viewport 375 × 812, `isMobile` y `hasTouch`. Chromium pesa unos 100 MB y queda en `~/Library/Caches/ms-playwright`.
- **Cómo evitarlo:** en un clon limpio, correr `(cd frontend && npx playwright install chromium)` antes del primer `e2e`.

### L-21. `demo:reset` cierra las sesiones abiertas
- **Fecha / quién:** 2026-11-22, agente (B5, PR #66)
- **Síntoma:** después de `demo:reset`, las ventanas que ya tenían sesión reciben 401 y van a «sesión expirada».
- **Causa:** el script borra y recrea el esquema, incluida la tabla `sesion`. El backend que ya está corriendo sigue funcionando sin reiniciarse.
- **Solución:** volver a entrar con las dos cuentas después de cada reset.
- **Cómo evitarlo:** en el checklist de grabación (D5), el orden es `demo:reset` y después iniciar sesión, nunca al revés.

### L-22. La pregunta F3 de fiebre no está en el SRS
- **Fecha / quién:** 2026-11-22, Francisco (B5, PR #66)
- **Síntoma:** TASKS.md pide 3 o 4 preguntas de contexto para `fiebre` y al menos una de texto libre, pero el SRS (RF-10) solo define F1 y F2, y ninguna es de texto.
- **Causa:** el catálogo del SRS se quedó corto para lo que la demo necesita mostrar.
- **Solución:** el seed agrega F3, «¿Desde cuándo tiene fiebre?» (texto, obligatoria). La primera versión usaba la pregunta general G2; se descartó porque `GET /etiquetas` no devuelve las generales y el borrador mostraba una pregunta que el catálogo no listaba.
- **Cómo evitarlo:** la desviación se declara en la matriz de trazabilidad (D1). Ninguna otra pregunta fuera del SRS entra al seed sin aprobación del PO.

### L-23. No hay cambio de estado de `CON_INDICACIONES` a sí mismo
- **Fecha / quién:** 2026-11-22, agente (B5, PR #66)
- **Síntoma esperado:** la segunda indicación de una conversación falla con un error de la restricción `ck_evento_cambio_estado`.
- **Causa:** el esquema prohíbe un evento `cambio_estado` con el mismo estado anterior y nuevo.
- **Solución:** en B4, si la conversación ya está en `CON_INDICACIONES`, se registra solo el evento `indicacion`.
- **Cómo evitarlo:** prueba de integración de B4 con dos indicaciones seguidas.

### L-24. Ningún endpoint crea `permiso_historial`
- **Fecha / quién:** 2026-11-23, agente (B3)
- **Síntoma:** para probar a una médica que lee una conversación sin ser la asignada, la prueba tuvo que insertar la fila de `permiso_historial` con SQL directo.
- **Causa:** `authorize.js` da lectura por historial compartido, pero la API no tiene forma de crear ese permiso.
- **Solución:** la prueba de integración inserta la fila con `pool`. La demo no usa historial compartido.
- **Cómo evitarlo:** no meter ese caso al guion ni a las e2e; si se necesita, sembrarlo en `demo_seed.mjs`.

### L-25. `/eventos` no devolvía los datos de la indicación
- **Fecha / quién:** 2026-11-23, agente (B4)
- **Síntoma:** tras registrar una indicación, `GET /conversaciones/{id}/eventos` traía el evento `indicacion` sin `decision`, `plazoDias` ni `vigente`; la familia no podía saber cuál era la vigente.
- **Causa:** la consulta de `/eventos` no seleccionaba esas columnas, aunque el contrato define `Evento.indicacion`.
- **Solución:** `/eventos` devuelve `indicacion` (objeto `Indicacion`) en los eventos de ese tipo y `null` en los demás. `GET /conversaciones/{id}` sigue sin `indicacionVigente`.
- **Cómo evitarlo:** F6 y F7 leen la indicación desde `/eventos`. Ojo: `cambio_estado` e `indicacion` nacen en la misma transacción con la misma `fecha`, así que su orden entre sí no está garantizado.

### L-26. El error del formulario quedaba tapado en el teléfono
- **Fecha / quién:** 2026-11-23, agente (F1)
- **Síntoma:** en «Crear cuenta» a 375 px, el mensaje «Ya existe una cuenta con este correo.» no se veía tras pulsar el botón. La e2e pasaba porque Playwright considera visible un elemento aunque lo tape el encabezado fijo.
- **Causa:** el mensaje estaba al inicio del formulario y el botón al final; al enviar, el inicio queda debajo del encabezado.
- **Solución:** el error general se muestra justo encima del botón.
- **Cómo evitarlo:** en formularios más altos que la pantalla, el error general va junto al botón. Revisar cada pantalla con captura a 375 px además de la e2e.

### L-27. Los servidores de desarrollo no sobreviven entre sesiones
- **Fecha / quién:** 2026-11-23, agente (F1)
- **Síntoma:** las 12 e2e fallaron con `net::ERR_CONNECTION_REFUSED at http://localhost:3000`.
- **Causa:** backend y frontend se habían detenido; `playwright.config.ts` no los levanta.
- **Solución:** levantar ambos (`npm run dev` en `backend/` y `frontend/`) y repetir.
- **Cómo evitarlo:** antes de correr e2e, comprobar `curl localhost:4000/api/v1/health` y `curl localhost:3000`. Antes de grabar, lo mismo.

### L-28. Borrar un perfil borra también su historial y su bitácora de accesos
- **Fecha / quién:** 2026-11-23, agente (F3)
- **Síntoma esperado:** al borrar un perfil desaparecen sus conversaciones, mensajes, fotos, indicaciones y los registros de `registro_acceso` de esas conversaciones.
- **Causa:** `DELETE /perfiles/{id}` es un borrado físico y `esquema_bd.sql` lo propaga en cascada; el backend no lo rechaza aunque haya conversaciones.
- **Solución:** la confirmación de F3 dice cuántas conversaciones se borran y que no se puede deshacer. No se cambió el backend.
- **Cómo evitarlo:** en la demo, borrar solo un perfil recién creado, nunca a Mateo (tiene la conversación histórica); si pasa, `demo:reset`. La pérdida de la bitácora se declara como limitación en D1.

### L-29. El historial se pagina por fecha de creación, no por actividad
- **Fecha / quién:** 2026-11-23, agente (F3)
- **Síntoma:** en el historial de un perfil, una conversación vieja con actividad reciente no sube a la primera página.
- **Causa:** `GET /perfiles/{id}/conversaciones` ordena por `creada_en DESC` antes de paginar.
- **Solución:** F3 reordena por `ultimoEventoEn` solo dentro de cada página (5 por página).
- **Cómo evitarlo:** con los datos de la demo no se nota (menos de 5 conversaciones por perfil). Si se quiere el orden correcto entre páginas, hay que ordenar en el backend.

### L-30. `tsc` falla tras mover una ruta por tipos viejos de `next build`
- **Fecha / quién:** 2026-11-23, agente (F4)
- **Síntoma:** `npx tsc --noEmit` reportó errores en `frontend/.next/types/validator.ts` que apuntaban a `conversaciones/borrador`, una ruta que ya no existe.
- **Causa:** un `next build` anterior dejó tipos generados en `.next/types`; el servidor de desarrollo escribe los suyos en `.next/dev/types` y no limpia los otros.
- **Solución:** quitar `frontend/.next/types` (no está versionado) y repetir `tsc`.
- **Cómo evitarlo:** después de mover o borrar una ruta, borrar `.next/types` o correr `npm --prefix frontend run build` con el servidor de desarrollo detenido.

### L-31. Las e2e dejan borradores en Mateo y terminan rompiendo otra prueba
- **Fecha / quién:** 2026-11-23, agente (F4)
- **Síntoma esperado:** tras tres corridas de e2e sin `demo:reset`, falla la prueba que busca «Fiebre desde anoche» en el historial de Mateo.
- **Causa:** cada corrida crea dos borradores para Mateo; con cinco, la conversación histórica pasa a la página 2 (L-29).
- **Solución:** correr `npm --prefix backend run demo:reset` antes de cada corrida de e2e.
- **Cómo evitarlo:** `demo:reset` antes de las e2e y antes de grabar.

### L-32. El detalle devuelve la temperatura como texto
- **Fecha / quién:** 2026-11-23, agente (F5)
- **Síntoma:** `GET /conversaciones/{id}` trae `preguntas[].respuesta.numero` como `"38.6"` (texto), mientras que el `PUT` de la respuesta devuelve `38.6` (número).
- **Causa:** `pg` entrega las columnas `numeric` como texto y `detalle()` no las convierte.
- **Solución:** el borrador convierte con `Number(...)` al precargar. No se cambió el backend.
- **Cómo evitarlo:** F7 muestra las respuestas a la médica y debe convertir igual, o se corrige `detalle()` en el backend en una sola línea.
