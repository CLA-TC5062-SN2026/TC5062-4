# Clasificación del análisis estático del backend — S09-A1

## Ejecución y alcance

- **Herramienta:** ESLint 10.14.0 con `@eslint/js` 10.0.1 y `globals` 17.14.0.
- **Configuración:** flat config con `js.configs.recommended`, globals de Node.js y archivos JavaScript/MJS del backend.
- **Comando:** desde `backend/`, `npm run lint` (`eslint src scripts`).
- **Runtime de la ejecución:** Node.js 26.13.1 portátil dentro del repositorio, verificado con el SHA-256 oficial y borrado al terminar. Para repetirlo hace falta Node `^20.19.0 || ^22.13.0 || >=24`, que es lo que pide ESLint 10; las dependencias de producción del backend no cambian.
- **Resultado:** ESLint terminó con código 1 por dos errores de la regla `no-unused-vars`, ambos imports sin uso. La salida completa, con el código de salida, está en [`output_linter.txt`](./output_linter.txt).

La clasificación cubre sólo lo que reportó ESLint. Las reglas recomendadas no buscan vulnerabilidades ni revisan autorización, privacidad o SQL, así que no tener hallazgos críticos aquí no significa que no existan. Los que encontramos revisando el código a mano están en [`code_review.md`](./code_review.md).

## Hallazgos por severidad

| Severidad | Hallazgo | Evidencia | Por qué se clasifica así | Acción sugerida |
|---|---|---|---|---|
| Crítico | Ninguno | La salida no tiene errores que puedan causar bugs o problemas de seguridad. | Ninguna de las dos reglas que saltaron afecta al comportamiento. | No aplica. La revisión de seguridad va aparte, en `code_review.md`. |
| Importante | Ninguno | No hay mensajes de rendimiento, mantenibilidad o lógica aparte de los dos imports de abajo. | Un import sin uso no cambia el comportamiento ni el rendimiento. | No aplica. |
| Menor | Import `pool` sin uso | [`backend/src/app.js:4`](../backend/src/app.js#L4), regla `no-unused-vars`. | El import no participa en el módulo; añade ruido y puede hacer creer que la aplicación usa directamente la conexión desde `app.js`. | Eliminar `import pool from "./config/database.js";` si no existe un uso intencional. |
| Menor | Import `invalid` sin uso | [`backend/src/routes/perfiles.js:5`](../backend/src/routes/perfiles.js#L5), regla `no-unused-vars`. | El símbolo no se referencia en la ruta y aumenta el ruido de lectura. | Eliminar `invalid` de la lista de imports de `../utils/http.js`. |

## Interpretación

Aplicamos las reglas recomendadas sin excepciones y salieron dos hallazgos de limpieza. No se corrigieron en esta ejecución para que `output_linter.txt` siguiera siendo una foto reproducible del código auditado. Se corrigieron después, junto con la refactorización, y la nueva ejecución quedó aparte en [`output_linter_despues.txt`](./output_linter_despues.txt) (0 problemas).

El código de salida 1 sólo indica que el linter encontró infracciones; el backend arranca sin problema. Cuando se hizo esta clasificación el backend no tenía pruebas; `npm test` llegó con la refactorización ([`refactorizacion.md`](./refactorizacion.md)).
