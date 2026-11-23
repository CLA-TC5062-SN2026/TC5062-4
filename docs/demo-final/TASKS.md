# Tareas: DAFI demoable

Checklist de trabajo para el plan de [PLAN.md](PLAN.md). Marca `[x]` cuando el PR esté fusionado en `main` **y** Francisco haya pasado la prueba de humo. Todo lo programa el agente y lo revisa Francisco; las tareas marcadas «(Francisco)» son las que solo él puede hacer. Se hacen en el orden en que aparecen.

**Tipos de prueba**

- **Unit:** función aislada, sin red ni base de datos. Backend con `node:test` y `t.mock` (como `backend/test/auth.test.js`); frontend con Vitest sobre funciones puras.
- **Integration:** endpoint real de Express contra una base PostgreSQL de prueba (`dafi_test`), sin navegador. Se verifica código HTTP, cuerpo y lo que quedó en la base.
- **E2E:** Playwright manejando el navegador contra el stack completo con el seed de demo. Cada paso del guion de PLAN.md sección 3 queda cubierto por al menos un e2e.

Los códigos de error siguen el formato del proyecto: `{ codigo, mensaje, correlacionId }`.

---

## 0. Base (lunes, antes de todo lo demás)

### [x] E0. Entorno local de la demo funcionando (Francisco)
- Levantar PostgreSQL en Docker, backend y frontend desde `main` siguiendo el README raíz.
- Hacer login con `maria.ruan@correo.com` y ver `/perfiles`.
- Anotar en LESSONS.md cada paso del README que no funcione tal cual.
- **Terminado cuando:** el paso 1 y 2 del guion funcionan en la máquina de Francisco.

### [x] Q1. Arnés de pruebas de integración del backend
- Script `npm --prefix backend run test:integration` que:
  - usa `TEST_DB_*` (o `DB_NAME=dafi_test`) y **se niega a correr** si el nombre de la base no termina en `_test`;
  - recrea el esquema con `S05_S06_A1/esquema_bd.sql` antes de la suite;
  - levanta `app` en un puerto libre (`app.listen(0)`) y hace peticiones con `fetch`;
  - trae ayudantes: `crearCuidadora()`, `crearMedicaEnCirculo(familiaId)`, `login(correo)`.
- Ubicar las pruebas fuera del patrón por defecto de `node --test` (por ejemplo `backend/integration/*.int.mjs`) para que `npm test` siga corriendo sin base de datos.
- Primera prueba: `POST /auth/login` con credenciales válidas devuelve 200 y token; con contraseña mala, 401.
- Documentar en el README la sección «Pruebas de integración».
- **Terminado cuando:** `npm test` sigue en 12/12 sin base, y `test:integration` pasa con la base de prueba.

### [x] Q2. Playwright para e2e
- `@playwright/test` como devDependency de `frontend/`, script `npm --prefix frontend run e2e`, carpeta `frontend/e2e/`.
- `playwright.config.ts` con `baseURL: http://localhost:3000`, proyecto Chromium y uno móvil (375 × 812).
- Precondición documentada: stack corriendo y `demo:reset` ejecutado.
- Ayudante `entrarComo(page, 'maria' | 'medica')`.
- Primera prueba: login de María con contraseña mala muestra el mensaje del 401 y no navega; con la correcta llega a `/perfiles` y ve 3 tarjetas (paso 1 y 2 del guion).
- **Terminado cuando:** `npm --prefix frontend run e2e` pasa en local.

### [x] Q3. Vitest para lógica del frontend
- `vitest` como devDependency de `frontend/`, script `npm --prefix frontend run test`.
- Primera prueba sobre `mensajeParaUsuario` de `src/services/errores.ts`: 401, 404, 409, 422 y error de red devuelven el texto esperado.
- **Terminado cuando:** `npm --prefix frontend run test` pasa.

---

## 1. Backend

### [x] B1. `GET /familias/{familiaId}/miembros`
- Lista cuidadores y médicos de la familia; filtro opcional `?rol=medico`. Contrato en `openapi_equipo.yaml` línea 502.
- Solo cuidadores de esa familia (403 por rol, 404 si es otra familia), igual que el resto de `authorize.js`.
- **Unit:** validación del parámetro `rol` (valor fuera del enum es 422).
- **Integration:** la cuidadora ve a su médica con `?rol=medico`; lista vacía si no hay médicos; cuidadora de otra familia recibe 404; sin token, 401.
- **E2E:** cubierto por F4 (el selector muestra a la médica).

### [x] B2. `PUT /conversaciones/{id}/preguntas/{preguntaId}/respuesta`
- Guarda o reemplaza la respuesta de una pregunta de contexto según `tipoRespuesta` (opción, texto o número). Contrato en línea 1272.
- Solo en `BORRADOR` (en otro estado, 409 `TRANSICION_INVALIDA`); pregunta que no aplica a las etiquetas de la conversación, 404; valor con tipo equivocado, 422.
- Al guardar, `puntosPendientes` del detalle se actualiza.
- **Unit:** validador de respuesta por tipo (opción fuera de la lista, número fuera de rango, texto vacío).
- **Integration:** guardar y reemplazar respuesta; tras responder todas las obligatorias, `POST /envios` pasa de 422 a 200; respuesta en conversación ya enviada da 409; médica recibe 403.
- **E2E:** cubierto por F5.

### [x] B3. Transición `ENVIADA → EN_REVISION` al abrir la médica
- Cuando la médica asignada hace `GET /conversaciones/{id}` y el estado es `ENVIADA`, pasa a `EN_REVISION` y se registra el evento `cambio_estado` (RF-16-AC-2). Una segunda lectura no crea otro evento.
- La cuidadora que lee no cambia el estado.
- **Unit:** función que decide si hay transición (rol, estado, médico asignado).
- **Integration:** primera lectura de la médica cambia estado y crea 1 evento; segunda lectura no crea otro; lectura de la cuidadora no cambia nada; médica con historial compartido pero no asignada no dispara la transición.
- **E2E:** cubierto por F7 (la tarjeta pasa de «Enviada» a «En revisión»).

### [x] B4. `POST /conversaciones/{id}/indicaciones`
- Solo la médica asignada; desde `EN_REVISION`, `INFO_SOLICITADA` o `CON_INDICACIONES`; deja la conversación en `CON_INDICACIONES` y crea un evento. Contrato en línea 1508 (`IndicacionNueva`). Exige `Idempotency-Key` como `/mensajes`.
- `consulta_presencial` sin `plazoDias` es 422; en `CERRADA` o `BORRADOR`, 409.
- Sin notificaciones por correo (fuera de alcance; anotar la desviación en el PR).
- **Unit:** validador de `IndicacionNueva`.
- **Integration:** indicación válida da 201 y cambia estado; repetir con la misma `Idempotency-Key` devuelve la misma respuesta sin duplicar; cuidadora recibe 403; estado inválido da 409; falta de plazo da 422.
- **E2E:** cubierto por F7 y F6.

### [x] B5. Seed de demo y `demo:reset`
- Script `npm --prefix backend run demo:reset` que **solo corre fuera de producción** y con confirmación si la base no es local, y que:
  - recrea el esquema;
  - crea a María (`maria.ruan@correo.com`) con su familia y 3 perfiles (Mateo, María, Rosa) por la API, como `seed_integracion_demo.mjs`;
  - crea una médica ficticia **activa, con contraseña conocida** y en el círculo de la familia de María;
  - carga etiquetas (`fiebre`, `piel`, `respiratorio`) y 3 o 4 preguntas de contexto para `fiebre` (al menos una obligatoria);
  - deja una conversación histórica ya con indicaciones para que el historial no salga vacío.
- Credenciales en el README (solo locales, datos ficticios).
- **Integration:** correr el seed dos veces seguidas no falla ni duplica datos.
- **E2E:** todas las pruebas e2e parten de este seed.

---

## 2. Frontend

Todas las pantallas: estados de carga, error con «Reintentar» y vacío; errores del backend con `alertarError`; revisar a 375 px.

### [x] F1. Crear cuenta conectada a `POST /auth/register`
- `registrar()` en `services/authService.ts`; la pantalla `crear-cuenta` envía nombre, correo, contraseña, `nombreFamilia`, `declaraciones` y `avisoVersion: 1`, y al terminar deja la sesión iniciada como `login`.
- El botón no se habilita sin las tres declaraciones; botón en estado «Creando…» durante la petición.
- **Unit (Vitest):** validación del formulario (correo inválido, contraseña corta, declaración faltante).
- **E2E:** registro nuevo llega a `/perfiles` vacío; **correo ya registrado muestra el mensaje del 409** (candidato a error de la demo).

### [x] F2. Crear perfil conectado a `crearPerfil`
- `perfiles/nuevo` envía `tipo`, `nombre`, `fechaNacimiento`, alergias, medicamentos, y `correo` si es `adulto_representado`. Un `menor` no muestra «compartir con cocuidador».
- Validación en cliente de requeridos; al terminar, regresa a `/perfiles` con el perfil en la lista.
- **Unit (Vitest):** validación por tipo de perfil (fecha futura, adulto sin correo, nombre vacío).
- **E2E:** crear un perfil y verlo en la lista (pasos 3 y 4 del guion); fecha futura muestra el error de validación sin llegar al backend.
- **Integration (backend, ya existe la regla):** `POST` con fecha futura responde 422; queda como respaldo si el cliente deja pasar algo.

### [x] F3. Detalle de perfil real con editar y borrar
- `perfiles/[perfilId]` deja de usar `datos-demo.ts`: carga con `obtenerPerfil` y el historial con `listarPorPerfil`.
- Editar alergias, medicamentos y nombre con `actualizarPerfil`; borrar con `borrarPerfil` tras `confirmarAccion` y regreso a `/perfiles`.
- Perfil inexistente o de otra familia muestra «Perfil no encontrado», no pantalla en blanco.
- **Unit (Vitest):** construcción del `PATCH` (solo campos cambiados).
- **E2E:** editar y ver el cambio tras recargar; borrar y confirmar que desaparece de la lista; cancelar el borrado no borra; URL con id inventado muestra el mensaje de no encontrado.

### [ ] F4. Nueva conversación
- `perfiles/[perfilId]/conversaciones/nueva`: etiquetas de `GET /etiquetas` (1 a 3), médica de `GET /familias/{id}/miembros?rol=medico` (B1), título y prioridad. Aviso fijo de emergencias visible (`GET /avisos/{codigo}`).
- Al crear, navega al borrador de esa conversación (definir la ruta con id, por ejemplo `/conversaciones/{id}/borrador`; hoy `conversaciones/borrador` no recibe id).
- Sin médicos en el círculo: «Agregue primero a un médico de su confianza».
- **Unit (Vitest):** validación de 1 a 3 etiquetas y médico obligatorio.
- **E2E:** crear conversación para Mateo con «Fiebre» y la médica, y llegar al borrador.

### [ ] F5. Borrador: preguntas de contexto y envío
- Muestra las preguntas del detalle (`GET /conversaciones/{id}`), guarda cada respuesta con B2 y refleja `puntosPendientes`.
- «Enviar» deshabilitado mientras haya pendientes; envía con `enviarConversacion` y `Idempotency-Key` (un UUID por intento de envío, reutilizado si se reintenta).
- **Unit (Vitest):** cálculo de «listo para enviar» a partir de `puntosPendientes`.
- **E2E:** responder todo y enviar; la conversación aparece como «Enviada» en `/conversaciones`.

### [ ] F6. Conversaciones de la cuidadora: lista e hilo
- `/conversaciones` con `listarConversaciones` (estado, perfil, médica, último evento), ordenadas por último evento.
- `/conversaciones/[id]` con detalle y eventos (`listarEventos`): mensajes, cambios de estado e indicaciones; caja para enviar mensaje (`POST /mensajes` con `Idempotency-Key`), deshabilitada en `BORRADOR` y `CERRADA`.
- **E2E:** tras la indicación de la médica, la cuidadora la ve en el hilo y responde con un mensaje (paso 11).

### [ ] F7. Médica: bandeja, detalle e indicaciones
- `/medico/bandeja` con `listarConversaciones`, agrupada por estado (Enviadas, En revisión, Con indicaciones) y ordenada por último evento.
- `/medico/conversaciones/[id]`: contexto del perfil (alergias, medicamentos), respuestas, hilo; formulario de indicación (B4) y caja de mensaje.
- **E2E:** la médica ve la conversación enviada por María; al abrirla queda «En revisión»; registra una indicación y la conversación pasa a «Con indicaciones».

### [ ] F8. Cerrar sesión y revisión de errores transversal
- Botón de salir en `Shell` que usa `cerrarSesion()` y lleva a `/entrar`.
- Recorrer todas las pantallas tocadas y confirmar que 401 lleva a sesión expirada, y 403, 404, 409 y 422 muestran el mensaje del backend.
- **E2E:** salir regresa a `/entrar` y `/perfiles` vuelve a pedir login.

---

## 3. E2E del guion completo

### [ ] Q4. `e2e/demo.spec.ts`
- Un solo test que recorre los pasos 1 a 11 de PLAN.md sección 3 con dos contextos de navegador (María y la médica).
- Se corre antes de cada ensayo y es la condición para congelar código el miércoles.
- **Terminado cuando:** pasa tres veces seguidas después de `demo:reset`.

---

## 4. Documentación y entrega

### [ ] D1. Matriz de trazabilidad actualizada
- Actualizar en `S11_A1/matriz_trazabilidad.md` los RF que cambian de estado (al menos RF-01, RF-04, RF-09, RF-10, RF-12, RF-14, RF-15, RF-16 y RF-18) y enlazar las pruebas nuevas de integración y e2e.

### [ ] D2. README actualizado
- Sección «Aplicación en producción»: declarar que la demo es local y cómo reproducirla.
- Capturas nuevas (bandeja de la médica, hilo con indicaciones, formulario con error).
- Comandos `demo:reset`, `test:integration`, `e2e` y `test` del frontend.
- Integrantes del equipo en «Equipo y documentación».

### [ ] D3. Retrospectiva con ejemplos concretos (el agente redacta, Francisco aporta las anécdotas)
- Agregar ejemplos reales del uso del agente (la priorización del agente PO en S03-A1, el login 401 tratado como sesión caducada en el PR #56, el manejo de errores de bcrypt del PR #60) y lo aprendido en LESSONS.md esta semana.
- Actualizar la sección B con lo que la demo ahora sí muestra.

### [ ] D4. Guion del video (Francisco)
- Texto por segmento con tiempos: problema (30 s), flujos (3 min), decisión técnica (30 s), agente (30 s), qué haríamos diferente (30 s). Quién narra cada parte.
- Ensayo cronometrado; meta 4:45.

### [ ] D5. Grabación y entrega (Francisco; la actividad pide grabarlo en equipo)
- `demo:reset`, consola del navegador sin errores, micrófono probado.
- `S11_A1/demo_proyecto.mp4` o `S11_A1/demo_link.txt`.
- Zip para Canvas con `README.md` y `S11_A1/`.
