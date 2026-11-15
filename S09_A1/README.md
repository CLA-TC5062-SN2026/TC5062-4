# S09-A1 | Auditoría de calidad del backend DAFI

## Propósito

Esta carpeta reúne la auditoría de calidad del backend DAFI para la actividad S09-A1. Usamos ESLint porque el backend está escrito en JavaScript, con Node.js y Express.

## Documentos

- [`output_linter.txt`](./output_linter.txt): salida completa de la ejecución de ESLint, incluido su código de salida.
- [`clasificacion_problemas.md`](./clasificacion_problemas.md): clasificación razonada de los hallazgos de ESLint por severidad y límites de ese análisis.
- [`code_review.md`](./code_review.md): revisión del backend con hallazgos referenciados al código, correcciones propuestas y evaluación de los cinco principios SOLID.
- [`deuda_tecnica.md`](./deuda_tecnica.md): línea base de deuda técnica, método de medición, ejemplos del proyecto y propuesta de integración con SCRUM.
- [`refactorizacion.md`](./refactorizacion.md): documentación de las refactorizaciones F-01, F-02 y F-08, junto con la mejora adicional F-05 para el manejo de errores de bcrypt.
- [`output_linter_despues.txt`](./output_linter_despues.txt): ESLint después de la refactorización (0 problemas). No sustituye a la ejecución original.
- [`evidencia/`](./evidencia/): salidas de Newman (colecciones A2 y S09, antes y después), de `npm test` y las reproducciones de F-01, F-02 y F-08 sobre `main`.

## ESLint del backend

La configuración está en [`backend/eslint.config.js`](../backend/eslint.config.js). Usa las reglas recomendadas de `@eslint/js`, globals de Node.js y cubre archivos JavaScript y MJS. Actualmente, el script `lint` de [`backend/package.json`](../backend/package.json) ejecuta `eslint src scripts test`, incluyendo las pruebas automatizadas. Durante el análisis estático inicial, el script únicamente revisaba `src/` y `scripts/`.

Los paquetes de desarrollo fijados en `backend/package.json` y `backend/package-lock.json` para la configuración son:

| Paquete | Versión |
|---|---:|
| `eslint` | `10.14.0` |
| `@eslint/js` | `10.0.1` |
| `globals` | `17.14.0` |

ESLint 10 requiere Node.js `^20.19.0 || ^22.13.0 || >=24` y npm. La ejecución registrada se hizo en WSL con un Node.js 26.13.1 portátil dentro del repositorio (con su checksum verificado), que se borró al terminar; no se instaló Node.js en el sistema.

Para repetir el análisis desde la raíz del clon, con las dependencias exactas del lockfile:

```bash
cd backend
npm ci
npm run lint
```

La ejecución registrada de `npm run lint` analizó `src/` y `scripts/`. Reportó dos errores de la regla `no-unused-vars` (los imports `pool` en `src/app.js` e `invalid` en `src/routes/perfiles.js`), cero advertencias y código de salida 1. La salida completa está guardada en [`output_linter.txt`](./output_linter.txt), y ambos hallazgos están clasificados como menores en [`clasificacion_problemas.md`](./clasificacion_problemas.md). El código 1 sólo indica que ESLint encontró infracciones; el backend arranca sin problema.

Tras la refactorización, el script `lint` también revisa `test/` (`eslint src scripts test`) y termina con código 0; la salida está en [`output_linter_despues.txt`](./output_linter_despues.txt).

## Pruebas

El backend ahora tiene `npm test` (`node --test`, sin dependencias nuevas), con pruebas unitarias en [`backend/test/`](../backend/test/) que no necesitan base de datos. Las pruebas de integración de las refactorizaciones están en la colección [`backend/postman/DAFI_S09.postman_collection.json`](../backend/postman/DAFI_S09.postman_collection.json), que necesita el backend corriendo con los seeds de demostración. Los pasos completos están en [`refactorizacion.md`](./refactorizacion.md#cómo-se-verificó).

## Mejora adicional F-05

Se corrigió el manejo de excepciones de bcrypt en el endpoint de autenticación, evitando que errores internos se interpreten como credenciales incorrectas.

Se incorporaron dos pruebas automatizadas en [`backend/test/auth.test.js`](../backend/test/auth.test.js).

La suite cuenta ahora con 12 pruebas automatizadas.

Para ejecutar las verificaciones desde `backend/`:

```bash
npm test
npm run lint
```

La implementación, justificación técnica y pruebas se encuentran documentadas en [`refactorizacion.md`](./refactorizacion.md).

Las evidencias adicionales están disponibles en `evidencia/npm_test_f05.txt` y `evidencia/lint_f05.txt`.
