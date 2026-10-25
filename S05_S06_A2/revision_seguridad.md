# S05-S06-A2 — Revisión de seguridad del backend

**Estado:** pruebas verificadas en Postman y desde terminal, con resultados reales en la sección 4. La sección 2b documenta dos correcciones de visibilidad hechas en la revisión del pull request.

## 1. Módulo de autenticación

| Comprobación | Evidencia de código | Resultado esperado |
|---|---|---|
| Registro con bcrypt | `backend/src/routes/auth.js:58–61` y `:108–112` | Hash de coste 12 guardado en `usuario.hash_contrasena`, nunca contraseña en texto |
| Respuesta de registro sin contraseña | `backend/src/routes/auth.js:26–55` y `:145–146` | 201 y cuenta pública sin contraseña/hash |
| Login con verificación de contraseña | `backend/src/routes/auth.js:149–159` | 200 si credenciales válidas; 401 si son incorrectas |
| JWT con expiración | `backend/src/routes/auth.js:161–169` | Token HS256 con `exp`, `sub`, `rol`, `familiaId` y `jti` |
| Secret no hardcodeado | `backend/src/server.js:6–11` | `JWT_SECRET` de entorno, longitud mínima comprobada al iniciar |
| `/auth/me` protegido | `backend/src/routes/auth.js:179–183` | 200 solo con Bearer válido |
| Token adulterado o expirado | `backend/src/middleware/authenticate.js:7–22` | 401 |
| Sesión revocada, usuario desactivado o inactividad | `backend/src/middleware/authenticate.js:25–55` | 401 |

## 2. Corrección propia al código del agente (A1 → A2)

**Problema detectado:** el backend de A1 usaba `process.env.DEV_USER_ID` para atribuir a un usuario los mensajes y envíos de conversación. Esto no representa al usuario real: si se desplegara con ese mecanismo, un cliente podría actuar sin autenticarse.

**Qué se cambió:** se agregó middleware que verifica el token y consulta la sesión real de PostgreSQL (`backend/src/middleware/authenticate.js`). En `backend/src/routes/conversaciones.js` las operaciones de envíos y mensajes ahora utilizan `req.auth.id` como autor (buscar ambas ocurrencias). También se agregó autorización por rol y pertenencia al recurso (`backend/src/middleware/authorize.js`).

**Por qué:** el autor ya no puede elegirse mediante una variable de desarrollo. La identidad viene del JWT validado y una sesión activa, lo que permite rechazar accesos sin credenciales (401), por rol incorrecto (403) y a recursos ajenos (404).

## 2b. Correcciones de la revisión del pull request (visibilidad del médico)

En la revisión del PR reproducimos dos casos en los que el médico veía información que, según el SRS, no le corresponde. Los dos pasaban las pruebas de rol porque el rol era correcto; el problema estaba en la regla de visibilidad («Qué puede ver un médico», sección 3.0).

| Problema | Evidencia antes de corregir | Qué se cambió | Por qué |
|---|---|---|---|
| El médico veía los **borradores** de la familia. | La médica listaba y abría (200) una conversación en `BORRADOR` que la familia todavía no enviaba. | `c.estado <> 'BORRADOR'` en el listado del médico (`backend/src/routes/conversaciones.js`, función `list`) y en el detalle (`backend/src/middleware/authorize.js`, función `conversation`); un perfil solo cuenta como visible por conversaciones ya enviadas (función `profile`). | La familia decide cuándo enviar (RF-12); hasta entonces la conversación no está «dirigida» al médico. |
| Un médico **fuera del círculo** seguía viendo todo. | Después de quitarla de `miembro_circulo`, la médica abría la conversación (200) y el perfil (200). | Las mismas tres funciones exigen que el médico siga en `miembro_circulo` de la familia del perfil. | RF-08-AC-3: el médico «deja de ver todas las conversaciones de la familia en su siguiente petición». |

Verificación después de corregir:

| Escenario | Listado del médico | Detalle | Perfil | Eventos |
|---|---|---|---|---|
| Conversación en `BORRADOR` | 0 conversaciones | 404 | 404 | — |
| La misma conversación ya `ENVIADA` | 1 conversación | 200 | 200 | 200 |
| Médico quitado del círculo | 0 conversaciones | 404 | 404 | 404 |

La cuidadora principal sigue viendo su borrador (200).

## 3. Tabla de protección de rutas implementadas en A1

| Método y ruta | ¿Bearer? | Rol permitido | Validación del recurso |
|---|---|---|---|
| POST `/auth/register`, POST `/auth/login` | No | Público | Validación de datos e invitación |
| GET `/auth/me` | Sí | Cualquier usuario activo | Sesión/JWT |
| GET `/salud`, `/etiquetas`, `/avisos/:codigo`, `/health` | No | Público | Catálogos y servicio |
| GET `/familias`, `/familias/:familiaId` | Sí | Cuidador principal, cocuidador, médico | Propia familia o círculo médico |
| GET `/familias/:familiaId/perfiles` | Sí | Cuidador principal, cocuidador | Familia y visibilidad del perfil |
| POST `/familias/:familiaId/perfiles` | Sí | Cuidador principal | Familia propia |
| GET `/perfiles/:perfilId` | Sí | Cuidador principal, cocuidador, médico | Familia, compartición o médico autorizado |
| PATCH/DELETE `/perfiles/:perfilId` | Sí | Cuidador principal | Familia propia |
| GET `/conversaciones`, `/perfiles/:perfilId/conversaciones` | Sí | Cuidador principal, cocuidador, médico | Listados filtrados por familia/médico |
| POST `/perfiles/:perfilId/conversaciones` | Sí | Cuidador principal, cocuidador | Perfil visible y médico en círculo |
| GET `/conversaciones/:conversacionId`, `/eventos` | Sí | Cuidador principal, cocuidador, médico | Familia y autorización médica |
| PATCH/DELETE `/conversaciones/:conversacionId` | Sí | Cuidador principal, cocuidador | Familia propia |
| POST `/conversaciones/:conversacionId/envios` | Sí | Cuidador principal, cocuidador | Familia propia |
| POST `/conversaciones/:conversacionId/mensajes` | Sí | Cuidador principal, cocuidador, médico destinatario | Familia o médico asignado |

**Código:** montaje y orden de rutas en `backend/src/app.js:33–35`; roles y pertenencia en `backend/src/middleware/authorize.js` (todo el archivo).

## 4. Pruebas manuales (capturar resultados REALES)

Estas pruebas deben realizarse con la colección `backend/postman/DAFI_A2.postman_collection.json`, después de ejecutar los scripts de datos ficticios. No completar resultados sin observar las respuestas.

| Prueba | HTTP esperado | HTTP observado | Evidencia |
|---|---:|---|---|
| Registro de cuidador principal | 201 | 201 | Postman (confirmado) |
| Login correcto, JWT visible | 200 | 200 | Postman (confirmado) |
| `/auth/me` con Bearer | 200 | 200 | Postman (confirmado) |
| POST perfil protegido con cuidador principal | 201 | 201 | Postman (confirmado) |
| Mismo POST sin `Authorization` | 401 | 401 | Postman (confirmado) |
| GET `/auth/me` con token modificado | 401 | 401 | Postman (confirmado) |
| POST perfil con token del médico | 403 | 403 | Postman (confirmado) |
| Contraseña incorrecta en `/auth/login` | 401 | 401 | Terminal (`evidencia/pruebas_terminal_salida.txt`) |
| Token expirado (firma válida, `exp` en el pasado) | 401 | 401 | Terminal (`evidencia/pruebas_terminal_salida.txt`) |

### Pruebas desde terminal

Script: `evidencia/pruebas_terminal.sh` (curl), corrido contra la API con los datos ficticios de `backend/scripts`. Salida completa en `evidencia/pruebas_terminal_salida.txt`.

| Caso | Petición | Esperado | Resultado real |
|---|---|---:|---:|
| Sin token | `GET /auth/me` | 401 | 401 |
| Token modificado (un carácter) | `GET /auth/me` | 401 | 401 |
| Token vencido | `GET /auth/me` | 401 | 401 |
| Contraseña incorrecta | `POST /auth/login` | 401 | 401 |
| Ruta CRUD sin token | `POST /familias/{id}/perfiles` | 401 | 401 |
| Token de médico, rol incorrecto | `POST /familias/{id}/perfiles` | 403 | 403 |
| Token de cuidadora principal, rol correcto | `POST /familias/{id}/perfiles` | 201 | 201 |
| Token válido | `GET /auth/me` | 200 | 200 |

## 5. Limitaciones y trabajo fuera de A2

El alcance implementado cubre el módulo JWT y los CRUD previos. No se asegura el resto del SRS: envío de correos, validación de enlaces, rate limit, recuperación de contraseña, flujo completo de invitaciones, desactivación administrativa, cierre de sesión o pruebas automáticas. No se debe presentar como backend listo para producción ni marcar operaciones del OpenAPI todavía no implementadas como protegidas.