# ADR-001: Selección del estilo arquitectónico

**Fecha:** 2026-10-09  
**Estado:** Aceptado  
**Proyecto:** DAFI  
**Responsable de la decisión:** Daniel Ruán Aguilar

## Contexto

DAFI es una aplicación web móvil que organiza conversaciones de salud entre una familia y médicos que la familia ya conoce. La versión 1 debe construirse en 12 semanas por un solo desarrollador y está restringida a Next.js, Node.js con Express y MongoDB. También integra almacenamiento privado de fotos, correo electrónico y un proveedor externo de modelo de lenguaje para generar un resumen de contexto basado únicamente en citas verificables.

La arquitectura debe responder de forma directa a los siguientes requerimientos no funcionales y restricciones del SRS:

- **RNF-01, rendimiento:** el detalle debe mostrarse en 2 s p95 sin bloquearse por el resumen; el resumen debe aparecer en 15 s p95.
- **RNF-03 y RNF-14, portabilidad y accesibilidad:** cliente web responsivo, utilizable en móvil y escritorio, incluido el uso por teclado.
- **RNF-05, RNF-06, RNF-08, RNF-12 y RNF-13, seguridad y privacidad:** TLS, cifrado, eliminación de EXIF, autorización centralizada, trazabilidad, minimización de datos y logs sin contenido clínico.
- **RNF-10, disponibilidad:** objetivo mensual de 99 %.
- **RNF-11, extensibilidad:** nuevas etiquetas y preguntas deben agregarse por catálogo sin cambiar el esquema ni los endpoints.
- **RF-17 y RF-23, resiliencia:** la conversación debe seguir disponible aunque falle o exceda su tiempo límite el módulo de resumen.
- **Restricciones:** un desarrollador, 12 semanas, aplicación web y stack previamente acordado.

El problema central es equilibrar separación de responsabilidades, privacidad y capacidad de evolución sin introducir una complejidad operativa desproporcionada para el equipo.

## Fuerzas de decisión

1. Reducir la complejidad de desarrollo, pruebas y despliegue para una sola persona.
2. Mantener límites claros entre interfaz, reglas de negocio, persistencia e integraciones externas.
3. Centralizar autorización, auditoría e idempotencia para evitar reglas divergentes.
4. Aislar al proveedor del modelo de lenguaje y permitir sustituirlo.
5. Evitar que la latencia o caída del resumen bloquee el flujo principal.
6. Permitir separación futura de módulos solo si la carga o el equipo lo justifican.

## Alternativas consideradas

### Alternativa A: Monolito modular en capas con cliente-servidor y MVC

Una aplicación web Next.js consume una API REST Express. El backend se despliega como una sola unidad, pero se divide internamente por módulos de dominio: identidad y acceso, familias y perfiles, círculo médico y permisos, conversaciones, fotos, historial y resumen, notificaciones, auditoría y administración. Cada módulo sigue el flujo **Controller → Application Service → Repository/Adapter**.

- **Escalabilidad:** media-alta para el alcance del curso. La API puede escalar horizontalmente si las sesiones y la idempotencia se conservan en almacenamiento compartido. El almacenamiento de fotos y MongoDB escalan de forma independiente. El resumen se ejecuta de forma asíncrona respecto a la carga del detalle.
- **Mantenibilidad:** alta si se prohíben accesos directos entre controladores y repositorios de otros módulos, y si cada módulo expone servicios explícitos. RNF-11 se resuelve con catálogos de etiquetas y preguntas.
- **Complejidad de implementación:** baja-media. Un repositorio, una canalización, un contrato de API y menos fallos distribuidos.
- **Adecuación a un desarrollador:** alta. Facilita depuración local, pruebas integrales y entrega en 12 semanas.
- **Riesgo principal:** los límites pueden degradarse y convertirse en un monolito fuertemente acoplado si no se aplican interfaces y dependencias dirigidas.

### Alternativa B: Microservicios por capacidad de negocio

Servicios separados para identidad, familias, conversaciones, multimedia, resumen, notificaciones y auditoría, cada uno con API propia y, potencialmente, persistencia independiente.

- **Escalabilidad:** alta y granular; multimedia y resumen podrían escalar por separado.
- **Mantenibilidad:** potencialmente alta con varios equipos, pero baja para un único desarrollador por contratos distribuidos, versionado y diagnóstico transversal.
- **Complejidad de implementación:** muy alta. Requiere gateway, descubrimiento o configuración de servicios, observabilidad distribuida, reintentos, consistencia eventual y despliegues coordinados.
- **Adecuación a un desarrollador:** baja. El costo operativo no se justifica por el tamaño ni por el calendario.
- **Riesgo principal:** aumentar la superficie de fallos y seguridad antes de validar el producto.

### Alternativa C: Arquitectura orientada a eventos como estilo principal

Los módulos publican eventos como `ConversacionEnviada`, `IndicacionesRegistradas` y `ConsentimientoRevocado`; consumidores independientes procesan notificaciones, auditoría, cierre automático y resúmenes.

- **Escalabilidad:** alta para trabajos en segundo plano y picos.
- **Mantenibilidad:** media. Reduce acoplamiento temporal, pero obliga a administrar esquemas de eventos, duplicados, orden y consistencia eventual.
- **Complejidad de implementación:** alta para el proyecto. Exige broker, consumidores idempotentes, colas de mensajes fallidos y herramientas de observabilidad.
- **Adecuación a un desarrollador:** media-baja. Es útil de forma selectiva, no como estilo dominante en la primera versión.
- **Riesgo principal:** flujos difíciles de rastrear y una experiencia inconsistente si un consumidor falla.

## Matriz comparativa

| Criterio | A. Monolito modular | B. Microservicios | C. Event-driven principal |
|---|---:|---:|---:|
| Escalabilidad para la versión 1 | Alta | Muy alta | Alta |
| Mantenibilidad con 1 desarrollador | Alta | Baja | Media |
| Complejidad de implementación | Baja-media | Muy alta | Alta |
| Seguridad y autorización coherentes | Alta | Media | Media |
| Tolerancia a la falla del resumen | Alta con Adapter + timeout | Alta | Alta |
| Entrega viable en 12 semanas | Alta | Baja | Media-baja |

## Decisión

Se adopta un **estilo cliente-servidor con monolito modular en capas**. Next.js actúa como cliente web y aplica MVC en la interfaz; Express expone una API REST y organiza la lógica mediante módulos de dominio con capas de presentación, aplicación, dominio e infraestructura.

La decisión incluye los siguientes patrones:

1. **Controller–Service–Repository:** separa HTTP, casos de uso y persistencia.
2. **Adapter o Anti-Corruption Layer:** encapsula almacenamiento de objetos, correo y proveedor de modelo de lenguaje.
3. **Strategy:** permite elegir o sustituir el proveedor de resumen sin cambiar los casos de uso.
4. **Dependency Inversion:** los servicios dependen de interfaces, no de SDK externos.
5. **Policy/Specification:** centraliza permisos de historial, roles y visibilidad de recursos.
6. **State:** valida las transiciones de la conversación definidas por el SRS.
7. **Outbox + trabajadores en segundo plano:** se usa selectivamente para notificaciones y tareas programadas, sin convertir todo el sistema en una arquitectura orientada a eventos.
8. **Circuit Breaker, timeout y fallback** para el módulo de resumen: si falla, se entrega el detalle y se enlaza el historial, conforme a RF-23.

No se crea un “microservicio de IA” en la primera versión. El proveedor externo queda detrás de `ResumenProvider`, y un trabajador procesa la solicitud sin enviar identificadores directos. Este límite permite extraer el módulo posteriormente si las métricas lo justifican.

## Consecuencias

### Positivas

- Menor costo cognitivo, operativo y de despliegue para un desarrollador.
- Único punto de aplicación para autenticación, autorización, auditoría, idempotencia y contrato de errores.
- Pruebas integrales más sencillas para los criterios RF-XX-AC-Y.
- La carga del detalle no depende del resumen, lo que apoya RNF-01 y RF-23.
- Los adaptadores evitan acoplar el dominio a MongoDB, correo, almacenamiento o a un proveedor específico de modelo de lenguaje.
- Los catálogos permiten cumplir RNF-11 sin modificar endpoints ni esquema de conversaciones.

### Negativas y mitigaciones

- **Riesgo de acoplamiento interno:** se mitiga con módulos explícitos, interfaces, revisión de dependencias y pruebas por módulo.
- **Escalado grueso de la API:** aceptable en la versión 1; fotos y base de datos ya se escalan fuera del proceso.
- **Trabajos en segundo plano dentro del mismo producto:** se ejecutan como proceso worker separado usando el mismo código y la misma base de datos.
- **MongoDB no ofrece límites de agregados automáticamente:** los repositorios y servicios deben asegurar invariantes y transacciones cuando una operación afecta varios documentos.
- **Proveedor externo con datos sensibles:** se minimiza y seudonimiza la carga, se verifica el contrato de no entrenamiento y no retención, y la API valida cada cita antes de mostrarla.

## Límites y reglas de implementación

- El frontend solo accede a datos mediante la API; las fotos no tienen URL pública.
- Los controladores no contienen reglas de negocio ni acceden directamente a MongoDB.
- El administrador no tiene rutas para leer perfiles, conversaciones o fotos.
- La verificación de cada cita del resumen ocurre en la API, aun si el proveedor afirma haberla validado.
- Las notificaciones por correo no incluyen nombres de pacientes ni contenido clínico.
- Las acciones sensibles generan eventos de auditoría con identificador de correlación.
- La comunicación sincrónica usa HTTPS/JSON; los trabajos internos usan una cola lógica respaldada por una colección Outbox.

## Criterios para reconsiderar la decisión

Se evaluará extraer un módulo a servicio independiente únicamente si existe evidencia de al menos una de estas condiciones:

- El resumen o el procesamiento multimedia necesita escalar de forma independiente de la API durante un periodo sostenido.
- Un segundo equipo asume propiedad completa de una capacidad.
- Una dependencia exige aislamiento operativo o normativo.
- La frecuencia de despliegue de un módulo bloquea al resto del producto.

## Trazabilidad principal

- Rendimiento y degradación controlada: RNF-01, RF-17, RF-23.
- Seguridad, privacidad y auditoría: RNF-05, RNF-06, RNF-08, RNF-12, RNF-13.
- Disponibilidad: RNF-10.
- Extensibilidad por catálogo: RNF-11 y RD-07.
- Restricciones tecnológicas y de calendario: SRS 2.4.
