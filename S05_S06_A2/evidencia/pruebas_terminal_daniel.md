# Evidencia de pruebas desde terminal — Daniel Ruán

## Entorno

- Ubuntu 24.04.1 LTS bajo WSL 2; comandos y pruebas ejecutados dentro de Bash.
- Node.js `v24.22.1`; npm `11.19.1`; cliente `psql` `16.15`. El backend se conectó correctamente a PostgreSQL local durante las pruebas.
- Rama: `feature/a2-evidence`.
- Fecha de ejecución: 25 de octubre de 2026, 15:08 (-06:00).
- Base local de pruebas: `dafi`, con datos ficticios. No se usaron datos médicos ni cuentas reales.
- Backend iniciado temporalmente en `localhost:4000` (PID 15323) y detenido al terminar. Se retiró el log temporal. `backend/.env` no se leyó manualmente ni se copió; el proceso del backend lo cargó como parte de su configuración normal. No se imprimieron tokens, contraseñas, hashes ni cabeceras Authorization.
- Las solicitudes HTTP de esta evidencia se ejecutaron con `curl` local. El JWT quedó solo en memoria y se omitió de la salida.

## Resumen

Se ejecutaron 15 solicitudes HTTP con `curl`: **15 coincidieron con el código esperado**. Incluyen registro/login/me, CRUD de perfil y persistencia POST→GET, 401 sin token y con firma adulterada, 403 por rol, password incorrecto, correo duplicado, DELETE y 404 posterior. El rechazo de JWT expirado no se ejecutó; su validación queda comprobada solo estáticamente.

## Casos de prueba

Rutas con UUID sustituidos por `{familiaId}` o `{perfilId}`. Las respuestas se sanitizaron: los identificadores se omiten, y `correo`, token, password y hash no se incluyen.

| ID | Método y ruta | Rol | Esperado | Observado | Respuesta sanitizada | Conclusión |
|---|---|---|---:|---:|---|---|
| T01 | `GET /api/v1/health` | Público | 200 | 200 | `{"status":"ok","message":"DAFI API funcionando"}` | Correcto; `backend/src/app.js`. |
| T02 | `POST /api/v1/auth/register` | Anónimo | 201 | 201 | `{"rol":"cuidador_principal","activo":true,"avisoAceptadoVersion":1}`; sin password/hash. | Correcto; validación, bcryptjs y respuesta pública en `backend/src/routes/auth.js`. |
| T03 | `POST /api/v1/auth/login` | Cuidador principal | 200 | 200 | `{"expiraEnSegundos":1800,"usuario":{"rol":"cuidador_principal"},"pantallaInicio":"perfiles"}`; access token omitido. | Correcto; JWT emitido y expiración devuelta, `backend/src/routes/auth.js`. |
| T04 | `GET /api/v1/auth/me` | Cuidador principal, Bearer válido | 200 | 200 | `{"rol":"cuidador_principal","activo":true}`; sin password/hash. | Correcto; identidad de sesión, `auth.js` y `middleware/authenticate.js`. |
| T05 | `POST /api/v1/familias/{familiaId}/perfiles` | Cuidador principal | 201 | 201 | `{"tipo":"menor","nombre":"Perfil Demo Terminal","alergias":[],"medicamentos":[]}`. | Correcto; `backend/src/routes/perfiles.js`. |
| T06 | `GET /api/v1/perfiles/{perfilId}` | Cuidador principal, Bearer válido | 200 | 200 | Mismo perfil y nombre de T05. | Correcto; `id` y nombre coincidieron, persistencia observada en PostgreSQL. |
| T07 | `PATCH /api/v1/perfiles/{perfilId}` | Cuidador principal, Bearer válido | 200 | 200 | `{"nombre":"Perfil Demo Terminal Actualizado"}`. | Correcto; se observó el nombre actualizado, `perfiles.js`. |
| T08 | `POST /api/v1/familias/{familiaId}/perfiles` | Sin token | 401 | 401 | `{"codigo":"NO_AUTENTICADO","mensaje":"Token ausente, inválido o expirado"}`. | Correcto; `backend/src/middleware/authenticate.js`. |
| T09 | `GET /api/v1/auth/me` | Token con firma adulterada | 401 | 401 | `{"codigo":"NO_AUTENTICADO","mensaje":"Token ausente, inválido o expirado"}`. | Correcto; verificación de firma en `authenticate.js`. |
| T10 | `POST /api/v1/auth/login` | Médico demo | 200 | 200 | `{"usuario":{"rol":"medico"},"pantallaInicio":"bandeja"}`; token omitido. | Correcto; se reutilizó la solicitud demo de preparación de la colección sin mostrar credenciales. |
| T11 | `POST /api/v1/familias/{familiaId}/perfiles` | Médico demo, Bearer válido | 403 | 403 | `{"codigo":"SIN_PERMISOS","mensaje":"Tu rol no tiene permiso para esta operación"}`. | Correcto; `backend/src/middleware/authorize.js`. |
| T12 | `POST /api/v1/auth/login` | Cuidador demo, password incorrecto | 401 | 401 | `{"codigo":"NO_AUTENTICADO","mensaje":"Los datos no coinciden"}`. | Correcto; `auth.js`. |
| T13 | `POST /api/v1/auth/register` | Anónimo, correo ya registrado | 409 | 409 | `{"codigo":"CORREO_REGISTRADO","mensaje":"Ya existe una cuenta con este correo"}`. | Correcto; duplicado comprobado por `auth.js` y la restricción única. |
| T14 | `DELETE /api/v1/perfiles/{perfilId}` | Cuidador principal, Bearer válido | 204 | 204 | Sin cuerpo. | Correcto; se eliminó únicamente el perfil temporal creado por T05, según contrato OpenAPI. |
| T15 | `GET /api/v1/perfiles/{perfilId}` | Cuidador principal, Bearer válido | 404 | 404 | `{"codigo":"NO_ENCONTRADO","mensaje":"Recurso no encontrado"}`. | Correcto; el perfil eliminado dejó de estar disponible. |

## Persistencia

T05 creó el perfil temporal y devolvió 201. T06 consultó el identificador retornado por T05 y obtuvo 200 con el mismo perfil y nombre; la comparación de `id` y `nombre` fue verdadera. T07 actualizó el nombre con `PATCH` y devolvió 200 con el nuevo valor. T14 eliminó solamente ese perfil temporal y T15 confirmó 404. La cuenta y familia ficticias de T02 permanecen en la base local. La ejecución preliminar anterior también creó una cuenta/familia ficticia; ambas permanecen, y no se borraron ni se modificaron los seeds.

## Seguridad

- **401 sin token:** T08, observado 401.
- **401 token adulterado:** T09, observado 401.
- **403 rol incorrecto:** T11, login médico demo 200 en T10 y operación reservada a cuidador principal observada 403.
- **Éxito autenticado:** T04 (`me` 200), T05 (CRUD 201), T06 (GET 200) y T07 (PATCH 200).
- **Password incorrecto:** T12, observado 401.
- **Correo duplicado:** T13, observado 409.
- **JWT expirado:** pendiente de prueba. El middleware usa `jsonwebtoken.verify` y convierte errores de verificación en 401, verificación estática en `backend/src/middleware/authenticate.js:12-22`. No se generó un token expirado ni se alteró configuración/secrets.
- Login devuelve un access token por contrato; se utilizó en memoria y se excluyó de todas las salidas y archivos de evidencia.

## Limitaciones

- No se probó una colección Postman ni se grabó video; esta evidencia es de solicitudes terminales con `curl`.
- No se probó un JWT expirado ni todos los 64 `operationId` de OpenAPI.
- Durante la ejecución preliminar y la ejecución final con curl se crearon dos cuentas/familias ficticias de prueba; sus perfiles temporales se eliminaron y se comprobó 404. Las cuentas/familias permanecen en la base local y no se tocaron los seeds.
- Estos resultados son pruebas funcionales locales, no certificación de despliegue ni de producción.
