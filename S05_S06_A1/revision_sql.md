# Revisión del SQL y del código generados: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S05-S06-A1, Partes 1 y 2.

## 1. Cómo se generó y cómo se revisó el esquema

Le dimos a una sesión de agente el `diagrama_clases_equipo.puml` y el `openapi_equipo.yaml`, con el SRS como referencia de reglas de negocio, y le pedimos un esquema para PostgreSQL 16 con llaves primarias UUID, llaves foráneas según las multiplicidades, restricciones `NOT NULL`, `UNIQUE` y `CHECK`, tipos coherentes con los schemas del OpenAPI e índices en las columnas de búsqueda. Su propuesta, sin cambios, está en `evidencia/esquema_bd_agente.sql`. La versión corregida es `esquema_bd.sql`, con cada corrección marcada como `[R#]` en el código.

La propuesta del agente fue buena en lo estructural. Mapeó las tres jerarquías del diagrama con estrategias distintas y justificadas: una tabla por clase para `Usuario`, porque varias relaciones apuntan a una subclase concreta, y una sola tabla con discriminador para `Evento` y `Reporte`. Llevó las composiciones a `ON DELETE CASCADE`. Y resolvió con índices únicos parciales y triggers diferidos las multiplicidades que un `CHECK` no alcanza, como «exactamente un cuidador principal por familia» o «el médico pertenece al círculo de la familia». Importó sin errores en una base vacía.

La revisamos con las preguntas que pide la actividad:

| Pregunta | Resultado |
|---|---|
| ¿Están todas las entidades del diagrama de clases? | Sí, las 26 tablas cubren todas las clases, las clases de asociación y las jerarquías. Faltaban tablas que el contrato necesita aunque no son del dominio (R1). |
| ¿Están todos los atributos? | Sí. Faltaba la relación entre un mensaje y sus fotos (R3). |
| ¿Las llaves foráneas reflejan bien las relaciones? | Sí, salvo una regla de borrado que contradecía su propio `CHECK` (R6). |
| ¿Los tipos son coherentes con el OpenAPI? | Sí: longitudes (`nombre` y `titulo` de 80, textos de 2000 y 4000), `numeric(3,1)` para la temperatura de 30 a 45 y los valores de los enums tal como viajan por la API. Encontramos dos incoherencias que se corrigieron en el OpenAPI, no en el SQL (R4 y R5). |
| ¿Faltan restricciones que el negocio requiere? | Sobraba una: el máximo de fotos estaba fijo en el código (R2). |

## 2. Correcciones al SQL generado

| # | Qué generó el agente | Qué cambiamos | Por qué |
|---|---|---|---|
| R1 | Sin tablas de sesión, intentos de inicio de sesión, enlaces de un solo uso ni claves de idempotencia. El agente lo justificó en que no estaban en el diagrama de clases. | Agregamos `sesion`, `intento_login`, `enlace_un_uso` y `clave_idempotencia`, y un paquete «Soporte técnico (no dominio)» al diagrama de clases. | Sin ellas no se pueden implementar operaciones que el contrato ya define: cerrar sesión e invalidar el token (RF-02-AC-4, que requiere guardar el `jti`), el bloqueo tras 5 intentos (RF-02-AC-3), un enlace de restablecimiento que no se puede usar dos veces (RF-03-AC-4) y la repetición de una petición sin duplicarla (RF-23-AC-3). |
| R2 | Un trigger que impedía más de 6 fotos por conversación, con el 6 fijo en el código. | Quitamos el trigger; la API valida el máximo con `MAX_FOTOS` del entorno y responde `LIMITE_ALCANZADO`. | El SRS (3.4) define `MAX_FOTOS` como parámetro configurable sin cambiar código. Con el trigger, subir el límite exigía una migración de base de datos. |
| R3 | Un mensaje requería `texto` y no había forma de asociarle fotos. | `texto` opcional en el mensaje y una tabla `mensaje_foto` (y la asociación `Mensaje → Foto : adjuntas` en el diagrama). | `MensajeNuevo` del OpenAPI acepta texto, `fotoIds` o ambos. Con el esquema del agente, RF-14-AC-2 («la familia agrega una foto válida o un mensaje y pulsa Responder») no se podía guardar cuando la respuesta era solo una foto. |
| R4 | `familia.nombre` obligatorio, pero ningún campo del OpenAPI lo alimentaba: `POST /registros` solo pedía el nombre de la persona. | Agregamos `nombreFamilia` opcional a `RegistroFamilia`; si no viene, la API usa «Familia de <nombre>». | La API no podía crear la familia sin inventar el dato, y los médicos que atienden a varias familias filtran la bandeja por ese nombre (RF-16-AC-4). Se corrigió el OpenAPI y no el SQL, porque el nombre sí es obligatorio para el dominio. |
| R5 | La huella de la cita como `char(64)` sin definir la fórmula, porque el diagrama decía `eventoId + inicio + fin` y el OpenAPI `eventoId + texto`. El agente señaló la contradicción. | Corregimos el OpenAPI para que use `eventoId + inicio + fin`, igual que el diagrama. | La cita se ubica por posición dentro del texto seudonimizado (ADR-001), así que el texto que devuelve el modelo no es el original y no sirve como parte de la identidad. |
| R6 | `conversacion.medico_id` con `ON DELETE SET NULL`, mientras un `CHECK` exige médico en los estados `ENVIADA` a `CON_INDICACIONES`. | `ON DELETE RESTRICT`. | Con `SET NULL`, borrar a un médico con conversaciones activas fallaba con un error de `CHECK` difícil de interpretar. Además, a los médicos no se les borra sino que se les desactiva (RF-22-AC-3), y la conversación pasa a `SIN_MEDICO` por la API, como hace el agente con `registro_acceso`. |

### Lo que dejamos como lo propuso el agente

- **Valores de los enums en minúsculas**, como los del OpenAPI, salvo `estado_conversacion`, que el OpenAPI define en mayúsculas. Así la API no traduce valores.
- **Vistas para los atributos derivados** (`/edadAnios`, `/estado` del perfil y `/ultimoEventoEn`), en lugar de guardarlos y arriesgar que se desactualicen.
- **`reporte.reportante_id` nulo** cuando la cuenta ya no existe: es la forma de conservar el reporte para el administrador después de un borrado físico (RNF-07).

## 3. Importación y verificación

Importamos `esquema_bd.sql` en una base vacía de PostgreSQL 16.15 con `psql -v ON_ERROR_STOP=1 -f esquema_bd.sql`. Terminó sin errores y `\dt` muestra **31 tablas**: las 26 del agente, `mensaje_foto` y las cuatro técnicas.

Además corrimos una prueba de humo con siete casos (`evidencia/prueba_esquema.sql`; salida en `evidencia/prueba_esquema_salida.txt`):

| Caso | Esperado | Resultado |
|---|---|---|
| Registro: usuario, familia y cuidador principal en una transacción | Pasa | Pasa |
| Familia sin cuidador principal | Falla al confirmar | Falla: «La familia … no tiene cuidador principal» |
| Perfil, médica del círculo, conversación con etiqueta y mensaje solo con foto (R3) | Pasa | Pasa |
| Un médico sale del círculo (regla adoptada del diagrama de Daniel) | Su permiso de «Compartir historial» se borra | 0 permisos restantes |
| Conversación dirigida a un médico que no está en el círculo | Falla | Falla: «El médico … no pertenece al círculo de la familia del perfil …» |
| Correo duplicado con otras mayúsculas | Falla | Falla por `uq_usuario_correo` |
| Borrar la familia | Borra en cascada perfiles, conversaciones, eventos y la cuenta del cuidador; conserva al médico | 0 cuidadores, 0 perfiles, 0 conversaciones, 0 eventos; los 2 médicos se conservan |

## 4. Archivos que actualizamos por las correcciones

- `openapi_equipo.yaml`: `RegistroFamilia.nombreFamilia` (R4) y la fórmula de `IdCita` (R5).
- `diagrama_clases_equipo.puml`: paquete de soporte técnico (R1), asociación `Mensaje → Foto` (R3) y la nota del máximo de fotos como parámetro (R2).
- **Pendiente fuera de esta carpeta:** la restricción 2.4 del SRS y la tarea T-06 del Sprint 1 todavía dicen MongoDB (ADR-002 en `arquitectura_equipo.md`).

## 5. Correcciones al código generado

Para implementar los servicios de la Parte 2, partimos de una versión inicial generada con Express que permitía iniciar el servidor y comprobar la conexión a PostgreSQL, pero todavía no implementaba los recursos de `openapi_equipo.yaml`. Revisamos esa base contra el contrato del equipo y `esquema_bd.sql`, y realizamos los siguientes ajustes.

| # | Qué tenía la versión inicial | Qué se cambió | Por qué |
|---|---|---|---|
| C1 | Solo había rutas temporales para comprobar que Express y la base de datos funcionaban. | Agregamos las rutas de familias, perfiles, conversaciones y catálogos en `backend/src/routes/`, con métodos y respuestas para las operaciones principales de A1. | Un servidor que solo responde a pruebas de salud no cumple la Parte 2: necesitábamos consultar, crear, actualizar y eliminar información real en PostgreSQL. |
| C2 | No se habían contemplado las relaciones entre varias tablas al guardar una operación. | Agregamos una función de transacciones con `BEGIN`, `COMMIT` y `ROLLBACK` en `backend/src/utils/http.js`. La usamos, por ejemplo, al crear una conversación y asociarle sus etiquetas en `backend/src/routes/conversaciones.js`. | El esquema exige entre una y tres etiquetas por conversación y también valida la relación del médico con la familia. La transacción evita dejar registros incompletos cuando una operación falla. |
| C3 | La conexión inicial no devolvía recursos con los campos definidos por el contrato del API. | En las consultas usamos alias para transformar nombres de SQL como `familia_id` y `fecha_nacimiento` a `familiaId` y `fechaNacimiento`. También consultamos `v_perfil_paciente` para obtener atributos derivados. | Los nombres y tipos de respuesta deben ser coherentes con los schemas del `openapi_equipo.yaml`, sin modificar las columnas del esquema relacional. |
| C4 | No existía un tratamiento general de errores para las peticiones del API. | Agregamos validaciones de UUID, fechas y campos permitidos, así como un manejador de errores en `backend/src/app.js` que responde en JSON con `codigo`, `mensaje` y `correlacionId`. Se contemplan, entre otros, 404 para recursos inexistentes y 422 para datos inválidos. | Para que las peticiones fallidas tengan respuestas HTTP claras y no se expongan mensajes internos de PostgreSQL al cliente. |
| C5 | No se contemplaba el control de cambios sobre los borradores. | El `PATCH` de conversaciones valida que el registro siga en estado `BORRADOR`, incrementa su `version` y admite `If-Match`/`ETag` para detectar una versión desactualizada. | Esto evita aceptar cambios en estados no permitidos y permite detectar conflictos de edición, respetando el diseño establecido para las conversaciones. |

### Pruebas realizadas

Probamos el backend de forma local, conectado a la base `dafi` en PostgreSQL 18.3, utilizando la colección `backend/postman/DAFI_A1.postman_collection.json` y datos ficticios. Se ejecutaron cinco peticiones:

| Prueba | Resultado esperado | Resultado observado |
|---|---|---|
| `POST /api/v1/familias/{familiaId}/perfiles` | 201 y perfil creado | Correcto |
| `GET /api/v1/perfiles/{perfilId}` | 200 y datos previamente guardados | Correcto |
| `PATCH /api/v1/perfiles/{perfilId}` | 200 y perfil actualizado | Correcto |
| `POST /api/v1/perfiles/{perfilId}/conversaciones` | 201 y conversación creada | Correcto |
| `DELETE /api/v1/conversaciones/{conversacionId}` | 204 y conversación eliminada | Correcto |

La consulta GET después del POST permitió verificar que el perfil se guardó en la base de datos. Las respuestas y los códigos se revisaron desde Postman. La evidencia en video corresponde a la Parte 3 de la actividad y se incorpora por separado.

Las pruebas originales de A1 se realizaron con PostgreSQL 18.3 en el entorno de otro integrante. Daniel Ruán verificó posteriormente la importación del mismo esquema en PostgreSQL 16.15 sobre Ubuntu 24.04 WSL, creando correctamente 31 tablas.

### Alcance de esta implementación

Para A1 implementamos los CRUD de las entidades principales y algunas consultas complementarias. **No se implementaron todas las operaciones del OpenAPI ni las funciones completas del SRS.** En particular, la autenticación con JWT, el control de acceso por roles y la identidad real del usuario pertenecen a la siguiente actividad (A2). Mientras tanto, la API sin autenticación se utiliza únicamente en un entorno local con información ficticia y no debe desplegarse públicamente.

## Validación local de importación (octubre de 2026)

La evidencia [importacion_local_daniel.txt](evidencia/importacion_local_daniel.txt) conserva una salida de listado de relaciones de PostgreSQL con **31 tablas** del esquema `public` y sus propietarios. Esta comprobación acredita que esos objetos estaban visibles en la base local después de la preparación; no incluye datos de usuario ni secretos y no sustituye la revisión del SQL, la comprobación de restricciones ni las pruebas funcionales de CRUD. La importación no se repitió durante la inspección de A2.
