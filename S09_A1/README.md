# S09-A1 | Auditoría de calidad del backend DAFI

## Propósito

Esta carpeta reúne la evidencia de auditoría estática y revisión técnica del backend DAFI para la actividad S09-A1. La herramienta se eligió según el stack inspeccionado: el backend está implementado en JavaScript con Node.js y Express, por lo que corresponde ESLint.

## Documentos

- [`output_linter.txt`](./output_linter.txt): salida completa de la ejecución de ESLint, incluido su código de salida.
- [`clasificacion_problemas.md`](./clasificacion_problemas.md): clasificación razonada de los hallazgos de ESLint por severidad y límites de ese análisis.
- [`code_review.md`](./code_review.md): revisión del backend con hallazgos referenciados al código, correcciones propuestas y evaluación de los cinco principios SOLID.
- [`deuda_tecnica.md`](./deuda_tecnica.md): línea base de deuda técnica, método de medición, ejemplos del proyecto y propuesta de integración con SCRUM.

## ESLint del backend

La configuración está en [`backend/eslint.config.js`](../backend/eslint.config.js). Usa las reglas recomendadas de `@eslint/js`, globals de Node.js y cubre archivos JavaScript y MJS. El script `lint` de [`backend/package.json`](../backend/package.json) ejecuta `eslint src scripts`.

Los paquetes de desarrollo fijados en `backend/package.json` y `backend/package-lock.json` para la configuración son:

| Paquete | Versión |
|---|---:|
| `eslint` | `10.14.0` |
| `@eslint/js` | `10.0.1` |
| `globals` | `17.14.0` |

ESLint 10 requiere Node.js `^20.19.0 || ^22.13.0 || >=24` y npm. La ejecución registrada para esta auditoría se realizó en WSL con Node.js 26.13.1 portátil dentro del repositorio; se verificó su checksum y se retiró al terminar. No se instaló Node.js en el sistema.

Desde la raíz del clon, instala las dependencias declaradas usando el lockfile y ejecuta el mismo análisis desde WSL:

```bash
cd backend
npm ci
npm run lint
```

La ejecución registrada de `npm run lint` analizó `src/` y `scripts/`. Reportó dos errores de la regla `no-unused-vars` —los imports `pool` en `src/app.js` e `invalid` en `src/routes/perfiles.js`—, cero advertencias y código de salida 1. La salida completa está guardada en [`output_linter.txt`](./output_linter.txt), y ambos hallazgos están clasificados como menores en [`clasificacion_problemas.md`](./clasificacion_problemas.md). El código 1 indica que ESLint encontró infracciones de reglas; no representa un error al iniciar el backend.
