# S05-S06-A2 — Revisión de seguridad del backend

**Estado de esta revisión:** Daniel ejecutó independientemente 15 solicitudes funcionales con `curl` antes de integrar el último arreglo de `origin/main`; las 15 coincidieron con el status esperado. Sus resultados sanitizados están en [evidencia/pruebas_terminal_daniel.md](evidencia/pruebas_terminal_daniel.md). La prueba de token expirado quedó pendiente dentro de esas 15 pruebas. La evidencia separada de `origin/main`/PR #53 sí registra un token expirado con 401 (sección 7); no se atribuye esa prueba a Daniel. Daniel no ejecutó Postman durante esta revisión; la ejecución en Postman quedó grabada en el video [pruebas_auth.mp4](pruebas_auth.mp4), que se entrega junto con este documento.

## 1. Autenticación y exposición de datos

| Comprobación | Evidencia estática | Resultado observado / estado |
|---|---|---|
| Validación del registro | `backend/src/routes/auth.js:13-29, 58-93` valida objeto, nombre, correo, password, consentimientos y aviso; se consulta unicidad y se maneja conflicto. | **Verificado localmente:** registro 201 y duplicado 409 (T02, T13). |
| Hash de password | `auth.js:3, 58-62, 105-115`: `bcryptjs.hash(..., 12)` y persistencia en `hash_contrasena`. | **Verificado estáticamente**; las pruebas no consultaron ni expusieron hashes. |
| Respuesta de registro | `auth.js:31-55, 144-146` construye cuenta pública y responde 201. | **Verificado localmente:** T02 201; comprobación recursiva no encontró claves password/hash. |
| Login y comparación | `auth.js:149-160`; usa `bcrypt.compare`; hash ficticio para comparación ante correo inexistente. | **Verificado localmente:** login correcto 200 (T03, T10), password incorrecto 401 (T12). |
| JWT | `auth.js:161-176`: HS256, `sub`, `rol`, `familiaId`, `jti`, `issuer` y `audience`; registra el `jti` de sesión. | **Verificado estáticamente**; el token real se conservó solo en memoria. |
| Secret y expiración | `backend/src/server.js:5-13` exige `JWT_SECRET` de al menos 32 bytes y `JWT_EXPIRATION`; `auth.js:162-169` aplica expiración al firmar. | **Verificado estáticamente**. No se imprimió ni se copió configuración secreta. |
| `/auth/me` | `auth.js:179-183`, `authenticate.js:7-62`; cuenta pública consultada con identidad de sesión autenticada. | **Verificado localmente:** token válido 200 (T04), sin password/hash; token adulterado 401 (T09). |
| Firma, algoritmo, issuer/audience y expiración | `authenticate.js:12-22` usa `jwt.verify`, fija `HS256`, `issuer`, `audience` y mapea fallos de verificación a 401. | **Verificado localmente:** firma adulterada 401 (T09). **Pendiente de prueba:** token expirado; solo estático. |
| Sesión/usuario activo | `authenticate.js:24-62` consulta sesión, usuario, revocación y actividad; valida rol/familia y establece `req.auth`. | **Verificado estáticamente**; flujo protegido real exitoso en T04-T07. |
| Bearer ausente | `authenticate.js:7-10` exige el formato Bearer. | **Verificado localmente:** CRUD sin token 401 (T08). |
| Roles y 403 | `backend/src/middleware/authorize.js:4-13, 75-132`. Roles derivan del usuario/tipo de cuidador de la base. | **Verificado localmente:** cuidador principal autorizado 201 (T05); médico en operación restringida 403 (T11). |
| Contraseña/hash en `/me` | `auth.js:31-55` selecciona solo campos públicos. | **Verificado localmente:** T04 no devolvió password/hash. |

## 2. Protección de rutas

OpenAPI (`S05_S06_A1/openapi_equipo.yaml:80, 109-120, 173-192, 345, 1957-1963`) declara seguridad Bearer global mediante el esquema `bearerAuth` en `components.securitySchemes` y exime explícitamente registro/login. El montaje real es `backend/src/app.js:32-35`: catálogos y auth primero; `authenticate` y `authorize` delante de routers CRUD.

| Método / ruta | Seguridad OpenAPI | Middleware real | Rol/alcance | Resultado funcional local |
|---|---|---|---|---|
| `GET /api/v1/health` | Público | Sin autenticación (`app.js:28-30`) | Público | 200, T01. |
| `POST /api/v1/auth/register` | `security: []` | Auth router público | Anónimo | 201; respuesta sin password/hash, T02. Duplicado 409, T13. |
| `POST /api/v1/auth/login` | `security: []` | Auth router público | Anónimo | 200 cuidador/médico, password incorrecto 401, T03/T10/T12. |
| `GET /api/v1/auth/me` | Bearer global | `authenticate` explícito (`auth.js:179`) | Cualquier usuario activo | Bearer válido 200 y firma adulterada 401, T04/T09. |
| `GET /api/v1/familias/{familiaId}/perfiles` | Bearer global | `authenticate` + `authorize`, routers tras `app.js:35` | Cuidador principal/cocuidador según visibilidad | Código inspeccionado; no ejecutado como listado en esta tanda. |
| `POST /api/v1/familias/{familiaId}/perfiles` | Bearer global | `authenticate` + `authorize` | Cuidador principal | 201 principal, 401 sin token, 403 médico, T05/T08/T11. |
| `GET /api/v1/perfiles/{perfilId}` | Bearer global | `authenticate` + `authorize` | Principal/cocuidador/médico según recurso | 200 persistido T06; 404 tras DELETE T15. |
| `PATCH /api/v1/perfiles/{perfilId}` | Bearer global | `authenticate` + `authorize` | Cuidador principal | 200 con valor actualizado, T07. |
| `DELETE /api/v1/perfiles/{perfilId}` | Bearer global | `authenticate` + `authorize` | Cuidador principal | 204 para perfil creado por prueba, T14. |
| `GET /api/v1/familias`, `GET /api/v1/familias/{familiaId}` | Bearer global | `authenticate` + `authorize` | Cuidador principal, cocuidador, médico (propia familia o círculo médico) | Revisado en código. |
| `GET /api/v1/conversaciones`, `GET /api/v1/perfiles/{perfilId}/conversaciones` | Bearer global | `authenticate` + `authorize` | Cuidador principal, cocuidador, médico (listado filtrado por familia o círculo) | Médico: 0 borradores y 0 conversaciones fuera del círculo (sección 7). |
| `POST /api/v1/perfiles/{perfilId}/conversaciones` | Bearer global | `authenticate` + `authorize` | Cuidador principal, cocuidador (perfil visible y médico en el círculo) | 201 con token de cuidador (video `pruebas_postman.mp4` de A1). |
| `GET /api/v1/conversaciones/{conversacionId}` y `/eventos` | Bearer global | `authenticate` + `authorize` | Cuidador principal, cocuidador, médico (no borradores; médico en el círculo) | Médico: borrador 404, enviada 200, fuera del círculo 404 (sección 7). |
| `PATCH`/`DELETE /api/v1/conversaciones/{conversacionId}` | Bearer global | `authenticate` + `authorize` | Cuidador principal, cocuidador (familia propia) | DELETE 204 con token de cuidador (video de A1). |
| `POST /api/v1/conversaciones/{conversacionId}/envios` | Bearer global | `authenticate` + `authorize` | Cuidador principal, cocuidador (familia propia) | Revisado en código; autor = `req.auth.id` (sección 3). |
| `POST /api/v1/conversaciones/{conversacionId}/mensajes` | Bearer global | `authenticate` + `authorize` | Cuidador principal, cocuidador, médico destinatario | Revisado en código; autor = `req.auth.id` (sección 3). |

La colección `backend/postman/DAFI_A2.postman_collection.json` contiene register, login, me, POST perfil autorizado/sin token/con médico y token adulterado, además de login médico de preparación. Sus requests/variables se inspeccionaron sin mostrar valores. No se ejecutó la colección ni se verificó su ejecución automatizada en Postman.

## 3. Corrección propia A1→A2

- **Estado original:** en `main`/A1, `backend/src/routes/conversaciones.js:225,297` obtenía el autor desde `process.env.DEV_USER_ID`; una identidad fija de desarrollo no representa al usuario autenticado.
- **Cambio observado en A2:** en `backend/src/routes/conversaciones.js:366,484` los autores pasan a ser `req.auth.id`; la ruta protegida recibe esa identidad después de `authenticate` y `authorize` (`app.js:35`).
- **Riesgo resuelto:** evitar atribuir mensajes/envíos a un usuario fijo de configuración y asociar la acción al usuario autenticado.
- **Resultado:** comparación estática de `main` con A2 confirma el cambio. Las pruebas T04-T07 verifican autenticación y CRUD de perfil, pero **no ejercitan** el autor de mensajes/envíos; esa corrección específica queda con evidencia estática, no funcional.

## 4. Resultados: informe del compañero y pruebas independientes

El documento anterior reportaba siete resultados de Postman atribuidos al integrante (registro 201, login 200, me 200, perfil autorizado 201, sin token 401, token adulterado 401 y médico 403). Se conservan como **reportados por el compañero**. La secuencia principal (registro 201, login 200 con token visible, me 200, perfil autorizado 201, sin token 401 y médico 403) se volvió a ejecutar en Postman y quedó grabada en `pruebas_auth.mp4`.

Independientemente, se ejecutaron con `curl` local los casos equivalentes T02-T11: todos observaron los status esperados. También se probaron health, GET persistente, PATCH, password incorrecto, duplicado, DELETE y 404 posterior. Véase [evidencia/pruebas_terminal_daniel.md](evidencia/pruebas_terminal_daniel.md) para respuestas sanitizadas, objetivos y estados observados.

| Prueba | Esperado | Observado con curl | Estado |
|---|---:|---:|---|
| Register | 201 | 201 | Verificado localmente (T02). |
| Login cuidador | 200 | 200 | Verificado localmente (T03). |
| `/auth/me` válido | 200 | 200 | Verificado localmente (T04). |
| Perfil con rol principal | 201 | 201 | Verificado localmente (T05). |
| CRUD sin token | 401 | 401 | Verificado localmente (T08). |
| Token con firma adulterada | 401 | 401 | Verificado localmente (T09). |
| Médico en POST de perfil | 403 | 403 | Verificado localmente (T10-T11). |
| Password incorrecto | 401 | 401 | Verificado localmente (T12). |
| Correo duplicado | 409 | 409 | Verificado localmente (T13). |
| Token expirado | 401 | 401 | Verificado en la evidencia de terminal del PR #53 (sección 7); no forma parte de las 15 pruebas de Daniel. |

## 5. Errores y límites

- `backend/src/app.js:36-59` produce 404 JSON y maneja errores; JSON sintácticamente inválido se normaliza a 400; los errores 5xx muestran mensaje genérico al cliente y detalle solo al log local. `X-Correlation-Id` se genera antes de los routers (`app.js:16-20`) y se incluye en JSON de error.
- Validación de dominio usa 422 en `backend/src/utils/http.js:9-14`; correo duplicado usa 409 en `auth.js:92-94, 112-115`; autenticar produce 401 y autorización 403.
- **Deuda técnica no bloqueante para el alcance A2 probado:** OpenAPI contiene más operaciones que los routers actuales; no se debe inferir cobertura completa. El contrato describe bloqueo/rate limit de login (respuesta 429), pero no se encontró esa lógica en `auth.js:149-177`. La operación de cierre `DELETE /sesiones/actual` también está en el contrato pero no aparece en el router auth actual.
- `app.js:15` configura `cors()` sin restricción de origen; no exponer en producción. El backend está documentado para uso académico/local con datos ficticios.

## 6. Pendientes explícitos

- Probar rutas de conversación y otros casos de autorización no cubiertos por esta matriz.
- No afirmar que el resto del OpenAPI está implementado; acordar su alcance y documentar divergencias antes de una integración final.

## 7. Integración posterior del PR #53

Las 15 pruebas independientes descritas en las secciones anteriores fueron ejecutadas por Daniel en `feature/a2-evidence` antes de integrar el último arreglo de `origin/main`. No cubren la lectura médica de conversaciones en borrador ni la revocación de acceso al salir del círculo familiar.

Después se integró a `origin/main` el PR #53, incluido el commit `e679610`. El código final contiene correcciones en `backend/src/routes/conversaciones.js` y `backend/src/middleware/authorize.js`:

- El listado para médico excluye conversaciones `BORRADOR` y requiere que el médico siga en `miembro_circulo` (`conversaciones.js:141-150`).
- La comprobación de perfil médico requiere pertenencia actual al círculo y al menos una conversación enviada o permiso explícito de historial (`authorize.js:15-43`).
- El acceso al detalle de conversación rechaza borradores y vuelve a comprobar pertenencia al círculo en cada solicitud (`authorize.js:46-72`).

`S05_S06_A2/evidencia/pruebas_terminal.sh` y `S05_S06_A2/evidencia/pruebas_terminal_salida.txt` provienen del trabajo integrado mediante PR #53. La salida registrada contiene estos resultados:

| Caso del script del PR #53 | HTTP observado |
|---|---:|
| `/auth/me` sin token | 401 |
| `/auth/me` con token modificado | 401 |
| `/auth/me` con token expirado | 401 |
| Login con contraseña incorrecta | 401 |
| POST de perfil sin token | 401 |
| POST de perfil con token médico | 403 |
| POST de perfil con token de cuidadora principal | 201 |
| `/auth/me` con token válido | 200 |

La tabla anterior se atribuye a la evidencia de terminal integrada por PR #53, **no a Daniel**. Daniel no ejecutó ni reclama esos ocho casos adicionales. En particular, el script/salida no ejercitan específicamente la lectura de borradores por médico ni la retirada del médico del círculo; esos dos comportamientos se probaron contra la API durante la revisión del PR #53, con estos resultados:

| Escenario | Listado del médico | Detalle | Perfil | Eventos |
|---|---|---|---|---|
| Conversación en `BORRADOR` | 0 conversaciones | 404 | 404 | — |
| La misma conversación ya `ENVIADA` | 1 conversación | 200 | 200 | 200 |
| Médico quitado del círculo | 0 conversaciones | 404 | 404 | 404 |

La cuidadora principal sigue viendo su borrador (200). La evidencia de PR #53 sí cubre funcionalmente el rechazo de token expirado (401), separado de las 15 pruebas previas de Daniel, donde ese caso permaneció pendiente.
