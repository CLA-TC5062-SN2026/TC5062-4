# Deuda técnica del backend DAFI — S09-A1

## Alcance de la evaluación

Esta reflexión se basa en inspección estática del backend en `backend/src/`, su `package.json` y la documentación S05-S06-A2 en `main` (`bd27bb9`). En esta aportación se configuró y ejecutó ESLint recomendado; la salida se conserva en [`output_linter.txt`](./output_linter.txt) y su clasificación en [`clasificacion_problemas.md`](./clasificacion_problemas.md). No se inspeccionó `backend/.env`, no se modificó lógica del backend y no se ejecutaron pruebas automatizadas: el backend todavía no tiene suite ni script de test. Las conclusiones son una línea base de revisión, no una medición completa de todas las capas del producto.

## 1. ¿Cuánta deuda técnica tiene el proyecto y cómo medirla?

No es responsable expresar la deuda como una cifra total de horas sin una estimación con el equipo y pruebas que delimiten cada cambio. Esta auditoría sí deja un inventario inicial y verificable:

- **Ocho hallazgos de código:** F-01 a F-08 en [`code_review.md`](./code_review.md): dos errores funcionales, controles de seguridad/contexto de despliegue, manejo de errores y concentración de responsabilidades.
- **Una brecha de aseguramiento:** QA-01, ausencia de suite automatizada de pruebas para `backend/`. Esta aportación sí configura ESLint y el script `lint`, pero la colección Postman proporciona evidencia manual de algunos flujos, no cobertura de regresión automatizada.
- **Sin hallazgos críticos confirmados** para el alcance y uso local documentados. Esto no equivale a certificar seguridad para producción.

Este conteo es el alcance observado de una revisión, no “toda la deuda” del equipo: no incluye evaluación de calidad de base de datos, infraestructura, privacidad legal, frontend, rendimiento con carga ni dependencias mediante auditoría automatizada.

La configuración del linter agrega únicamente dependencias de desarrollo y deja sin cambios las dependencias de producción. ESLint 10 sí requiere Node `^20.19.0 || ^22.13.0 || >=24`, mientras que Next.js 16 declara mínimo `>=20.9.0`; por ello, un integrante que use Node 20.9–20.18 podrá satisfacer el mínimo del frontend, pero no ejecutar este linter. Es una limitación del entorno de desarrollo, no un cambio de runtime del backend, y debe comunicarse al equipo.

### Método de medición propuesto

1. Registrar cada ítem con evidencia, componente, probabilidad e impacto. Calificar ambos de 1 a 5 y priorizar mediante `riesgo = probabilidad × impacto`, distinguiendo riesgo real de deuda de mantenibilidad.
2. En refinamiento, estimar esfuerzo de corrección en puntos u horas del equipo; no sumar estimaciones sin revisión. Registrar coste de demora o “interés”: recurrencia de errores, cambios que requieren edición en varios módulos, incidentes, regresiones y retrabajo.
3. Medir una línea base antes de fijar metas: pruebas automatizadas de flujos críticos, defectos escapados, tiempo de ciclo de cambios, findings por severidad y porcentaje de historias que pasan las verificaciones de CI. La cobertura de líneas sola no demuestra calidad; complementarla con escenarios de autorización y regresión.
4. Mantener una razón de deuda de forma estable, por ejemplo `esfuerzo acordado de remediación / esfuerzo total planificado del sprint`, y observarla por sprint. No asignar una cifra retrospectiva a esta revisión: el equipo aún debe estimar los ítems.
5. Revisar tendencia y riesgo en cada retrospectiva; cerrar un ítem solo cuando exista evidencia (prueba o verificación técnica) y el criterio de aceptación correspondiente esté satisfecho.

### Ejemplos con impacto medible

| Evidencia | Coste/riesgo que genera | Medida para confirmar la mejora |
|---|---|---|
| En [`perfiles.js:118-129`](../backend/src/routes/perfiles.js#L118-L129), `key in columns` acepta propiedades heredadas. | Una entrada como `toString` puede alcanzar la construcción de SQL inválido y convertirse en error 500. | Prueba del PATCH con claves heredadas y desconocidas: respuesta 422, sin error de base de datos. |
| En [`conversaciones.js:551-563`](../backend/src/routes/conversaciones.js#L551-L563), la respuesta fija el rol `cuidador_principal`. | El cliente recibe una atribución inconsistente para cocuidadores u otros roles permitidos. | Pruebas por rol verifican que la respuesta refleje `req.auth.rol`. |
| En [`auth.js:149-177`](../backend/src/routes/auth.js#L149-L177) no hay limitación de intentos; [`app.js:14-15`](../backend/src/app.js#L14-L15) permite cualquier origen CORS. | Riesgo elevado si se expone la API; además de trabajo de respuesta a abuso o configuración errónea. | Pruebas 429, pruebas de origen permitido/denegado y configuración revisada por ambiente. |
| [`conversaciones.js`](../backend/src/routes/conversaciones.js#L1-L580) reúne 580 líneas de rutas, SQL, reglas y transacciones; [`authorize.js:77-131`](../backend/src/middleware/authorize.js#L77-L131) concentra dispatch por regex. | Más superficie que releer y modificar para cada feature; políticas y casos de uso se pueden desincronizar. | Reducir responsabilidades por módulo y probar una matriz de ruta × método × rol; medir regresiones/retrabajo entre iteraciones. |
| [`backend/package.json:7-10`](../backend/package.json#L7-L10) define `start`, `dev` y ahora `lint`, pero no `test`; no hay pruebas automatizadas en `backend/`. | El lint comprueba reglas estáticas, pero los cambios de comportamiento no tienen un gate repetible local/CI; la evidencia manual puede no cubrir los bordes. | Añadir pruebas de autenticación, autorización, entradas límite y transacciones a `npm test`, y ejecutar ambos gates en CI. |

## 2. Deuda intencional e involuntaria

La intención no se puede deducir del código por sí sola. La clasificación separa decisiones explícitas en la documentación de defectos o decisiones sin justificación registrada.

### Intencional o aceptada explícitamente

- **Alcance de prototipo:** [`backend/README_backend_DAFI.md:3-5`](../backend/README_backend_DAFI.md#L3) limita el uso a un entorno académico/local con datos ficticios y advierte que el backend no implementa todo el SRS/OpenAPI. Es deuda de alcance aceptada para la actividad, no una afirmación de que el producto esté listo para producción.
- **CORS y controles de login:** la revisión previa [`S05_S06_A2/revision_seguridad.md:73-83`](../S05_S06_A2/revision_seguridad.md#L73) registra que CORS no restringe origen, que falta limitación de intentos y que hay operaciones del contrato aún no implementadas. El contexto local está documentado; esos controles no deben confundirse con una protección adecuada para desplegar el servicio públicamente.
- **Pruebas manuales:** existen colecciones Postman y evidencias para flujos concretos. Son apropiadas como evidencia de integración de la actividad, pero no equivalen a una suite automatizada. No se encontró una decisión escrita que justifique no automatizar.

### Involuntaria o sin intención documentada

- **Defectos de respuesta/validación:** el falso rol de autor (F-02) y la whitelist vulnerable a propiedades heredadas (F-01) contradicen el contrato esperado; no hay evidencia de que fueran decisiones deliberadas.
- **Acoplamiento y crecimiento de módulos:** el router extenso de conversaciones (F-06) y el dispatcher central de autorizaciones (F-07) aumentan el coste de cambio. El repositorio no documenta que esta forma se haya elegido como arquitectura transitoria con criterio de salida.
- **Observabilidad de excepciones:** convertir cualquier rechazo de bcrypt en credenciales inválidas (F-05) y permitir que un rollback fallido sustituya la excepción original (F-08) hacen más difícil diagnosticar incidentes.
- **Falta de verificación de comportamiento:** no tener tests del backend integrados en `package.json` (QA-01) es una brecha objetiva. El lint agregado en esta aportación verifica reglas estáticas, no la lógica funcional; la razón histórica de no haber pruebas no se puede afirmar desde los archivos inspeccionados.

En las próximas decisiones, una deuda intencional debe registrar motivo, riesgo aceptado, responsable de revisarla y condición de expiración. Si una limitación de prototipo permanece sin revisión al aumentar el alcance, pasa a ser deuda vencida y riesgo de operación.

## 3. Integración de calidad y SOLID en SCRUM

### Refinamiento y planificación

- Refinar historias de backend con casos positivos, negativos y de autorización por rol. Incluir validaciones de entrada, exposición de datos y manejo de errores en los criterios de aceptación.
- Estimar por separado implementación, pruebas y migración/refactorización. Añadir al backlog F-01 y F-02 por impacto funcional; antes de una exposición fuera del entorno local, priorizar el rate limit y CORS acotado.
- Revisar dependencias entre cambios para que la separación de autorización/repositorio no mezcle una refactorización amplia con nuevas reglas de negocio.

### Durante el Sprint

- Agregar pruebas de regresión junto con cada corrección; evitar cerrar una historia que solo pase manualmente un caso feliz.
- Ejecutar `npm run lint` localmente y en CI como gate de PR. Añadir la suite de pruebas automatizadas como gate adicional; todavía no está configurada.
- En revisión de código, pedir evidencia sobre validación de entrada, SQL parametrizado, autorización y datos devueltos; no usar “cumple SOLID” como aprobación genérica.
- Registrar la deuda nueva o aceptada en el backlog con riesgo, esfuerzo estimado, razón y fecha/condición para volver a revisarla.

### Review y retrospectiva

- En Sprint Review, demostrar flujos y pruebas, no solo el endpoint visible. Para cambios de acceso, mostrar al menos un rol permitido y uno rechazado.
- En retrospectiva, revisar regresiones, findings repetidos, duración de ciclo y deuda vencida. Elegir un ítem de deuda para el siguiente sprint cuando su coste de interés supere el coste de corregirlo.
- Evaluar SRP/OCP/ISP/DIP al nivel útil para el cambio: comprobar si una regla nueva obliga a modificar módulos no relacionados, si la política es comprobable y si las dependencias se pueden sustituir en pruebas. LSP se evalúa cuando existan implementaciones sustituibles; no se debe forzar una jerarquía de clases en el diseño funcional actual.

## Cierre

El backend es una base académica con autenticación, autorización y consultas parametrizadas, pero los hallazgos muestran defectos concretos y deuda de mantenibilidad y pruebas. La prioridad es convertir los dos errores observados en regresiones automatizadas y usar las restricciones locales documentadas como una frontera clara: antes de ampliar el despliegue, exigir una configuración CORS explícita, control de intentos y una suite repetible de autorización. Esta evaluación no certifica el backend para producción ni cuantifica deuda que no se haya estimado con el equipo.
