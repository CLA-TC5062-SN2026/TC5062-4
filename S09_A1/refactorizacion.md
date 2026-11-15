# Refactorización guiada del backend DAFI — S09-A1

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S09-A1, Parte 4
**Fecha:** 14 de noviembre de 2026

---

## Qué refactorizamos y por qué esos tres

De los ocho hallazgos de [`code_review.md`](./code_review.md) elegimos los que corrigen un defecto que se puede reproducir y que tocan código del que depende más de una operación:

| Id | Hallazgo | Por qué entra en las tres |
|---|---|---|
| **R1** | F-01, la lista de campos del PATCH de perfil acepta propiedades heredadas | Es un error reproducible: `{"toString":"x"}` devolvía **500** en lugar de 422. |
| **R2** | F-02, el mensaje responde siempre `rol: "cuidador_principal"` | Es un error reproducible: una médica que escribe un mensaje aparece como cuidadora en la respuesta, y esa respuesta queda guardada para los reintentos con la misma `Idempotency-Key`. |
| **R3** | F-08, un `ROLLBACK` fallido oculta la excepción original | Está en `transaction()` de `utils/http.js`, que usan las seis operaciones compuestas del backend (registro, crear perfil, crear y editar conversación, envío y mensaje). Una sola corrección cubre todas. |

`code_review.md` ya recomendaba corregir primero F-01 y F-02. Para la tercera descartamos F-03 (límite de intentos de login) y F-04 (CORS con lista de orígenes) porque exigen una dependencia nueva y una decisión de despliegue que aún no existe, ya que el backend sólo corre en local. F-06 y F-07 (dividir `conversaciones.js` y el despachador de autorización) son las que más ayudarían a la mantenibilidad, pero implican mover cientos de líneas sin pruebas que respalden el cambio, que es el riesgo que registra QA-01. Quedan para cuando las pruebas que empieza este cambio cubran esas rutas. F-05 es la candidata siguiente.

Para cada una le pedimos al agente (Claude Code) que propusiera la refactorización a partir del hallazgo. Abajo se indica qué tomamos de su propuesta y qué cambiamos.

## Cómo se verificó

El backend no tenía pruebas automatizadas, así que antes de tocar el código montamos la verificación y la corrimos sobre `main` (`cb034fb`), con PostgreSQL 16 en Docker, el esquema de S05-S06-A1 y los seeds de demostración.

| Comprobación | Antes (`main`) | Después |
|---|---|---|
| Colección Postman **A2** existente (`DAFI_A2`), con Newman | 8 peticiones · **9/9** aserciones | 8 peticiones · **9/9** aserciones |
| Colección nueva **S09** (`DAFI_S09`), regresión de R1 y R2 | 11 peticiones · **4 de 16 fallan** | 11 peticiones · **16/16** |
| Pruebas unitarias nuevas (`npm test`, `node:test`) | — | **10/10** |
| `npm run lint` | 2 errores `no-unused-vars` | **0 problemas** |

Las cuatro aserciones que fallan antes son las de los defectos: los dos PATCH con claves heredadas (500 en vez de 422) y el rol de la médica. La colección A2 es la suite que ya existía y pasa igual antes y después, que es lo que pide la rúbrica. La colección de A1 no se usó porque es anterior a la autenticación y sus peticiones no envían token.

Las salidas completas están en [`evidencia/`](./evidencia/): `newman_A2_antes.txt`, `newman_A2_despues.txt`, `newman_S09_antes.txt`, `newman_S09_despues.txt`, `npm_test.txt`, `f01_f02_antes_curl.txt` y `f08_antes_despues.txt`. La nueva ejecución de ESLint está en [`output_linter_despues.txt`](./output_linter_despues.txt), sin sustituir a [`output_linter.txt`](./output_linter.txt), como se acordó en `clasificacion_problemas.md`.

Para repetirlo, desde `backend/` y con el backend apuntando a una base con los seeds:

```bash
node scripts/seed_medico_demo.mjs
node scripts/seed_cuidador_demo.mjs
npm test
npm run lint
npx newman run postman/DAFI_S09.postman_collection.json --env-var baseUrl=http://localhost:4000/api/v1
```

`seed_cuidador_demo.mjs` es nuevo: activa con una contraseña local al cuidador ficticio que ya crea `seed_demo.sql`, con el mismo patrón que `seed_medico_demo.mjs`. Hacía falta porque la médica demo sólo pertenece al círculo de esa familia, y sin ella no se puede probar un mensaje de médica.

---

## R1 — Campos permitidos con `Object.hasOwn` (F-01)

**Antes** (`backend/src/routes/perfiles.js:118-130` en `main`):

```js
const columns = {
  nombre: "nombre",
  fechaNacimiento: "fecha_nacimiento",
  // …cuatro campos más
};
const keys = Object.keys(body);
assert(
  keys.length > 0 && keys.every((key) => key in columns),
  "Campos de actualización inválidos",
);
```

**Después** (`backend/src/utils/http.js:42-49` y `backend/src/routes/perfiles.js:21-28, 129`):

```js
// utils/http.js
export function allowedKeys(body, allowed) {
  const keys = Object.keys(body);
  assert(
    keys.length > 0 && keys.every((key) => Object.hasOwn(allowed, key)),
    "Campos de actualización inválidos",
  );
  return keys;
}

// routes/perfiles.js
const COLUMNAS_PERFIL = Object.freeze({ nombre: "nombre", /* … */ });
// …
const keys = allowedKeys(body, COLUMNAS_PERFIL);
```

**Justificación técnica.** El operador `in` busca la propiedad en toda la cadena de prototipos del objeto, no sólo entre sus propiedades propias. `columns` es un objeto literal, así que hereda `toString`, `constructor`, `valueOf` y el resto de `Object.prototype`. La validación aceptaba esas claves, después `columns["toString"]` devolvía una función, y al interpolarla se armaba un `UPDATE perfil_paciente SET function toString() { [native code] } = $1`, que PostgreSQL rechaza. El cliente recibía un 500 por algo que es un error de entrada y le corresponde un 422. El nombre de columna nunca venía del usuario (sólo se elegía mal), así que no había inyección SQL; el fallo estaba en la validación del único sitio donde el backend arma SQL dinámico.

**Qué tomamos del agente y qué cambiamos.** Su propuesta en `code_review.md` era sustituir la comprobación dentro de la ruta por `Object.prototype.hasOwnProperty.call(columns, key)`. Usamos `Object.hasOwn`, que hace lo mismo con menos ruido y existe desde Node 16.9. Además sacamos la comprobación a `allowedKeys()` en `utils/http.js` por dos motivos: se puede probar sin base de datos, y queda disponible para el siguiente PATCH que necesite lista de campos, en vez de que cada ruta vuelva a escribir el `assert`. El mapa de columnas pasó a ser una constante congelada del módulo, porque es configuración y no tenía por qué crearse en cada petición.

**Verificación.** `test/http.test.js` prueba `toString`, `constructor`, `hasOwnProperty`, `valueOf`, `__proto__` (que `JSON.parse` sí crea como propiedad propia), un campo desconocido y un cuerpo vacío, todos con 422. En la colección S09, las peticiones 3 y 4 pasan de 500 a 422 y la 5 confirma que un PATCH válido sigue devolviendo 200 con el nombre actualizado.

## R2 — El rol del autor sale de la sesión (F-02)

**Antes** (`backend/src/routes/conversaciones.js:555-559` en `main`):

```js
autor: {
  id: author,
  nombre: user.rows[0].nombre,
  rol: "cuidador_principal",
},
```

**Después** (`backend/src/routes/conversaciones.js:555-561`):

```js
autor: {
  id: author,
  nombre: user.rows[0].nombre,
  rol: req.auth.rol,
},
```

**Justificación técnica.** El `id` del autor ya salía de `req.auth`, pero el rol estaba escrito a mano. La política de autorización permite escribir mensajes a la médica de la conversación, y con ella el defecto se ve directo: la respuesta del `POST` decía `cuidador_principal` mientras que `GET /eventos`, para el mismo evento, decía `medico`. Además, ese cuerpo se guarda en `clave_idempotencia.cuerpo_respuesta`, así que un reintento con la misma `Idempotency-Key` devolvía otra vez el rol falso. `authenticate.js` recalcula `req.auth.rol` contra la base en cada petición y rechaza el token si no coincide, así que es la fuente más confiable que tiene la ruta.

**Qué tomamos del agente y qué cambiamos.** La corrección es la que propuso el agente, sin cambios. Lo que añadimos fue la prueba: el agente sugería «probar con cada rol que la política autoriza», y eso nos obligó a crear `seed_cuidador_demo.mjs` y la colección S09.

**Verificación.** En la colección S09, la petición 8 (mensaje de la médica) pasa a responder `medico`, la 9 confirma que el cuidador sigue saliendo como `cuidador_principal` y la 10 comprueba que `GET /eventos` devuelve los mismos roles que los `POST`.

## R3 — Un `ROLLBACK` fallido ya no oculta la causa (F-08)

**Antes** (`backend/src/utils/http.js:108-113` en `main`):

```js
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

**Después** (`backend/src/utils/http.js:114-140`):

```js
const client = await pool.connect();
let conexionDanada;
try {
  // BEGIN · callback · COMMIT, sin cambios
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch (rollbackError) {
    conexionDanada = rollbackError;
    console.error("Falló el ROLLBACK de la transacción", {
      errorOriginal: error,
      errorRollback: rollbackError,
    });
  }
  throw error;
} finally {
  client.release(conexionDanada);
}
```

**Justificación técnica.** Si la operación falla (por ejemplo, por una llave única duplicada) y la conexión se cae antes de que el `ROLLBACK` termine, el `await` del rollback lanza su propia excepción y `throw error` nunca se ejecuta. Quien llama recibe «conexión perdida», que es un síntoma, y la causa real desaparece incluso de los registros. Lo comprobamos con un pool falso sobre el código de `main` (`evidencia/f08_antes_despues.txt`): se propagaba el error del rollback, no el original. Como las seis operaciones compuestas pasan por esta función, el diagnóstico de cualquier fallo transaccional dependía de esto.

Ignorar el error del rollback no deja datos a medias (PostgreSQL descarta la transacción si la conexión se pierde), pero sí deja una conexión en estado dudoso: si el `ROLLBACK` falló por otra razón, la conexión podría seguir dentro de la transacción abortada, y el código original la devolvía al pool para la siguiente petición. Por eso, cuando el rollback falla, la conexión se libera con el error (`client.release(conexionDanada)`), y con eso `pg-pool` la descarta y abre otra.

**Qué tomamos del agente y qué cambiamos.** El `try/catch` alrededor del rollback y el registro con ambas causas son la propuesta del agente. Lo que añadimos fue descartar la conexión: su propuesta mantenía `client.release()` sin argumento, y al revisar `pg-pool` (`_release`, que elimina el cliente cuando recibe un error) vimos que eso devolvía al pool justo la conexión que acababa de fallar. También revisamos que la respuesta pública no cambia: el middleware de errores de `app.js` sigue devolviendo el 500 genérico, y los detalles sólo van al registro del servidor.

**Verificación.** Tres pruebas en `test/http.test.js` con un pool falso: el camino feliz confirma con `COMMIT`; un error hace `ROLLBACK` y propaga el error original; y si el `ROLLBACK` también falla, se sigue propagando el original, se registra una vez con ambas causas y la conexión se libera con el error para que el pool la descarte (en el caso normal se libera sin error y vuelve al pool).

---

## Limpieza que acompaña al cambio

- Se quitaron los dos imports sin uso que reportó ESLint (`pool` en `app.js` e `invalid` en `perfiles.js`). `npm run lint` ahora termina con código 0.
- `package.json` gana el script `test` (`node --test`, sin dependencias nuevas) y el script `lint` ahora también revisa `test/`.

## Hallazgo nuevo, fuera de alcance

Al revisar R2 encontramos que `GET /conversaciones/{id}/eventos` (`conversaciones.js:343`) traduce **cualquier** cuidador a `cuidador_principal`, mientras que `authenticate.js` sí distingue `cocuidador`. Después de R2, un mensaje de un cocuidador responde `cocuidador` en el `POST` y `cuidador_principal` en el `GET`. Antes del cambio ambos estaban mal de forma consistente; ahora el `POST` es el correcto. No lo corregimos aquí para no mezclar un cambio de lectura con estas tres refactorizaciones, pero queda registrado como **F-09** para el backlog: la consulta de eventos debería unir `cuidador` y usar la misma expresión de rol que `authenticate.js`, idealmente extraída a un solo sitio.

## Lo que este cambio no cubre

- Las pruebas nuevas cubren `utils/http.js` y, de forma integrada, el PATCH de perfil y los mensajes. El resto de rutas sigue sin pruebas automatizadas (QA-01 continúa abierto, aunque ya existe `npm test` donde agregarlas).
- La colección S09 necesita un backend y una base con los seeds; no corre sola en CI todavía.
- F-03 a F-07 siguen abiertos tal como están en `code_review.md`.
