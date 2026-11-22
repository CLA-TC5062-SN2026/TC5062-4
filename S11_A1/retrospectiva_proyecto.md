# Retrospectiva del proyecto DAFI

Con base en el código, las pruebas y el historial versionado del proyecto, esta retrospectiva describe el resultado observado y separa las funcionalidades demostradas de los prototipos y las brechas.

## A. Proceso de trabajo

### ¿Qué salió bien?

- La separación entre contrato OpenAPI, esquema relacional y rutas permitió contrastar requisitos con artefactos concretos. La revisión de SQL registra correcciones a partir del OpenAPI y el diagrama en [S05_S06_A1/revision_sql.md](../S05_S06_A1/revision_sql.md).
- PostgreSQL sostiene los datos de perfiles y conversaciones en la implementación backend. El esquema versionado es [S05_S06_A1/esquema_bd.sql](../S05_S06_A1/esquema_bd.sql).
- La autenticación JWT y la autorización por rol se ejercitan en el backend y se documentan en [S05_S06_A2/revision_seguridad.md](../S05_S06_A2/revision_seguridad.md).
- La revisión de componentes detectó problemas concretos de accesibilidad, hidratación y comportamiento de formularios, y documentó los cambios aplicados en [S07_S08_A1/revision_componentes.md](../S07_S08_A1/revision_componentes.md).
- Las actividades de auditoría y trazabilidad hicieron visibles las diferencias entre el contrato, el código, las pruebas y las pantallas.

### ¿Qué no salió bien?

- Parte del frontend presenta vistas de conversación, bandeja e historial con fixtures; su apariencia no demuestra integración funcional con el API.
- La cobertura del OpenAPI es parcial. El contrato contiene operaciones que no están implementadas en las rutas actuales, entre ellas recuperación de cuenta, notificaciones y flujos completos de consentimiento.
- Afirmaciones documentales requirieron comprobación repetida contra código y salidas de prueba. En particular, algunas referencias de línea quedaron desactualizadas al cambiar los archivos.
- Se produjo retrabajo al convertir explicaciones genéricas en evidencia local concreta y al sanitizar salidas que podían incluir datos de demostración.
- Hubo conflictos de Git y comandos ejecutados desde rutas incorrectas. El historial disponible no permite atribuir cada incidente a una herramienta o agente.
- Algunas propuestas de diseño cubrían un alcance mayor que el producto funcional demostrado; fue necesario distinguir objetivos del SRS de lo implementado.

### ¿Qué haríamos diferente?

La comparación de cada criterio de aceptación con una ruta, una prueba reproducible y una pantalla integrada habría comenzado antes de redactar conclusiones de avance. Una revisión de cambios y enlaces al cerrar cada actividad habría reducido referencias de línea obsoletas y discrepancias entre documentos. Las capturas y salidas de prueba se habrían sanitizado al generarse, conservando el comando, el resultado y el contexto suficiente para reproducirlas sin divulgar credenciales.

### ¿En qué fases fueron útiles los agentes?

Los agentes fueron útiles al comparar diseños y contratos; producir versiones iniciales del esquema SQL, del backend Express y de componentes; revisar seguridad; proponer y estructurar pruebas; localizar hallazgos; y organizar documentación. Hay evidencia directa de la propuesta inicial de SQL y del backend en [S05_S06_A1/revision_sql.md](../S05_S06_A1/revision_sql.md), de los componentes en [S07_S08_A1/revision_componentes.md](../S07_S08_A1/revision_componentes.md), de la revisión de seguridad en [S05_S06_A2/revision_seguridad.md](../S05_S06_A2/revision_seguridad.md) y de hallazgos de código en [S09_A1/code_review.md](../S09_A1/code_review.md). La utilidad estuvo en acelerar borradores y análisis, no en sustituir la verificación contra el repositorio y las ejecuciones locales.

### ¿En qué fases generaron retrabajo?

El retrabajo apareció cuando un borrador contenía afirmaciones que no coincidían con el alcance real, cuando las referencias de línea cambiaron, cuando la documentación era genérica y cuando una salida necesitaba sanitización. También hubo conflictos Git y ejecuciones desde rutas incorrectas; esos incidentes no se atribuyen a IA porque el historial no demuestra esa relación. Las propuestas de mayor alcance que la implementación necesitaron reducción y clasificación como brechas, no como capacidades existentes.

### ¿Cómo cambió la forma de programar?

El flujo observado pasó de usar generación como punto de partida a contrastar cada cambio con el contrato, las reglas del dominio, la autorización, las pruebas y el estado del repositorio. La revisión humana comprobó nombres de campos, rutas, permisos y comportamiento; las pruebas y la documentación conservaron los límites del resultado. El agente sirvió para acelerar exploración y primeras versiones, mientras que la decisión de integrar dependió de evidencia verificable.

## B. Resultado del producto

### ¿DAFI resuelve el problema original?

DAFI atiende parcialmente la coordinación de información entre cuidadores y profesionales de salud mediante cuentas, perfiles y operaciones backend para conversaciones. No resuelve de extremo a extremo el problema original: los flujos principales de conversación no están integrados por completo en la interfaz y faltan capacidades del contrato. DAFI no diagnostica ni sustituye atención médica urgente.

### ¿Qué evidencia concreta lo demuestra?

- La autenticación y los controles de acceso del backend están descritos con rutas y resultados observados en [S05_S06_A2/revision_seguridad.md](../S05_S06_A2/revision_seguridad.md).
- El listado de perfiles con datos ficticios desde PostgreSQL se documenta y se muestra en [S07_S08_A2/evidencia/perfiles_datos_reales.png](../S07_S08_A2/evidencia/perfiles_datos_reales.png).
- El backend incluye rutas de perfiles y conversaciones en `backend/src/routes/`; el esquema que las respalda es [S05_S06_A1/esquema_bd.sql](../S05_S06_A1/esquema_bd.sql).
- Las colecciones y salidas locales documentadas prueban solicitudes seleccionadas, no la totalidad de los criterios del OpenAPI. La auditoría S09 separa sus hallazgos estáticos de las pruebas ejecutadas en [S09_A1/code_review.md](../S09_A1/code_review.md).
- La evidencia de interfaz de [S07_S08_A2/evidencia/error_sweetalert.png](../S07_S08_A2/evidencia/error_sweetalert.png) registra una condición de error visual; no acredita por sí sola el funcionamiento integral de las vistas.

### ¿Qué partes no se resolvieron?

No se completaron recuperación de cuenta, verificación de correo, invitaciones y consentimiento de extremo a extremo, ciclo completo de mensajes e indicaciones, carga segura de fotos, notificaciones, administración de reportes ni resumen de contexto. Las vistas de conversación, bandeja e historial que consumen fixtures no demuestran integración con el backend. La cobertura de OpenAPI y de las pruebas es parcial.

PostgreSQL es la base de datos implementada y vigente. El SRS conserva una referencia histórica a MongoDB que constituye una inconsistencia documental.

### ¿Qué quedó fuera de alcance?

No hay despliegue público documentado. La solución usa datos ficticios y tiene propósito académico; no se deben introducir datos médicos reales. DAFI no formula diagnósticos ni reemplaza servicios de emergencia o atención urgente. Las funcionalidades que no aparecen en el código ni en pruebas verificables no se consideran parte del producto entregado.

### ¿Qué mostraríamos primero al stakeholder y por qué?

Primero mostraríamos el inicio de sesión y el listado de perfiles respaldado por PostgreSQL, indicando que los datos son ficticios. Es el recorrido con evidencia de integración más clara y permite explicar la separación de roles y datos sin presentar los prototipos de conversación como flujos terminados. Después distinguiríamos una operación backend de conversación de las vistas que aún usan fixtures.

## Guion recomendado para la demo final

1. **Problema:** explicar la necesidad de coordinar información entre cuidadores y profesionales, y delimitar que DAFI no diagnostica ni sustituye atención urgente.
2. **Flujos principales:** mostrar autenticación y listado de perfiles con datos ficticios respaldados por PostgreSQL; diferenciar las pantallas de conversación que usan fixtures.
3. **Decisión técnica:** describir Next.js, Express, JWT y PostgreSQL. PostgreSQL es la base implementada; la referencia a MongoDB permanece como inconsistencia histórica del SRS.
4. **Uso del agente:** presentar ejemplos de borradores de SQL y componentes, revisión de seguridad y hallazgos, junto con la verificación humana mediante código y pruebas.
5. **Limitación y mejora:** declarar la integración parcial, las operaciones no construidas y la ausencia de producción pública; priorizar la integración del flujo de conversación y sus pruebas representativas.
