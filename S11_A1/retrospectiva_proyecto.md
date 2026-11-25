# Retrospectiva del proyecto DAFI

Con base en el código, los PR y las lecciones registradas, esta retrospectiva separa lo que la demo muestra de lo que sigue pendiente.

## A. Proceso de trabajo

### ¿Qué salió bien?

- En la semana de la demo, una rama y un PR por tarea de [TASKS.md](../docs/demo-final/TASKS.md) mantuvo los cambios chicos: entre el 22 y el 24 de noviembre se fusionaron 23 PR (#62 a #84).
- Las lecciones se anotaron el mismo día en [LESSONS.md](../docs/demo-final/LESSONS.md) y varias se volvieron reglas de prueba o de grabación.

### ¿Qué no salió bien?

- La integración llegó tarde: después del PR #56 solo `/perfiles` usaba datos reales, y la conversación se conectó en la última semana.
- El build del frontend que PLAN.md pedía antes de cada PR no se corrió en los PR #76, #77, #79 y #82 (chocaba con el servidor de desarrollo); se comprobó en `main` hasta el 24 de noviembre.
- Las e2e dependen del estado de la base y exigen `demo:reset` entre corridas (L-31).

### ¿Qué haríamos diferente?

Conectaríamos una pantalla al backend con su e2e desde el primer sprint, en lugar de construir las vistas con datos de muestra y conectarlas al final. Montaríamos las pruebas de integración antes de S09, cuando el backend no tenía ninguna ([code_review.md](../S09_A1/code_review.md)). También revisaríamos cada pantalla con captura a 375 px además de la e2e (L-26).

> **[PENDIENTE Francisco]** Si repitieras esta semana, ¿qué cambiarías en tu forma de revisar y fusionar los PR del agente?

### ¿En qué fases fueron útiles los agentes?

Antes de S11 los agentes produjeron primeras versiones del esquema, del backend y de los componentes, y localizaron hallazgos de código; en la semana de la demo escribieron el código, las pruebas y los borradores de documentación ([PLAN.md](../docs/demo-final/PLAN.md), sección 6).

**Priorización del agente PO (S03-A1).** Un agente independiente priorizó las 18 historias sin ver nuestro orden. Coincidió en las ocho primeras y bajó el resumen de contexto a Media porque al principio no hay historial que resumir. Mantuvimos HU-13 en Alta, condicionamos HU-14 a una prueba técnica y adoptamos su argumento sobre eliminación de datos como regla de liberación ([priorizacion_comparada.md](../S03_A1/priorizacion_comparada.md), [respuesta del agente](../S03_A1/evidencia/priorizacion_agente_PO.md), [ajustes_backlog.md](../S03_A1/ajustes_backlog.md)). El resumen que defendimos como Alta no se construyó.

> **[PENDIENTE Francisco]** De las diferencias con el agente PO, ¿cuál te hizo cambiar de opinión y cuál sostuviste contra su propuesta?

**Login fallido tratado como sesión caducada (PR #56).** El backend responde `401 NO_AUTENTICADO` a una contraseña incorrecta y a una sesión revocada, y el interceptor de 401 mandaba ambas a «sesión expirada». Ahora el interceptor ignora las peticiones públicas y `/entrar` muestra su propio mensaje (L-10); ese error es el paso 1 del guion.

**Errores de bcrypt (PR #60).** El hallazgo F-05 de la revisión de código señaló que el login convertía cualquier excepción de bcrypt en «credenciales incorrectas». El PR quitó esa captura, conservó el hash de respaldo y agregó dos pruebas con mocks ([refactorizacion.md](../S09_A1/refactorizacion.md)).

**Lo aprendido en la semana de la demo** ([LESSONS.md](../docs/demo-final/LESSONS.md)):

- L-26: a 375 px, el error de «Crear cuenta» quedaba tapado por la cabecera fija y la e2e pasaba igual. Una captura lo detectó y el error se movió junto al botón.
- L-39: un subagente no pudo levantar los servidores y entregó sin e2e. La sesión principal los levantó y corrió las pruebas.
- L-37: sin migraciones, el tipo de sangre no llega solo a la base de demo; tras un cambio de esquema se corre `demo:reset`.
- L-42: el e2e del guion borra un perfil mientras otro spec, en paralelo, contaba perfiles; ahora comprueba nombres.
- L-33: con la máquina saturada falló el login; antes de grabar se revisa la carga.

### ¿En qué fases generaron retrabajo?

Antes, cuando un borrador afirmaba más de lo implementado. Esta semana, por lo que las pruebas no veían (L-26 y L-42) y por una pregunta del seed que se cambió por F3 (L-22).

> **[PENDIENTE Francisco]** ¿En qué PR de esta semana rechazaste o cambiaste lo que propuso el agente, y por qué?

### ¿Cómo cambió la forma de programar?

El agente abría el PR solo después de correr las pruebas de PLAN.md (sección 8); en F10 construyó un subagente y la sesión principal volvió a correr las e2e (L-39). Cada PR declara «Decisiones a revisar» y «No verificado», y el PO revisó y fusionó cada uno. Los cambios de alcance entraron solo con su aprobación.

> **[PENDIENTE Francisco]** ¿Qué te sorprendió más de trabajar con el agente programando y tú revisando?

## B. Resultado del producto

### ¿DAFI resuelve el problema original?

Parcialmente. El ciclo central funciona en local contra el backend y PostgreSQL: la familia envía una conversación con contexto, la médica registra una indicación y la familia la ve y contesta. Aun así, según la [matriz](matriz_trazabilidad.md), ningún RF está completo: 17 son parciales y 6 no están implementados. La médica entra al círculo por el seed. DAFI no diagnostica ni sustituye atención urgente.

### ¿Qué evidencia concreta lo demuestra?

- [demo.spec.ts](../frontend/e2e/demo.spec.ts) recorre los 11 pasos del guion con dos navegadores, en escritorio y a 375 px.
- En `main`, el 24 de noviembre, pasaron 69 pruebas unitarias y 32 de integración del backend, 55 de Vitest y 60 e2e, y el build del frontend ([README](../README.md#pruebas-y-calidad)); no hay salida versionada de esa corrida.
- Capturas de la [bandeja](../docs/capturas/bandeja-medica-375.png), del [hilo](../docs/capturas/hilo-cuidadora-indicacion-375.png) y del [error del login](../docs/capturas/login-error-contrasena-375.png).

### ¿Qué partes no se resolvieron?

No existen verificación de correo, recuperación de cuenta, invitaciones, consentimiento, fotos, solicitud de información, cierre de conversación, notificaciones, resumen de contexto ni reportes. La sección 8 de la matriz declara además que cerrar sesión solo borra el token del navegador (L-40), que borrar un perfil arrastra su historial (L-28) y que el catálogo de preguntas está incompleto, y lista los cambios de alcance aprobados por el PO. La mención del SRS a MongoDB es una inconsistencia documental; la base implementada es PostgreSQL.

### ¿Qué quedó fuera de alcance?

No hay despliegue público: la demo corre en local con datos ficticios, sin lo excluido en la sección 5 de PLAN.md.

### ¿Qué mostraríamos primero al stakeholder y por qué?

El paso 10, la indicación de la médica, porque es lo que distingue a DAFI: la conclusión la escribe la médica y DAFI solo ordena la información.

## Guion recomendado para la demo final

Sigue los segmentos de D4 en [TASKS.md](../docs/demo-final/TASKS.md) y la sección 3 de [PLAN.md](../docs/demo-final/PLAN.md).

1. **Problema (30 s):** coordinar información entre cuidadores y profesionales; DAFI no diagnostica.
2. **Flujos (3 min),** con una ventana para María y otra de incógnito para la médica:
   1. María escribe mal la contraseña, ve el 401 y entra.
   2. Ve sus 3 perfiles.
   3. Crea un perfil.
   4. Lo ve en la lista.
   5. Edita alergias.
   6. Lo borra con confirmación.
   7. Abre conversación para Mateo: «Fiebre», médica y prioridad.
   8. Responde el contexto y envía.
   9. La médica la ve en «Enviadas».
   10. La abre («En revisión») y registra una indicación.
   11. María ve la indicación y contesta.
3. **Decisión técnica (30 s):** Next.js, Express y PostgreSQL, fijados por el SRS.
4. **Uso del agente (30 s):** el error tapado que la e2e no detectó (L-26) y la revisión de cada PR.
5. **Qué haríamos diferente (30 s):** integrar desde el primer sprint; círculo médico, fotos y notificaciones siguen pendientes.
