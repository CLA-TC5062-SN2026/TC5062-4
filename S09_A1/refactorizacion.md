# S09-A1 | Refactorización y pruebas de regresión del backend DAFI

## Objetivo y alcance

Se implementaron tres correcciones derivadas de los hallazgos documentados en [`code_review.md`](./code_review.md): F-01, F-02 y F-05. Los cambios buscan corregir defectos concretos sin modificar intencionalmente los contratos HTTP ni incorporar nuevas dependencias. Adicionalmente, se eliminaron dos importaciones sin uso detectadas por ESLint.

## 1. F-01 — Validación de campos permitidos en PATCH de perfiles

**Archivo:** [`backend/src/routes/perfiles.js`](../backend/src/routes/perfiles.js).  
**Hallazgo:** la condición `key in columns` también permite propiedades heredadas del prototipo del objeto, como `constructor` y `toString`. Estas claves podían pasar la validación y producir SQL inválido.

**Antes:**

```js
const keys = Object.keys(body);
assert(
  keys.length > 0 && keys.every((key) => key in columns),
  "Campos de actualización inválidos",
);
```

**Después:**

```js
const keys = Object.keys(body);
const isAllowedField = (key) =>
  Object.prototype.hasOwnProperty.call(columns, key);

assert(
  keys.length > 0 && keys.every(isAllowedField),
  "Campos de actualización inválidos",
);
```

**Justificación:** `hasOwnProperty` limita la validación a las claves declaradas directamente en la lista de campos permitidos. Los nombres no autorizados se rechazan antes de construir o ejecutar una consulta SQL. Se conserva el uso de parámetros para los valores de las consultas.

**Pruebas de regresión:** se verificó que `toString`, `constructor` y `desconocido` se rechazan, y que `nombre` se acepta y construye el `UPDATE` parametrizado esperado. Las consultas se simularon mediante mocks, sin conexión a PostgreSQL.

## 2. F-02 — Rol real del autor en los mensajes

**Archivo:** [`backend/src/routes/conversaciones.js`](../backend/src/routes/conversaciones.js).  
**Hallazgo:** el objeto de respuesta etiquetaba a todos los autores como `cuidador_principal`, aunque el usuario autenticado tuviera otro rol.

**Antes:**

```js
autor: {
  id: author,
  nombre: user.rows[0].nombre,
  rol: "cuidador_principal",
},
```

**Después:**

```js
autor: {
  id: author,
  nombre: user.rows[0].nombre,
  rol: req.auth.rol,
},
```

**Justificación:** la respuesta del mensaje utiliza el rol obtenido del contexto de autenticación, evitando información incorrecta para los consumidores del endpoint.

**Prueba de regresión:** se simuló el envío de un mensaje de un usuario con rol `cocuidador` y se confirmó que `autor.id` y `autor.rol` corresponden al usuario autenticado. Esta prueba utiliza un cliente de base de datos simulado.

## 3. F-05 — Propagación de errores internos de bcrypt

**Archivo:** [`backend/src/routes/auth.js`](../backend/src/routes/auth.js).  
**Hallazgo:** el `.catch(() => false)` convertía cualquier excepción de `bcrypt.compare` en un resultado de contraseña incorrecta, ocultando errores operativos.

**Antes:**

```js
const ok = await bcrypt.compare(body.contrasena, r.rows[0]?.hash_contrasena ?? fakeHash).catch(() => false);
```

**Después:**

```js
const candidateHash = r.rows[0]?.hash_contrasena ?? fakeHash;
const ok = await bcrypt.compare(body.contrasena, candidateHash);
```

**Justificación:** una comparación normal que devuelve `false` sigue produciendo el error de autenticación esperado, mientras que una excepción inesperada se propaga para que la maneje la infraestructura general de errores. Se mantiene el hash de respaldo utilizado cuando no se encuentra un usuario.

**Pruebas de regresión:** se simuló una contraseña incorrecta y se comprobó el error 401. También se simuló una excepción de `bcrypt.compare` y se verificó que se propaga como excepción, sin transformarse en un rechazo de credenciales. Estas pruebas no verifican por sí solas la respuesta HTTP final del middleware global.

## 4. Limpieza de errores de ESLint

A partir de los hallazgos clasificados en [`clasificacion_problemas.md`](./clasificacion_problemas.md), también se retiraron dos importaciones sin uso:

- `pool` en [`backend/src/app.js`](../backend/src/app.js).
- `invalid` en [`backend/src/routes/perfiles.js`](../backend/src/routes/perfiles.js).

No se alteró la lógica asociada a esas importaciones, dado que no se utilizaban.

## 5. Verificación realizada

**Directorio de ejecución:** `backend/`.

**Pruebas automatizadas:**

```bash
node --test tests/refactorizacion.test.js
```

**Resultado observado:** 7 pruebas ejecutadas, 7 aprobadas y 0 fallidas.

| Hallazgo | Caso de prueba | Resultado |
|---|---|---|
| F-01 | Rechazo de `toString` | Aprobado |
| F-01 | Rechazo de `constructor` | Aprobado |
| F-01 | Rechazo de campo desconocido | Aprobado |
| F-01 | Aceptación de `nombre` y construcción de `UPDATE` parametrizado | Aprobado |
| F-02 | Conservación del rol `cocuidador` en la respuesta | Aprobado |
| F-05 | Credenciales incorrectas generan error 401 | Aprobado |
| F-05 | Una excepción de bcrypt se propaga | Aprobado |

**Análisis estático posterior a las correcciones:**

```bash
npm run lint
```

**Resultado observado:** ESLint terminó sin errores ni advertencias.

La evidencia original de ESLint, anterior a estas correcciones, se conserva en [`output_linter.txt`](./output_linter.txt). Esa evidencia corresponde al análisis inicial y no debe confundirse con el estado corregido.

## 6. Alcances y trabajo pendiente

Las pruebas automatizadas ejercitan controladores con dependencias simuladas; no sustituyen pruebas de integración con PostgreSQL ni pruebas end-to-end de la API. Queda pendiente ampliar la cobertura a otros roles autorizados, escenarios de base de datos y comportamiento HTTP completo del middleware global de errores. Los hallazgos F-03, F-04, F-06, F-07 y F-08 continúan como propuestas de mejora en el code review y no forman parte de esta refactorización.

**Conclusión:** se implementaron tres correcciones de defectos documentados, se añadieron pruebas de regresión reproducibles y el análisis estático del backend quedó sin infracciones en la ejecución reportada.