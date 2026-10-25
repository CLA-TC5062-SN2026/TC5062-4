# S05-S06-A2 — Revisión de seguridad del backend

**Estado:** implementación preparada; validar ejecutando pruebas y sustituir todas las marcas `[PENDIENTE]` antes de entregar.

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

**Código:** montaje y orden de rutas en `backend/src/app.js:26–30`; roles y pertenencia en `backend/src/middleware/authorize.js:7–131`.

## 4. Pruebas manuales (capturar resultados REALES)

Estas pruebas deben realizarse con la colección `backend/postman/DAFI_A2.postman_collection.json`, después de ejecutar los scripts de datos ficticios. No completar resultados sin observar las respuestas.

| Prueba | HTTP esperado | HTTP observado | Evidencia |
|---|---:|---|---|
| Registro de cuidador principal | 201 | [PENDIENTE] | Postman/captura |
| Login correcto, JWT visible | 200 | [PENDIENTE] | Postman/captura |
| `/auth/me` con Bearer | 200 | [PENDIENTE] | Postman/captura |
| POST perfil protegido con cuidador principal | 201 | [PENDIENTE] | Postman/captura |
| Mismo POST sin `Authorization` | 401 | [PENDIENTE] | Postman/captura |
| GET `/auth/me` con token modificado | 401 | [PENDIENTE] | Postman/captura |
| POST perfil con token del médico | 403 | [PENDIENTE] | Postman/captura |
| Contraseña incorrecta en `/auth/login` | 401 | [PENDIENTE] | Postman/captura |
| Token expirado | 401 | [PENDIENTE] | Prueba con expiración corta |

### Pruebas desde terminal (copiar códigos y resultados obtenidos)

```bash
# Sin token → 401
curl -i http://localhost:4000/api/v1/auth/me

# Tokens de demo obtenidos por login en Postman; NO copiarlos a documentación pública.
# 403 por rol: enviar petición POST /familias/{familiaId}/perfiles con token médico.
```

- **Sin token, resultado real:** [PENDIENTE]
- **Token modificado, resultado real:** [PENDIENTE]
- **Token válido / rol principal, resultado real:** [PENDIENTE]
- **Token médico / rol incorrecto, resultado real:** [PENDIENTE]

## 5. Limitaciones y trabajo fuera de A2

El alcance implementado cubre el módulo JWT y los CRUD previos. No se asegura el resto del SRS: envío de correos, validación de enlaces, rate limit, recuperación de contraseña, flujo completo de invitaciones, desactivación administrativa, cierre de sesión o pruebas automáticas. No se debe presentar como backend listo para producción ni marcar operaciones del OpenAPI todavía no implementadas como protegidas.
