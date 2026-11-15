# Deuda técnica del backend DAFI — S09-A1

## Alcance de la evaluación

La reflexión parte de la revisión estática de `backend/src/`, su `package.json` y la documentación de S05-S06-A2 en `main` (`bd27bb9`), más la ejecución de ESLint con las reglas recomendadas ([`output_linter.txt`](./output_linter.txt), clasificada en [`clasificacion_problemas.md`](./clasificacion_problemas.md)). No se abrió `backend/.env`. Cuando se hizo la revisión, el backend no tenía pruebas automatizadas; después, la refactorización de [`refactorizacion.md`](./refactorizacion.md) corrigió F-01, F-02 y F-08 y agregó `npm test`. Este documento ya refleja esos cambios.

## 1. ¿Cuánta deuda técnica tiene el proyecto y cómo medirla?

Todavía no podemos darla en horas, porque falta que el equipo estime cada ítem. Lo que sí deja la auditoría es un inventario que se puede comprobar contra el código:

- **Ocho hallazgos de código:** F-01 a F-08 en [`code_review.md`](./code_review.md). Dos eran errores funcionales (F-01 y F-02); el resto son controles de seguridad pendientes para un despliegue fuera de local, manejo de errores y concentración de responsabilidades. F-01, F-02 y F-08 ya están corregidos.
- **Un hallazgo nuevo, F-09**, que salió durante la refactorización: `GET /eventos` reporta a cualquier cuidador como `cuidador_principal`, aunque sea cocuidador.
- **Una brecha de pruebas:** QA-01. El backend ya tiene `npm test`, pero sólo cubre `utils/http.js`; la colección Postman `DAFI_S09` cubre el PATCH de perfil y los mensajes, y el resto de rutas sigue sin pruebas automatizadas.
- **Ningún hallazgo crítico confirmado** para el uso local y académico que está documentado. Eso no quiere decir que el backend esté listo para producción.

El inventario cubre sólo el backend. No incluye la base de datos, la infraestructura, la privacidad desde el punto de vista legal, el frontend, el rendimiento con carga ni una auditoría automatizada de dependencias.

Hay además una deuda de entorno pequeña: ESLint 10 pide Node `^20.19.0 || ^22.13.0 || >=24`, mientras que Next.js 16 acepta desde `20.9.0`. Quien tenga Node entre 20.9 y 20.18 puede correr el frontend pero no el linter, y conviene avisarlo al equipo.

### Método de medición propuesto

1. Registrar cada ítem con evidencia, componente, probabilidad e impacto. Calificar ambos de 1 a 5 y priorizar con `riesgo = probabilidad × impacto`, separando el riesgo real de la deuda de mantenibilidad.
2. En refinamiento, estimar el esfuerzo de corrección en puntos u horas del equipo, sin sumar estimaciones que nadie revisó. Registrar también el coste de demora o «interés»: errores que se repiten, cambios que obligan a editar varios módulos, incidentes, regresiones y retrabajo.
3. Medir una línea base antes de fijar metas: pruebas automatizadas de flujos críticos, defectos escapados, tiempo de ciclo de cambios, hallazgos por severidad y porcentaje de historias que pasan las verificaciones de CI. La cobertura de líneas por sí sola no demuestra calidad, así que debe ir acompañada de escenarios de autorización y de regresión.
4. Seguir por sprint una razón de deuda estable, por ejemplo `esfuerzo acordado de remediación / esfuerzo total planificado del sprint`.
5. Revisar la tendencia y el riesgo en cada retrospectiva, y cerrar un ítem sólo cuando haya evidencia (una prueba o una verificación técnica) y se cumpla su criterio de aceptación.

### Ejemplos con impacto medible

| Evidencia | Coste o riesgo que genera | Medida para confirmar la mejora |
|---|---|---|
| En [`perfiles.js:118-130`](../backend/src/routes/perfiles.js#L118-L130) (en `bd27bb9`), `key in columns` aceptaba propiedades heredadas. | Una entrada como `toString` llegaba a armar SQL inválido y terminaba en error 500. | **Corregido (R1).** Las peticiones 3 y 4 de `DAFI_S09` responden 422 y no tocan la base. |
| En [`conversaciones.js:555-559`](../backend/src/routes/conversaciones.js#L555-L559) (en `bd27bb9`), la respuesta fijaba el rol `cuidador_principal`. | Una médica que escribía un mensaje aparecía como cuidadora, también en los reintentos con la misma `Idempotency-Key`. | **Corregido (R2).** Las peticiones 8 a 10 de `DAFI_S09` comprueban el rol por usuario. |
| En [`auth.js:149-177`](../backend/src/routes/auth.js#L149-L177) no hay límite de intentos de login, y [`app.js`](../backend/src/app.js) acepta cualquier origen en CORS. | Riesgo alto si la API se expone, más el trabajo de responder a abusos o a una configuración errónea. | Pruebas del 429, pruebas de origen permitido y denegado, y configuración revisada por ambiente. |
| [`conversaciones.js`](../backend/src/routes/conversaciones.js) reúne unas 580 líneas de rutas, SQL, reglas y transacciones, y [`authorize.js:77-131`](../backend/src/middleware/authorize.js#L77-L131) concentra la autorización en un despachador de expresiones regulares. | Cada funcionalidad nueva obliga a releer y modificar mucho código, y las políticas pueden quedar desalineadas con las rutas. | Reducir responsabilidades por módulo, probar una matriz de ruta × método × rol y medir regresiones y retrabajo entre iteraciones. |
| [`backend/package.json`](../backend/package.json) ya tiene `test`, pero las pruebas sólo cubren `utils/http.js`. | Los cambios en autenticación, autorización y conversaciones no tienen una verificación repetible, ni en local ni en CI. | Agregar a `npm test` pruebas de autenticación, autorización, entradas límite y transacciones, y correr `lint` y `test` en CI. |

## 2. Deuda intencional e involuntaria

El código por sí solo no dice qué fue intencional. Separamos lo que el equipo dejó documentado como decisión de lo que no tiene ninguna justificación escrita.

### Intencional o aceptada explícitamente

- **Alcance de prototipo:** [`backend/README_backend_DAFI.md:3-5`](../backend/README_backend_DAFI.md#L3) limita el uso a un entorno académico y local con datos ficticios, y advierte que el backend no implementa todo el SRS ni todo el contrato OpenAPI. Es deuda de alcance aceptada para el curso.
- **CORS y controles de login:** la revisión de seguridad de S05-S06-A2 ([`revision_seguridad.md:73-83`](../S05_S06_A2/revision_seguridad.md#L73)) registra que CORS no restringe el origen, que falta limitar los intentos de login y que hay operaciones del contrato sin implementar. Para uso local es aceptable; para desplegar el servicio en público harían falta ambos controles.
- **Pruebas manuales:** las colecciones Postman y sus evidencias cubren flujos concretos y sirvieron como evidencia de integración en cada actividad, pero no se repiten solas. No hay una decisión escrita que justifique no haber automatizado.

### Involuntaria o sin intención documentada

- **Defectos de respuesta y validación:** el rol de autor falso (F-02) y la lista de campos que aceptaba propiedades heredadas (F-01) contradecían el contrato, y nada indica que fueran decisiones deliberadas. Ambos ya están corregidos.
- **Acoplamiento y crecimiento de módulos:** el router extenso de conversaciones (F-06) y el despachador central de autorización (F-07) encarecen cada cambio. El repositorio no documenta que esa forma se haya elegido como arquitectura transitoria con una condición de salida.
- **Errores difíciles de diagnosticar:** convertir cualquier fallo de bcrypt en «credenciales incorrectas» (F-05) y dejar que un rollback fallido reemplazara la excepción original (F-08, ya corregido) ocultan la causa real de un incidente.
- **Falta de pruebas de comportamiento:** hasta esta auditoría el backend no tenía `npm test` (QA-01). Los archivos no explican por qué, así que no lo clasificamos como decisión.

De aquí en adelante, una deuda intencional debería registrar el motivo, el riesgo aceptado, quién la revisa y cuándo vence. Si una limitación de prototipo sigue sin revisarse cuando crece el alcance, pasa a ser deuda vencida y riesgo de operación.

## 3. Integración de calidad y SOLID en SCRUM

### Refinamiento y planificación

- Refinar las historias de backend con casos positivos, negativos y de autorización por rol, e incluir en los criterios de aceptación la validación de entrada, los datos que se exponen y el manejo de errores.
- Estimar por separado la implementación, las pruebas y la refactorización. Antes de exponer la API fuera de local, priorizar el límite de intentos de login (F-03) y la lista de orígenes de CORS (F-04).
- Revisar las dependencias entre cambios para no mezclar una refactorización amplia (separar autorización o repositorios) con reglas de negocio nuevas.

### Durante el sprint

- Agregar una prueba de regresión con cada corrección, como se hizo con R1 a R3, y no cerrar una historia que sólo se probó a mano en el caso feliz.
- Correr `npm run lint` y `npm test` en local y en CI como requisito para aprobar un PR. Los dos scripts ya existen; falta configurar el CI.
- En la revisión de código, pedir evidencia de validación de entrada, SQL parametrizado, autorización y datos devueltos, en lugar de aprobar con un «cumple SOLID» genérico.
- Registrar la deuda nueva o aceptada en el backlog con riesgo, esfuerzo estimado, motivo y fecha o condición para volver a revisarla.

### Review y retrospectiva

- En la Sprint Review, demostrar los flujos con sus pruebas además del endpoint visible. En cambios de acceso, mostrar al menos un rol permitido y uno rechazado.
- En la retrospectiva, revisar regresiones, hallazgos que se repiten, duración del ciclo y deuda vencida, y llevar un ítem de deuda al siguiente sprint cuando su interés ya cueste más que corregirlo.
- Evaluar SRP, OCP, ISP y DIP en la medida en que afecten al cambio: si una regla nueva obliga a tocar módulos que no tienen relación, si la política se puede probar y si las dependencias se pueden sustituir en pruebas. LSP sólo aplica cuando existan implementaciones intercambiables; no tiene sentido forzar una jerarquía de clases en el diseño actual.
