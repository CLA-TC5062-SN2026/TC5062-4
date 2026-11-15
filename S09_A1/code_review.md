# Code review del backend DAFI — S09-A1

## Alcance y método

Revisión estática del backend Node.js/Express con PostgreSQL en `backend/src/`, de `backend/package.json` y de la documentación que fija los límites del servicio, sobre `bd27bb9` (`main` el 12 de noviembre de 2026). Las líneas citadas corresponden a esa versión. La revisión vino acompañada de ESLint con las reglas recomendadas, ejecutado sobre `src/` y `scripts/` ([`output_linter.txt`](./output_linter.txt), clasificado en [`clasificacion_problemas.md`](./clasificacion_problemas.md)). La revisión en sí no cambió lógica de negocio; las correcciones de F-01, F-02 y F-08 se hicieron después y están en [`refactorizacion.md`](./refactorizacion.md).

Elegimos como foco [`backend/src/routes/conversaciones.js`](../backend/src/routes/conversaciones.js) porque es el archivo con la lógica más compleja: unas 580 líneas de rutas, SQL, reglas de dominio, transacciones e idempotencia. Los módulos relacionados se revisaron cuando hacía falta comprobar contratos, autorización o manejo de errores.

Cuando se hizo la revisión no había pruebas automatizadas en `backend/`, así que no se corrió ninguna. Las colecciones Postman de S05-S06-A2 son evidencia manual y no reemplazan una suite automatizada. No se abrió `backend/.env`. El entorno con el que se corrió ESLint está descrito en el [`README.md`](./README.md).

### Resumen ejecutivo

Encontramos ocho hallazgos de código y una brecha de verificación. Ninguno es crítico confirmado para el uso local y académico que está documentado. Dos son errores funcionales, que después reprodujimos contra el API: el PATCH de perfil acepta como campos permitidos propiedades heredadas del prototipo y puede armar SQL inválido, y el endpoint de mensajes responde siempre que el autor es cuidador principal. Antes de exponer la API fuera de local también hay que reforzar dos controles: el límite de intentos de login y la lista de orígenes permitidos en CORS.

Las consultas revisadas usan parámetros (`$1`, `$2`, etc.) y no interpolan valores del usuario. El SQL dinámico de `perfiles.js` necesita la corrección de F-01, pero lo que falla ahí es la validación del nombre de columna (que termina en 500); no encontramos una inyección SQL.

## Hallazgos

### F-01 — La whitelist de campos del PATCH acepta propiedades heredadas

**Severidad:** Importante (bug y manejo incorrecto de entrada).
**Ubicación:** [`backend/src/routes/perfiles.js:118-129`](../backend/src/routes/perfiles.js#L118-L129).
**Estado:** corregido en R1 ([`refactorizacion.md`](./refactorizacion.md)).

`columns` es un objeto normal y la comprobación `key in columns` consulta también su cadena de prototipos. Una petición JSON con una clave como `toString` o `constructor` puede pasar la validación; luego `columns[key]` no corresponde a una columna admitida y se genera una sentencia SQL inválida. El cliente recibe un error interno en vez de un 422. La consulta parametriza valores, así que este hallazgo no demuestra inyección SQL.

**Corrección propuesta:**

```js
const keys = Object.keys(body);
const isAllowedField = (key) =>
  Object.prototype.hasOwnProperty.call(columns, key);

assert(
  keys.length > 0 && keys.every(isAllowedField),
  "Campos de actualización inválidos",
);
```

También se puede crear `columns` con `Object.create(null)`. Añadir una prueba de regresión para `toString`, `constructor`, campos desconocidos y campos válidos; las entradas no admitidas deben terminar en 422 sin consultar SQL.

### F-02 — La respuesta de un mensaje etiqueta incorrectamente al autor

**Severidad:** Importante (consistencia funcional de la respuesta).
**Ubicación:** [`backend/src/routes/conversaciones.js:547-563`](../backend/src/routes/conversaciones.js#L547-L563).
**Estado:** corregido en R2 ([`refactorizacion.md`](./refactorizacion.md)).

La respuesta construida en `value.autor` fija `rol: "cuidador_principal"`, aunque el middleware de autenticación ya deja el rol real en `req.auth.rol`. Un cocuidador, o la médica de la conversación (a quien la política también deja escribir), recibe una respuesta con un rol que no es el suyo. `autor_id` se guarda bien, pero quien consuma el endpoint puede mostrar o procesar una atribución falsa.

**Corrección propuesta:**

```js
autor: {
  id: author,
  nombre: user.rows[0].nombre,
  rol: req.auth.rol,
},
```

Probar el endpoint con cada rol que la política autoriza y verificar que el cuerpo de respuesta represente el rol autenticado.

### F-03 — Login sin limitación de intentos

**Severidad:** Importante en seguridad; el riesgo aumenta si la API se expone a una red no confiable.
**Ubicación:** [`backend/src/routes/auth.js:149-177`](../backend/src/routes/auth.js#L149-L177), especialmente la consulta y `bcrypt.compare` en 153-157.

Cada intento llega a una comparación bcrypt con coste 12 y el código no limita frecuencia, origen ni intentos consecutivos. Esto facilita la fuerza bruta y el consumo de CPU. La documentación de S05-S06-A2 ya registra esta limitación, y como el backend sólo corre en local, no lo tratamos como un defecto explotable hoy.

**Corrección propuesta (requiere incorporar una dependencia y escoger un almacén adecuado):**

```js
import { rateLimit } from "express-rate-limit";

const limitLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/auth/login", limitLogin, async (req, res) => {
  // Mantener aquí el flujo actual de validación y autenticación.
});
```

Para más de una instancia, sustituir el almacén en memoria por uno compartido y documentar la política de desbloqueo. Conservar respuestas genéricas para credenciales incorrectas y probar el 429, el reinicio de ventana y que el límite no permita enumerar cuentas.

### F-04 — CORS acepta cualquier origen

**Severidad:** Importante como configuración de despliegue; no sustituye ni elude la autenticación.
**Ubicación:** [`backend/src/app.js:14-15`](../backend/src/app.js#L14-L15).

`cors()` utiliza el comportamiento predeterminado sin allowlist. La documentación del backend lo restringe a uso local y la revisión de seguridad previa advierte que no debe exponerse así. En una aplicación web desplegada, la política debería expresar explícitamente qué orígenes están autorizados y variar por ambiente.

**Corrección propuesta:**

```js
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || allowedOrigins.has(origin));
    },
  }),
);
```

No habilitar `credentials` salvo que el diseño adopte cookies y controles CSRF. Probar orígenes permitidos, origen no permitido y solicitudes sin `Origin`.

### F-05 — El error de bcrypt se convierte silenciosamente en credenciales incorrectas

**Severidad:** Importante (diagnóstico y disponibilidad).
**Ubicación:** [`backend/src/routes/auth.js:153-157`](../backend/src/routes/auth.js#L153-L157).

El `.catch(() => false)` trata cualquier rechazo de `bcrypt.compare` como si la contraseña no coincidiera. Un error de ejecución o un hash corrupto termina como un 401, y no hay forma de distinguir un fallo de autenticación de un fallo interno. La respuesta genérica sí conviene, porque no revela si una cuenta existe; lo que sobra es tragarse cualquier excepción.

**Corrección propuesta:**

```js
const candidateHash = r.rows[0]?.hash_contrasena ?? fakeHash;
const ok = await bcrypt.compare(body.contrasena, candidateHash);
if (!r.rowCount || !ok) throw badCredentials();
```

Dejar que un error inesperado llegue al middleware de errores, que ya responde con mensaje genérico y registra el error interno. Añadir una prueba que distinga credenciales erróneas de una falla simulada de bcrypt sin devolver detalles internos al cliente.

### F-06 — `conversaciones.js` concentra demasiadas responsabilidades y repite flujo

**Severidad:** Importante (mantenibilidad y probabilidad de regresión).
**Ubicación:** [`backend/src/routes/conversaciones.js:1-580`](../backend/src/routes/conversaciones.js#L1-L580).

El módulo define SQL de lectura, mapeo de DTOs, validación de dominio, manejo HTTP, transacciones, etiquetas, idempotencia, envío de conversaciones y mensajes. Además, el flujo de reserva/consulta/replay de claves de idempotencia aparece en dos operaciones: envío (`377-397`) y mensaje (`489-510`). Un cambio en persistencia o contrato obliga a editar y volver a revisar una ruta extensa.

**Refactor propuesto (separación por responsabilidad, sin cambiar el contrato HTTP):**

```js
// En la ruta: validar transporte y delegar el caso de uso.
const result = await conversationService.sendMessage({
  conversationId: uuidOr404(req.params.conversacionId),
  actor: req.auth,
  body: requireObject(req.body),
  idempotencyKey: req.get("Idempotency-Key"),
});
res.status(result.status).json(result.value);
```

Mover las reglas de envío e idempotencia a servicios de aplicación y las consultas a un repositorio acotado. Mantener el router como adaptador HTTP; probar los casos de uso con dependencias sustituibles y conservar pruebas de integración para SQL, transacciones e idempotencia.

### F-07 — La autorización depende de un dispatcher central basado en expresiones regulares

**Severidad:** Importante (mantenibilidad y riesgo de omitir reglas al ampliar rutas).
**Ubicación:** [`backend/src/middleware/authorize.js:77-131`](../backend/src/middleware/authorize.js#L77-L131).

`authorize` decide el permiso mediante combinaciones de `req.path`, método HTTP, regex, rol y consultas de pertenencia. Incorporar o renombrar una ruta exige modificar este dispatcher central además del router; una discrepancia puede dejar la operación denegada por defecto o asociada a una rama de política inesperada. La política tampoco queda visible junto a la definición de la ruta.

**Refactor propuesto:**

```js
router.get(
  "/perfiles/:perfilId",
  authenticate,
  requireRoles("cuidador_principal", "cocuidador", "medico"),
  authorizeProfileRead,
  getProfile,
);
```

Separar checks reutilizables de rol, familia y recurso, y declarar en cada ruta qué checks aplica. Eliminar el dispatcher global solo cuando todas las rutas estén migradas. Probar una matriz endpoint × método × rol y conservar 404 para recursos fuera del ámbito cuando esa política evita enumeración.

### F-08 — El rollback fallido puede ocultar la excepción original

**Severidad:** Menor (diagnóstico de fallos de base de datos).
**Ubicación:** [`backend/src/utils/http.js:101-113`](../backend/src/utils/http.js#L101-L113).
**Estado:** corregido en R3 ([`refactorizacion.md`](./refactorizacion.md)).

Si la operación transaccional falla y `ROLLBACK` también rechaza, la excepción del rollback reemplaza la original al salir del `catch`. Se pierde la causa que abortó la transacción, y el incidente queda más difícil de diagnosticar.

**Corrección propuesta:**

```js
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch (rollbackError) {
    console.error("Falló el rollback de la transacción", {
      errorOriginal: error,
      errorRollback: rollbackError,
    });
  }
  throw error;
}
```

Mantener los detalles en logs internos; la respuesta pública debe seguir siendo la genérica del middleware. Añadir una prueba con rollback que falla y comprobar que la excepción original sigue siendo la propagada.

### QA-01 — No hay suite automatizada de pruebas para el backend

**Severidad:** Importante como deuda de verificación, no como bug funcional demostrado.
**Ubicación:** [`backend/package.json:7-10`](../backend/package.json#L7-L10); inventario del directorio `backend/`.

En la base revisada, los scripts eran `start` y `dev`. La auditoría agregó `lint`, pero no había script de pruebas ni archivos `*.test.js` o `*.spec.js` en `backend/`. Las colecciones Postman cubren a mano algunos flujos, sin una regresión repetible para el despachador de autorización, las rutas de conversación o las entradas inválidas.

**Corrección propuesta:**

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "lint": "eslint src scripts",
    "test": "node --test"
  }
}
```

La refactorización ya agregó `npm test` con `node:test` y las primeras pruebas (sobre `utils/http.js`), más la colección Postman `DAFI_S09` para el PATCH de perfil y los mensajes. QA-01 sigue abierto: falta cubrir el resto de rutas por orden de riesgo y correr `npm test` y `npm run lint` en CI.

## Evaluación SOLID

| Principio | ¿Se respeta? | Ejemplo en el código | Propuesta de corrección |
|---|---|---|---|
| **Single Responsibility (SRP)** | Parcialmente | Los recursos tienen routers separados (`routes/auth.js`, `perfiles.js`, `conversaciones.js`), pero [`conversaciones.js:38-139`](../backend/src/routes/conversaciones.js#L38-L139) combina consulta, mapeo y reglas; el resto del archivo agrega endpoints, transacciones e idempotencia. | Extraer casos de uso de conversación y repositorios; dejar validación HTTP/serialización en las rutas. |
| **Open/Closed (OCP)** | Parcialmente | [`authorize.js:77-131`](../backend/src/middleware/authorize.js#L77-L131) requiere editar una cadena de rutas/métodos/regex para cada operación nueva o modificada. | Componer middleware de política junto a cada ruta y reutilizar funciones pequeñas por rol, familia y recurso. |
| **Liskov Substitution (LSP)** | Sí, no se observa una violación; aplicabilidad limitada | [`authenticate.js:7-63`](../backend/src/middleware/authenticate.js#L7-L63) y [`authorize.js:77-131`](../backend/src/middleware/authorize.js#L77-L131) son funciones de middleware, no subclases; el código revisado no contiene jerarquías que incumplan sustitución. | No introducir herencia artificial. Si se incorporan adaptadores de almacenamiento o políticas intercambiables, definir contratos observables y ejecutar las mismas pruebas de contrato para cada implementación. |
| **Interface Segregation (ISP)** | Parcialmente | Los routers se separan por recurso, pero cada ruta accede directamente al objeto amplio de `pg.Pool` (por ejemplo, [`perfiles.js:3, 28-29`](../backend/src/routes/perfiles.js#L28-L29) y [`conversaciones.js:3, 38-77`](../backend/src/routes/conversaciones.js#L38-L77)). | Exponer funciones de repositorio pequeñas por caso de uso; los consumidores no deben depender de una interfaz SQL más amplia de la que necesitan. En JavaScript esto puede expresarse como módulos/funciones, sin agregar interfaces decorativas. |
| **Dependency Inversion (DIP)** | No, en la capa de aplicación actual | Los routers y middleware importan el singleton concreto `pool` de `pg` (por ejemplo, [`auth.js:5`](../backend/src/routes/auth.js#L5), [`authorize.js:1`](../backend/src/middleware/authorize.js#L1)). Reglas de negocio y acceso a PostgreSQL quedan acoplados. | Crear fábricas de router/casos de uso que reciban repositorios o puertos mínimos; componer el `pg.Pool` real en el punto de arranque y usar dobles en pruebas unitarias. |

## Fortalezas observadas

- Las consultas de datos usan parámetros de `pg`; no se observó concatenación de valores proporcionados por el usuario en SQL.
- Se centralizan errores HTTP y la respuesta de errores 5xx no expone el mensaje interno (`app.js:40-59`).
- El servidor exige un `JWT_SECRET` de al menos 32 bytes y una expiración configurada (`server.js:5-13`); el middleware fija algoritmo, issuer y audience (`authenticate.js:12-22`).
- Se usan transacciones para operaciones compuestas y bcrypt para contraseñas (`utils/http.js:101-114`, `auth.js:61`).
- La documentación declara uso local con datos ficticios y advierte que la API no está lista para exposición pública (`backend/README_backend_DAFI.md:3-5,112-118`).

## Siguiente paso

F-01, F-02 y F-08 ya están corregidos, con pruebas ([`refactorizacion.md`](./refactorizacion.md)). Antes de usar la API fuera de local faltan F-03 y F-04. F-06 y F-07 conviene atacarlos cuando haya pruebas de autorización y de las rutas de conversación que respalden el cambio.
