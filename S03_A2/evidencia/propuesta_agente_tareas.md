# Sprint Backlog, Sprint 1: descomposición en tareas (DAFI)

**Equipo 4** · **Product Owner:** Francisco Martínez · **Scrum Master (Sprint 1):** Daniel Ruán · **Developers:** Armando Arredondo, Isaac González, Daniel Ruán y Francisco Martínez
**Fuentes:** `s03a2_propuesta_planning.md`, `backlog_completo.md` y `SRS_equipo.md` 3.0

## 0. Supuestos de la descomposición

**Elementos del Sprint Backlog**

| Elemento | Tipo | Criterios | Presupuesto |
|---|---|---|---|
| HAB-01 «Arranque técnico» | Habilitador (`tipo:habilitador`) | Seis partes de la sección 4 de la propuesta | 11 h |
| HU-01a «Registro con consentimiento, inicio y cierre de sesión» | Historia, 5 SP | RF-01-AC-1, RF-01-AC-2, RF-01-AC-3, RF-01-AC-6, RF-02-AC-1, RF-02-AC-2, RF-02-AC-4, RF-02-AC-5 y RNF-05 (hash de contraseñas, expiración de sesión) | 10 h (±20 %) |
| HU-02 «Perfiles de los hijos y del propio cuidador» | Historia, 3 SP | RF-04-AC-1, RF-04-AC-2, RF-04-AC-3, RF-04-AC-5 (RF-04-AC-4 queda fuera porque depende de HU-13) | 6 h (±20 %) |

**Horas por persona.** Cada quien tiene ≈17 h brutas en el sprint y 6 h de eventos de Scrum. Francisco reserva 3 h de Product Owner y Daniel 1.5 h de Scrum Master. Las horas disponibles para desarrollo quedan así: Armando 11, Isaac 11, Daniel 9.5 y Francisco 8 (39.5 en total). Con el factor de enfoque de 0.70 eso da ≈27.7 h productivas, repartidas en proporción: Armando 7.7, Isaac 7.7, Daniel 6.7 y Francisco 5.6.

**Cómo se leen las horas.** Las estimaciones de cada tarea son horas productivas (trabajo enfocado, sin interrupciones). La diferencia entre las horas disponibles y las asignadas es el colchón del factor de enfoque: coordinación, revisiones cortas, esperas y aprendizaje del stack.

**Decisiones técnicas que la descomposición da por tomadas**

- Sesión con cookie `httpOnly`, `Secure` y `SameSite=Lax` en el mismo dominio: Next.js reenvía `/api/*` a Express con `rewrites`. El identificador de sesión es aleatorio (256 bits) y en MongoDB se guarda solo su hash, con la fecha de última actividad.
- Rutas de la API: `POST /api/auth/registro`, `POST /api/auth/sesion` (inicio), `DELETE /api/auth/sesion` (cierre), `GET /api/auth/yo`, y `GET|POST|PATCH|DELETE /api/perfiles`.
- Pruebas de API con Jest o Vitest + Supertest + MongoDB en memoria; pruebas de cliente con Vitest + Testing Library. Cada prueba lleva el ID `RF-XX-AC-Y` (o `RNF-05`) al inicio del nombre.
- Regla de revisión: ningún pull request se fusiona sin la aprobación de alguien que no lo escribió. Las tareas de revisión de código asignan al revisor principal de cada historia; las revisiones de los pull requests del propio revisor las hace otro Developer y caben en el colchón.
- El cocuidador de RF-04-AC-3 se crea con una fábrica de datos de prueba (fixture), porque el flujo real llega con HU-04.

---

## 1. Tareas de desarrollo

### 1.1 HAB-01 «Arranque técnico» (11 h)

Se trabaja en dos parejas, como propone la sección 4: **cliente y despliegue** (Armando y Francisco) y **API y base de datos** (Isaac y Daniel). La meta intermedia es el «esqueleto andante» al final del día 3 (T-07).

| ID | Tarea | Responsable (rol) | h | Depende de | Criterio de «done» |
|---|---|---|---|---|---|
| T-01 | Crear el repositorio y el tablero del sprint | Francisco (DevOps) | 1 | — | Repositorio en GitHub con `web/` y `api/`; `main` protegida (pull request obligatorio, 1 aprobación, CI en verde); plantilla de pull request con la lista de la Definition of Done; labels `HU-01a`, `HU-02`, `tipo:habilitador`, `tipo:QA`, `tipo:PO`, `tipo:SM`; tablero en GitHub Projects con T-01 a T-31 cargadas con responsable y horas. |
| T-02 | Configurar la integración continua | Isaac (DevOps) | 2 | T-01, T-03, T-04 | Workflow de GitHub Actions que en cada pull request corre lint y pruebas de `web/` y `api/`; Supertest y MongoDB en memoria funcionando; una prueba de ejemplo por proyecto pasa en el pipeline; un pull request con una prueba rota queda bloqueado; la convención `RF-XX-AC-Y` está escrita en el `README`. |
| T-03 | Crear el esqueleto del cliente en Next.js | Armando (frontend dev) | 1.5 | T-01 | `npm run dev` levanta el cliente; diseño base sin desplazamiento horizontal a 360 px; `rewrites` de `/api/:path*` hacia la URL de la API leída de una variable de entorno; cliente HTTP que envía `X-Correlation-Id` y traduce los códigos del contrato de errores a los textos del SRS. |
| T-04 | Crear el esqueleto de la API en Express | Isaac (backend dev) | 1.5 | T-01 | Parámetros de la tabla 3.4 leídos de variables de entorno con los valores iniciales por defecto; reloj inyectable (`reloj.ahora()`) usado en lugar de `Date.now()`; `GET /api/salud` responde 200; `trust proxy` configurado para leer la IP real detrás del reenvío de Vercel. |
| T-05 | Implementar los middlewares de errores, correlación, logs y autorización | Daniel (backend dev) | 1.5 | T-04 | Todo rechazo sale con `{codigo, mensaje, correlacionId}` y el HTTP de la tabla 3.0, sin trazas internas; el logger enmascara `password`, `token`, `cookie` y correos (RNF-13); middleware `autorizar(operacion)` que consulta la matriz de roles y responde `SIN_PERMISOS` antes de buscar el recurso; pruebas unitarias del middleware de errores y de autorización en verde. |
| T-06 | Configurar MongoDB Atlas y Mongoose | Daniel (backend dev) | 1.5 | T-04 | Clúster gratuito con bases y usuarios separados para desarrollo y ambiente del curso; cadena de conexión solo en variables de entorno (nada en el repositorio); `npm run seed` carga datos sintéticos y se niega a correr si la variable de ambiente es la del curso sin una bandera explícita. |
| T-07 | Desplegar cliente y API con HTTPS | Armando (DevOps) | 2 | T-02, T-03, T-04, T-06 | Cliente en Vercel y API en Render (o equivalentes gratuitos) con HTTPS; despliegue automático al fusionar a `main`; la pantalla desplegada muestra el resultado de `/api/salud` a través del `rewrite` (esqueleto andante); monitor de disponibilidad (p. ej. UptimeRobot) apuntando a `/api/salud`. |

### 1.2 HU-01a «Registro con consentimiento, inicio y cierre de sesión» (11.5 h)

| ID | Tarea | Responsable (rol) | h | Depende de | Criterio de «done» |
|---|---|---|---|---|---|
| T-08 | Crear los modelos de familia y usuario con hash de contraseña | Isaac (backend dev) | 1 | T-05, T-06 | Modelos `Familia` y `Usuario` (correo único en minúsculas, rol, hash, `avisoVersion`, `avisoAceptadoEn`, tres declaraciones); hash con bcrypt (costo ≥ 12) o Argon2id; prueba `RNF-05 hash`: el valor guardado empieza con `$2b$` o `$argon2id$` y nunca es la contraseña; fábricas de prueba `crearCuidador()` y `crearCocuidador()`; el seed agrega una familia sintética con ambos roles. |
| T-09 | Implementar sesiones con cookie y expiración | Daniel (backend dev) | 1.5 | T-08 | Colección `sesiones` con hash del identificador y última actividad; cookie `httpOnly`, `Secure`, `SameSite=Lax`; middleware `autenticar` que responde `NO_AUTENTICADO` si la sesión no existe, fue revocada o lleva más de `MINUTOS_SESION` sin peticiones (medido con el reloj inyectable); prueba `RNF-05 expiración`: con `MINUTOS_SESION` = 30, una petición a los 31 minutos recibe `NO_AUTENTICADO` y una a los 29 minutos renueva la sesión. |
| T-10 | Implementar el endpoint de registro | Isaac (backend dev) | 1.5 | T-09, T-24 | `POST /api/auth/registro` crea familia y usuario en una sola transacción, guarda versión y fecha del aviso y abre sesión; pasan `RF-01-AC-1`, `RF-01-AC-2` (la respuesta `DATOS_INVALIDOS` lista la declaración faltante) y `RF-01-AC-3` («Ya existe una cuenta con este correo.»); ninguna respuesta incluye el hash. |
| T-11 | Implementar inicio y cierre de sesión | Daniel (backend dev) | 1 | T-09 | `POST /api/auth/sesion` y `DELETE /api/auth/sesion`; pasan `RF-02-AC-1` (la respuesta indica el inicio por rol: perfiles para cuidador y cocuidador), `RF-02-AC-2` (mismo mensaje y mismo código para correo inexistente y contraseña equivocada), `RF-02-AC-4` y `RF-02-AC-5` (cerrar sin sesión responde sin error 5xx y sin crear sesión); el inicio y el cierre se registran como eventos de seguridad sin correo en claro (RNF-13). |
| T-12 | Construir la pantalla de registro con aviso y declaraciones | Francisco (frontend dev) | 1.5 | T-03, T-10 (contrato acordado; puede empezar con un mock), T-24 | Formulario de correo y contraseña, aviso de privacidad v0 visible antes de enviar, tres casillas sin marcar por defecto; cada declaración faltante muestra «Necesitamos esta autorización para usar DAFI.» junto a la casilla; prueba de cliente `RF-01-AC-2` en verde; tras registrarse llega a la pantalla de perfiles; se completa solo con teclado. |
| T-13 | Construir el inicio de sesión y el botón «Cerrar sesión» | Armando (frontend dev) | 1.5 | T-03, T-11 | Pantalla de inicio de sesión con «Los datos no coinciden»; botón «Cerrar sesión» visible en la pantalla de inicio; cualquier respuesta `NO_AUTENTICADO` lleva a la pantalla de inicio de sesión (cubre la parte de cliente de `RF-02-AC-5`); prueba de cliente `RF-02-AC-2` en verde. |
| T-14 | Construir la pantalla pública «Qué es DAFI» | Francisco (frontend dev) | 1 | T-03, T-25 | Ruta pública accesible sin sesión y enlazada desde registro e inicio de sesión; muestra los textos de T-25 y el aviso de RF-13 con el botón «Llamar al 911» (`tel:911`); prueba de cliente `RF-01-AC-6` verifica los cuatro contenidos del criterio sin sesión. |

### 1.3 HU-02 «Perfiles de los hijos y del propio cuidador» (6.75 h)

| ID | Tarea | Responsable (rol) | h | Depende de | Criterio de «done» |
|---|---|---|---|---|---|
| T-18 | Crear el modelo de perfil y el cálculo de edad | Daniel (backend dev) | 1 | T-08 | Modelo `Perfil` (familia, tipo `MENOR` o `PROPIO`, nombre, fecha de nacimiento, alergias, medicamentos, «Compartir con el cocuidador»); función de edad en años con el reloj inyectable y la zona America/Mexico_City; pruebas unitarias del cálculo (cumpleaños hoy, ayer y mañana) en verde. |
| T-19 | Implementar la API de perfiles con validaciones y autorización | Isaac (backend dev) | 2 | T-05, T-18 | `GET`, `POST`, `PATCH` y `DELETE /api/perfiles`; pasan `RF-04-AC-1` (lista con edad, visible también para el cocuidador), `RF-04-AC-2` (fecha futura da `DATOS_INVALIDOS`), `RF-04-AC-3` (cocuidador recibe `SIN_PERMISOS` al crear, editar y eliminar) y `RF-04-AC-5` (perfil `MENOR` con 18 años o más da `DATOS_INVALIDOS` con motivo `ES_ADULTO` y no se guarda); el perfil `PROPIO` no aparece al cocuidador salvo que se comparta; un perfil de otra familia responde `NO_ENCONTRADO`. |
| T-20 | Construir la lista y el formulario de perfiles | Armando (frontend dev) | 2 | T-13, T-19 | Pantalla de inicio del cuidador con la lista de perfiles y la edad; alta y edición con alergias y medicamentos; «Revise la fecha de nacimiento.» ante fecha futura; ante `ES_ADULTO` ofrece «Agregar a otro adulto» con el comportamiento que decida el Product Owner en T-25; pruebas de cliente `RF-04-AC-2` y `RF-04-AC-5` en verde; funciona solo con teclado. |

### 1.4 Tareas de QA y revisión de código

Ninguna tarea de QA la hace quien construyó lo que se prueba.

| ID | Historia | Tarea | Responsable (rol) | h | Depende de | Criterio de «done» |
|---|---|---|---|---|---|---|
| T-15 | HU-01a | Escribir pruebas negativas de autenticación y sesión | Armando (QA) | 1 | T-10, T-11 | Pruebas automatizadas en CI: petición sin cookie, con cookie revocada tras el cierre, con cookie expirada y con identificador alterado reciben `NO_AUTENTICADO`; la cookie tiene `HttpOnly`, `Secure` y `SameSite`; ninguna respuesta de error trae traza, hash ni token; revisión manual de los logs del ambiente del curso tras un registro y un inicio de sesión sin contraseñas, tokens ni correos en claro. |
| T-16 | HU-01a | Verificar registro, sesión y «Qué es DAFI» en celular a 360 px | Daniel (QA) | 0.75 | T-07, T-12, T-13, T-14 | En el ambiente desplegado, en Chrome para Android y Safari para iOS (dispositivo real o, si falta uno, emulación documentada): sin desplazamiento horizontal a 360 px, flujo completo con teclado y foco visible, ningún error comunicado solo con color; hallazgos registrados como issues con captura y enlazados a la historia. |
| T-17 | HU-01a | Revisar el código de HU-01a | Francisco (revisor) | 0.75 | Pull requests de T-08 a T-11 y T-13 | Cada pull request revisado contra la lista de la plantilla (prueba con ID por criterio, contrato de errores, matriz de roles, nada sensible en logs ni URL, reloj inyectable); comentarios resueltos y pull requests aprobados. |
| T-21 | HU-02 | Escribir pruebas negativas de autorización de perfiles | Francisco (QA) | 0.75 | T-19 | Pruebas automatizadas en CI: cocuidador recibe `SIN_PERMISOS` también con un perfil de otra familia (se verifica primero el rol); cuidador de otra familia recibe `NO_ENCONTRADO` al leer, editar y borrar; sin sesión, `NO_AUTENTICADO`; cocuidador no ve el perfil `PROPIO` no compartido. |
| T-22 | HU-02 | Verificar perfiles en celular a 360 px | Francisco (QA) | 0.5 | T-07, T-20 | En el ambiente desplegado, en Chrome para Android y Safari para iOS: alta de dos perfiles (uno con alergia), edad visible, mensajes de error legibles, sin desplazamiento horizontal y operable con teclado; hallazgos registrados como issues. |
| T-23 | HU-02 | Revisar el código de HU-02 | Francisco (revisor) | 0.5 | Pull requests de T-18 a T-20 | Igual que T-17, aplicado a los pull requests de HU-02. |

T-15, T-16 y T-17 cuentan dentro de las 11.5 h de HU-01a; T-21, T-22 y T-23 dentro de las 6.75 h de HU-02.

---

## 2. Tareas del Product Owner y del Scrum Master

Salen de las horas reservadas para cada rol, no de la capacidad de desarrollo.

### 2.1 Product Owner (Francisco, 3 h)

| ID | Tarea | h | Depende de | Criterio de «done» |
|---|---|---|---|---|
| T-24 | Redactar el aviso de privacidad v0 y las tres declaraciones | 1 | — | Documento en el repositorio (`docs/aviso-privacidad-v0.md`) con identificador de versión, la declaración del uso del módulo de resumen (RD-06) y el texto exacto de las tres declaraciones de RF-01; entregado a más tardar el día 3. |
| T-25 | Definir los textos de «Qué es DAFI» y el comportamiento de «Agregar a otro adulto» | 0.25 | — | Textos de los cuatro puntos de RF-01-AC-6 en el repositorio, con el aviso de RF-13 marcado «pendiente de revisión médica (RD-05)»; decisión escrita en el issue de HU-02 sobre qué hace «Agregar a otro adulto» mientras no exista HU-03; entregado a más tardar el día 4. |
| T-26 | Aceptar HU-01a y HU-02 | 0.75 | T-15, T-16, T-21, T-22 | Recorrido del guion del Sprint Goal en un celular sobre la URL pública (registro con tres declaraciones, dos perfiles, cierre y nuevo inicio); en la base del ambiente del curso, la cuenta tiene versión y fecha del aviso y el hash con bcrypt o Argon2id; las pruebas de los 12 criterios (las 11 del goal más `RF-01-AC-6`) más las dos de RNF-05 en verde en CI; cada historia queda «Aceptada» o con la lista de lo que falta en el tablero. |
| T-27 | Refinar el backlog para el Sprint 2 | 0.5 | — | `backlog_completo.md` actualizado con HU-01a y HU-01b (10 SP en total), RF-01-AC-6 asignado a HU-01a, decisión sobre RF-01-AC-5 y RF-03-AC-6, y RF-04-AC-4 anotado como dependiente de HU-13. |
| T-28 | Gestionar la búsqueda del médico revisor de RD-05 | 0.5 | — | Al menos dos candidatos contactados y el estado registrado en el issue de RD-05 antes de la Sprint Review. |

### 2.2 Scrum Master (Daniel, 1.5 h)

| ID | Tarea | h | Depende de | Criterio de «done» |
|---|---|---|---|---|
| T-29 | Preparar los eventos del sprint | 0.5 | — | Planning, Review y Retrospective agendadas con agenda; plantilla de Daily Scrum escrito publicada en el canal del equipo para los días sin reunión. |
| T-30 | Dar seguimiento a impedimentos | 0.5 | T-07 (punto de control) | Registro de impedimentos en el tablero; el día 3 se verifica el esqueleto andante (T-07) y, si no está, se levanta como impedimento en el Daily Scrum; ninguna tarea queda más de 48 h en «En curso» sin comentario. |
| T-31 | Registrar las horas reales para recalibrar la equivalencia | 0.5 | — | Cada tarea cerrada tiene horas reales capturadas en el tablero; en la Retrospective se presenta el total real por historia y la velocidad del Sprint 1. |

---

## 3. Horas por persona y por historia

**Desarrollo (incluye QA y revisión)**

| Persona | HAB-01 | HU-01a | HU-02 | Total desarrollo | Productivas disponibles | Carga |
|---|---|---|---|---|---|---|
| Armando Arredondo | 3.5 (T-03, T-07) | 2.5 (T-13, T-15) | 2 (T-20) | **8.0** | 7.7 | 104 % |
| Isaac González | 3.5 (T-02, T-04) | 2.5 (T-08, T-10) | 2 (T-19) | **8.0** | 7.7 | 104 % |
| Daniel Ruán | 3 (T-05, T-06) | 3.25 (T-09, T-11, T-16) | 1 (T-18) | **7.25** | 6.7 | 108 % |
| Francisco Martínez | 1 (T-01) | 3.25 (T-12, T-14, T-17) | 1.75 (T-21, T-22, T-23) | **6.0** | 5.6 | 107 % |
| **Total** | **11** | **11.5** | **6.75** | **29.25** | 27.7 | 106 % |
| Presupuesto | 11 | 10 (8 a 12) | 6 (4.8 a 7.2) | 27 | | |

**Horas totales por persona en el sprint**

| Persona | Desarrollo | Rol (PO/SM) | Eventos de Scrum | Total asignado | Brutas | Colchón |
|---|---|---|---|---|---|---|
| Armando | 8.0 | — | 6 | 14.0 | ≈17 | 3.0 |
| Isaac | 8.0 | — | 6 | 14.0 | ≈17 | 3.0 |
| Daniel | 7.25 | 1.5 (T-29 a T-31) | 6 | 14.75 | ≈17 | 2.25 |
| Francisco | 6.0 | 3 (T-24 a T-28) | 6 | 15.0 | ≈17 | 2.0 |
| **Total** | **29.25** | **4.5** | **24** | **57.75** | **68** | **10.25** |

Las dos historias quedan dentro del margen de ±20 %. HU-01a pasa de 10 a 11.5 h porque se le agregó RF-01-AC-6 (pantalla «Qué es DAFI»), que no estaba en la estimación original de 5 SP; HU-02 sube 0.75 h por las pruebas negativas y la verificación en celular. En conjunto, el plan pide 29.25 h productivas contra ≈27.7 disponibles (6 % más), así que el colchón del factor de enfoque baja de 30 % a 26 %.

**Ruta crítica.** T-01 → T-04 → T-06 → T-08 → T-09 → T-11 → T-13 → T-20 → T-22 → T-26 (12.25 h de trabajo, pero con cinco cambios de responsable). Cada traspaso entre personas con horarios distintos puede costar un día de calendario.

---

## 4. Riesgos de la descomposición

| Riesgo | Efecto | Qué hacemos |
|---|---|---|
| La carga planeada supera en 4 a 8 % las horas productivas de cada persona | Si el factor de enfoque real es menor a 0.70, alguna tarea de HU-02 no se termina | Si al día 7 HU-01a no está cerrada, el Product Owner y el equipo recortan el alcance de HU-02 (por ejemplo, la edición de perfiles) sin cambiar el goal; T-31 mide las horas reales para el Sprint 2. |
| Ruta crítica larga con cinco traspasos entre personas asíncronas | La integración se acumula al final y T-20 y T-22 quedan para los días 9 y 10 | Acordar los contratos de la API (cuerpo, códigos y mensajes) el día 1 para que T-12, T-13 y T-20 avancen con datos simulados; pull requests pequeños, uno por tarea. |
| Francisco concentra revisión y QA (T-17, T-21, T-22, T-23) y además acepta como Product Owner (T-26) | Pierde independencia la aceptación y él se vuelve cuello de botella en los días 8 a 10 | La aceptación del goal la repite una persona ajena al equipo en la Sprint Review; si Francisco se atrasa, Isaac toma T-23 (no escribió T-18 ni T-20). |
| El `rewrite` de Vercel hacia Render agrega su propio tiempo de espera, y el nivel gratuito de Render tarda en despertar | La primera petición tras la inactividad falla con un error del proxy, no con el contrato de errores | El monitor de T-07 mantiene la API activa; T-16 y T-22 prueban la primera petición tras un periodo sin uso; si persiste, se levanta como impedimento (T-30). |
| La IP del cliente llega a Express a través del proxy de Vercel | Afecta poco al Sprint 1, pero RF-02-AC-3 (bloqueo por IP, HU-01b) depende de leerla bien | T-04 deja configurado `trust proxy` y una prueba que lee `X-Forwarded-For`; se revisa al inicio del Sprint 2. |
| El aviso de privacidad v0 (T-24) o los textos de T-25 llegan tarde | T-10, T-12 y T-14 quedan bloqueadas | Fecha límite día 3 y día 4; los Developers usan un texto provisional con versión `v0-borrador` y solo cambia el contenido, no el código. |
| El aviso de RF-13 en «Qué es DAFI» aún no tiene la revisión médica de RD-05 | La pantalla muestra un texto sin aprobar | Se marca como pendiente de revisión; DAFI no se abre a personas ajenas al equipo hasta tener la revisión (y HU-01b terminada). |
| «Agregar a otro adulto» (RF-04-AC-5) lleva a HU-03, que no existe | La opción queda sin destino y la prueba no sabe qué verificar | T-25 decide el comportamiento provisional antes de que Armando empiece T-20; la prueba verifica que se ofrece la opción y que no se crea el perfil. |
| Borrar un perfil (RF-04-AC-3 exige probar el rechazo) adelanta parte de RF-21 | Un `DELETE` simple hoy puede chocar con el borrado en cascada de HU-17 | En el Sprint 1 el `DELETE` borra solo el documento del perfil (aún no hay conversaciones ni fotos); HU-17 lo reemplaza. |
| No es seguro que el equipo tenga un iPhone y un Android para T-16 y T-22 | La verificación de RNF-03 queda incompleta | Confirmarlo en la Planning; si falta un dispositivo, se usa emulación o una prueba gratuita de un servicio de dispositivos y se deja anotado en el issue. |
| Las pruebas de cliente (RF-01-AC-6, mensajes de RF-01-AC-2 y RF-04-AC-2) requieren un segundo runner en CI | T-02 puede tomar más de 2 h | T-02 configura ambos proyectos desde el inicio; si se pasa, Armando apoya con la parte de `web/` y se registra el desvío en T-31. |
| Primer manejo de contraseñas y datos de menores con un stack nuevo | Una cookie mal configurada o un log con datos sensibles pasa la revisión | T-15 lo prueba de forma automatizada y T-17 lo revisa con lista; solo se usan datos sintéticos durante todo el sprint. |
