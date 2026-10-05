# Ajustes a la propuesta de backlog del agente

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A1, Parte 1

Le dimos a una sesión de agente independiente solo el `SRS_equipo.md` y las instrucciones de la actividad (entre 3 y 5 épicas, formato de historia, al menos 2 criterios por historia, Fibonacci y prioridad). Su propuesta íntegra está en `evidencia/propuesta_agente_backlog.md`: 4 épicas, 15 historias y 99 SP, con 10 historias Alta, 4 Media y 1 Baja.

La propuesta era buena de entrada. Respetó las épicas del SRS, sacó los criterios de los `RF-XX-AC-Y` con su referencia y justificó cada estimación. La mayoría de nuestros cambios fueron de tamaño y de prioridad, más cuatro criterios que faltaban; el resultado es `backlog_completo.md`, con 18 historias y 97 SP.

## 1. Cambios de tamaño (división de historias)

| # | Propuesta del agente | Cambio | Justificación |
|---|---|---|---|
| A-01 | HU-06 «Fotos de la conversación», 13 SP | Dividida en HU-07 «Agregar fotos» (8 SP, Alta) y HU-08 «Validación de calidad y guía para Piel» (5 SP, Baja) | Una historia de 13 SP no cabe con holgura en un sprint de un equipo de cuatro personas que estudian y trabajan. Además mezclaba dos valores distintos: poder mandar la foto (indispensable) y que la foto salga bien (deseable, porque el médico ya puede pedir otra con HU-10). Separadas, la segunda puede bajar de prioridad sin arrastrar a la primera. |
| A-02 | HU-11 «Resumen de contexto», 13 SP | Dividida en HU-13 «Datos del perfil y estructura» (3 SP) y HU-14 «Citas del historial verificadas» (8 SP) | Los datos del perfil no pasan por el modelo de lenguaje: son una lectura directa. Separarlos permite entregar parte del resumen en cuanto existan conversaciones y aislar en HU-14 toda la incertidumbre técnica (proveedor externo, verificación de citas, anonimización). La suma baja de 13 a 11 porque, al dividir, se vio que la parte sin modelo era más chica de lo que parecía dentro del bloque. |
| A-03 | HU-02 «Perfiles de pacientes» (menores, propio y otro adulto), 8 SP | Dividida en HU-02 «Perfiles de hijos y propio» (3 SP, Alta) y HU-03 «Perfil de otro adulto con consentimiento» (5 SP, Media) | El consentimiento del adulto es un flujo externo completo (correo, enlace con vigencia, revocación y borrado en cascada) que no necesita la cliente de referencia, quien consulta por sus hijos. Juntos, el CRUD simple quedaba atado a ese flujo. |

Con las tres divisiones, los IDs se renumeraron. La correspondencia es: HU-01 → HU-01; HU-02 → HU-02 y HU-03; HU-03 → HU-04; HU-04 → HU-05; HU-05 → HU-06; HU-06 → HU-07 y HU-08; HU-07 a HU-10 → HU-09 a HU-12; HU-11 → HU-13 y HU-14; HU-12 a HU-15 → HU-15 a HU-18.

También acordamos la regla de que ninguna historia supere 8 SP antes de entrar a un sprint, y la dejamos escrita en las convenciones del backlog.

## 2. Cambios de prioridad

| # | Historia | Agente | Equipo | Justificación |
|---|---|---|---|---|
| A-04 | Resumen de contexto (HU-13 y HU-14) | Media | Alta | El agente razonó que el flujo familia → médico funciona sin el resumen, y técnicamente es cierto. Pero sin él DAFI es WhatsApp con formularios, y el riesgo principal del producto es que el médico, que atiende por amistad y no por pago, no deje WhatsApp. El resumen es lo que le ahorra tiempo desde la primera conversación. Lo mantenemos después del flujo mínimo en el orden de construcción, pero con prioridad Alta para que no se caiga del alcance. |
| A-05 | Reportes de abuso (HU-18) | Baja | Media | El SRS decidió no verificar cédulas (RD-03). Con esa decisión, el reporte es la única defensa contra alguien que se haga pasar por médico, y el agente no hizo esa conexión al evaluar la historia de forma aislada. |
| A-06 | Validación de calidad de fotos (HU-08, nueva) | (dentro de una historia Alta) | Baja | Consecuencia de A-01. |
| A-07 | Perfil de otro adulto (HU-03, nueva) | (dentro de una historia Alta) | Media | Consecuencia de A-03. |

## 3. Cambios en criterios y redacción

| # | Historia | Cambio | Justificación |
|---|---|---|---|
| A-08 | HU-06 «Abrir una conversación» | Agregamos el criterio RF-13-AC-2 (el aviso de emergencias es idéntico con F1 = 36.8 y con F1 = 40.2, y no aparece ningún otro mensaje sobre la salud) y quitamos RF-10-AC-4 | Es la prueba directa de que DAFI no evalúa la salud del paciente (RD-01), el principio que define el producto. El agente incluyó el criterio de que el aviso aparece, pero no el de que no cambia. RF-10-AC-4 dice lo mismo para un solo campo y queda cubierto. |
| A-09 | HU-02 «Perfiles» | Agregamos RF-04-AC-3 (el cocuidador no puede crear perfiles) y RF-04-AC-5 (un menor con 18 años o más se redirige a «Agregar a otro adulto») | Al separar la historia hacían falta criterios propios; el segundo es el punto de unión con HU-03. |
| A-10 | HU-07 «Agregar fotos» | Agregamos RF-11-AC-5 (la API rechaza un archivo que no sea JPEG o que pese más de 1 MB) | Sin él, la validación solo ocurría en el cliente, que se puede omitir. Fue un hallazgo de la revisión técnica de S02 que no queríamos perder. |
| A-11 | HU-16 «Notificaciones» | Agregamos RF-19-AC-2 (correo al médico cuando la familia pide respuesta pronto) | La propuesta solo cubría notificaciones hacia la familia. La notificación al médico es la que hoy le da WhatsApp y sin ella el flujo no arranca. |
| A-12 | HU-07 del agente (ahora HU-09) | «para estar segura de que mi médico recibió…» → «para tener la certeza de que mi médico recibió…» | El rol de la historia es «cuidador» y el beneficio estaba en femenino. |
| A-13 | Todas | Agregamos a cada prioridad una justificación de una línea | El agente solo justificó la prioridad de HU-11. La rúbrica pide priorización coherente con el valor de negocio, y una prioridad sin argumento no se puede discutir en la planeación. |

## 4. Lo que aceptamos sin cambios

- Las 4 épicas, que coinciden con las del SRS y evitan cambiar de nombres entre documentos.
- La historia de referencia de 3 SP para el historial del paciente.
- Las estimaciones de las 12 historias que no se dividieron.
- La propuesta de llevar RNF-03, RNF-04 y RNF-10 a la Definition of Done, porque aplican a todas las pantallas y no a una historia. La escribimos en `backlog_completo.md`.
- La dependencia de RD-05 (un médico que revise preguntas y avisos), que dejamos como impedimento.
