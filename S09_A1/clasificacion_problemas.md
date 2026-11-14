# Clasificación del análisis estático del backend — S09-A1

## Ejecución y alcance

- **Herramienta:** ESLint 10.14.0 con `@eslint/js` 10.0.1 y `globals` 17.14.0.
- **Configuración:** flat config con `js.configs.recommended`, globals de Node.js y archivos JavaScript/MJS del backend.
- **Comando:** desde `backend/`, `npm run lint` (`eslint src scripts`).
- **Runtime de la ejecución:** Node.js 26.13.1 portátil dentro del repositorio, verificado con el SHA-256 oficial y eliminado tras la ejecución. ESLint 10 requiere Node `^20.19.0 || ^22.13.0 || >=24`; el frontend Next.js 16 declara mínimo Node `>=20.9.0`. El requisito elevado afecta solo a ejecutar este linter, no a las dependencias de producción del backend. El equipo debe usar un runtime compatible para repetirlo.
- **Resultado:** ESLint terminó con código 1 por dos errores de regla `no-unused-vars`; ambos son imports no utilizados. El output completo, incluida la salida del proceso, está en [`output_linter.txt`](./output_linter.txt).

La clasificación de abajo se refiere solamente a los hallazgos que devolvió esta ejecución de ESLint. El conjunto recomendado usado no es un scanner de vulnerabilidades ni prueba la lógica de autorización, privacidad o consultas SQL; por ello, cero hallazgos en una categoría no equivale a certificar que no existan problemas de esa clase. Los hallazgos manuales de code review están documentados por separado en [`code_review.md`](./code_review.md).

## Hallazgos por severidad

| Severidad | Hallazgo | Evidencia | Por qué se clasifica así | Acción sugerida |
|---|---|---|---|---|
| Crítico | Ninguno reportado por ESLint | La salida no contiene reglas de seguridad ni errores de ejecución críticos. | ESLint recomendado no detectó un hallazgo de esta clase; esto no certifica seguridad ni elimina los hallazgos manuales. | No aplica a esta ejecución. Mantener la revisión de seguridad separada del lint. |
| Importante | Ninguno reportado por ESLint | No hay mensajes de rendimiento, mantenibilidad o lógica aparte de los dos imports listados abajo. | Los dos resultados son `no-unused-vars`, no defectos observados de comportamiento o rendimiento. | No aplica a esta ejecución. |
| Menor | Import `pool` sin uso | [`backend/src/app.js:4`](../backend/src/app.js#L4), regla `no-unused-vars`. | El import no participa en el módulo; añade ruido y puede hacer creer que la aplicación usa directamente la conexión desde `app.js`. | Eliminar `import pool from "./config/database.js";` si no existe un uso intencional. |
| Menor | Import `invalid` sin uso | [`backend/src/routes/perfiles.js:5`](../backend/src/routes/perfiles.js#L5), regla `no-unused-vars`. | El símbolo no se referencia en la ruta y aumenta el ruido de lectura. | Eliminar `invalid` de la lista de imports de `../utils/http.js`. |

## Interpretación

La recomendación de ESLint se aplicó sin excepciones para el backend y produjo dos hallazgos concretos de limpieza. No se corrigieron aquí para conservar el output como una fotografía reproducible del código auditado y mantener esta aportación enfocada en análisis y clasificación. Si el equipo acepta los cambios, puede retirar ambos imports y volver a ejecutar `npm run lint`; la salida posterior debe registrarse como una nueva ejecución, no sustituir la evidencia original.

El código de salida 1 significa que el linter encontró infracciones de reglas; no significa que el backend haya fallado al ejecutarse. En esta revisión no se ejecutaron pruebas del backend. La clasificación tampoco incluye los bugs o riesgos identificados manualmente en [`code_review.md`](./code_review.md), porque no fueron emitidos por ESLint.
