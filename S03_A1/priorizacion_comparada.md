# Priorización comparada: agente Product Owner frente al equipo

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A1, Parte 3

Le pedimos a una sesión de agente distinta de la que generó el backlog que adoptara el rol de Product Owner y priorizara las 18 historias según valor de negocio. Le dimos la visión, el SRS y una copia del backlog **sin nuestras prioridades ni nuestro orden**, para que no se anclara en ellos. Su respuesta completa está en `evidencia/priorizacion_agente_PO.md`.

## 1. Las dos priorizaciones

| Historia | Equipo (orden, prioridad) | Agente PO (orden, prioridad) | Diferencia |
|---|---|---|---|
| HU-01 Acceso a la cuenta | 1, Alta | 1, Alta | = |
| HU-02 Perfiles de hijos y propio | 2, Alta | 2, Alta | = |
| HU-05 Círculo médico | 3, Alta | 3, Alta | = |
| HU-06 Abrir conversación | 4, Alta | 4, Alta | = |
| HU-09 Revisión y envío | 5, Alta | 5, Alta | = |
| HU-12 Bandeja del médico | 6, Alta | 6, Alta | = |
| HU-10 Mensajes y solicitud de información | 7, Alta | 7, Alta | = |
| HU-11 Indicaciones y cierre | 8, Alta | 8, Alta | = |
| HU-16 Notificaciones | 9, Alta | 10, Alta | 1 lugar |
| HU-07 Fotos | 10, Alta | 9, Alta | 1 lugar |
| HU-13 Resumen: datos del perfil | 11, **Alta** | 12, **Media** | Prioridad |
| HU-14 Resumen: citas verificadas | 12, **Alta** | 14, **Media** | Prioridad y 2 lugares |
| HU-15 Historial del paciente | 13, Media | 13, Media | = |
| HU-04 Cocuidador | 14, **Media** | 16, **Baja** | Prioridad y 2 lugares |
| HU-03 Perfil de otro adulto | 15, Media | 15, Media | = |
| HU-17 Eliminación de datos | 16, Media | 11, Media | **5 lugares** |
| HU-18 Reportes de abuso | 17, **Media** | 17, **Baja** | Prioridad |
| HU-08 Calidad de fotos | 18, Baja | 18, Baja | = |

El agente dejó 10 historias en Alta (60 SP); nosotros, 12 (76 SP).

## 2. Dónde coincidimos

Las ocho primeras posiciones son idénticas, y también la última. Los dos llegamos al mismo camino mínimo (cuenta, perfil, médico en el círculo, conversación con contexto, envío, bandeja, mensajes e indicaciones), y por la misma razón: si falta cualquiera de esas historias, la familia no puede completar una sola consulta. Coincidimos también en poner el círculo médico (HU-05) antes de abrir la conversación, porque el riesgo de negocio más grande de la visión es que el médico no adopte DAFI y ese riesgo empieza en la invitación.

El SRS ya define un flujo de estados explícito (de `BORRADOR` a `CON_INDICACIONES`) y cada historia del tope corresponde a una transición de ese flujo, por lo que quien lea el SRS con atención llega al mismo orden. Todas las diferencias están de la mitad para abajo.

## 3. Dónde diferimos y por qué

El SWEBOK enumera como factores de prioridad el valor para el usuario, la insatisfacción si el requerimiento falta (modelo de Kano), el costo de entregarlo, el riesgo técnico de implementarlo y el riesgo de que los usuarios no lo usen aunque exista (IEEE Computer Society, 2024, pp. 1-17–1-18). Los dos usamos casi los mismos factores (el agente pesó bloqueo funcional, adopción, riesgo legal y valor por punto); la diferencia de fondo está en el riesgo técnico. Para el agente, la incertidumbre técnica le resta prioridad a una historia; para nosotros es una razón para enfrentarla antes.

### 3.1 El resumen de contexto (HU-13 y HU-14)

Aquí está la diferencia más grande. El agente puso el resumen con citas en el lugar 14 y en prioridad Media, con un argumento de negocio sólido: **el resumen no aporta en las primeras semanas porque todavía no hay historial que resumir**. Además señala que es la historia con más incertidumbre técnica y la que agrega un riesgo regulatorio (enviar conversaciones a un proveedor externo, RD-06).

Nosotros la dejamos en Alta por dos razones, que corresponden a dos de los factores del SWEBOK citados arriba: el riesgo de que no se use y el riesgo técnico. La de negocio es que el resumen es lo único que distingue a DAFI de un chat con formularios, y si no está en el alcance comprometido es la primera historia que se cae cuando el calendario se aprieta. La técnica es que, por ser la de mayor incertidumbre, conviene enfrentarla pronto: si el proveedor no cumple RD-06 o la verificación de citas descarta demasiadas, necesitamos saberlo en el sprint 3 y no en el 10.

El agente prioriza por el valor que recibe el usuario en el momento; nosotros mezclamos valor con reducción de riesgo técnico. Las dos lecturas son válidas, pero responden a preguntas distintas. Además, el agente que generó el backlog también había puesto el resumen en Media sin conocer la priorización del agente Product Owner. Como dos sesiones independientes coincidieron, acordamos una salida intermedia: HU-13 (sin modelo, 3 SP) sigue en Alta, y antes de comprometer HU-14 completa haremos en S04 una prueba técnica con el proveedor (*spike*) que se limite a la verificación de citas. Si la prueba sale mal, HU-14 baja a Media.

### 3.2 Eliminación de datos (HU-17)

En términos del modelo de Kano, la eliminación de datos no genera satisfacción cuando existe, pero su ausencia generaría una insatisfacción muy alta en una madre que comparte fotos de sus hijos; el SWEBOK advierte que priorizar solo por satisfacción lleva a errores en casos así (IEEE Computer Society, 2024, p. 1-18). Por eso ni el agente ni nosotros la bajamos de Media.

El agente la sube 5 lugares, por encima del historial y del resumen. Su argumento es que el derecho de cancelación de la LFPDPPP debe estar garantizado antes de abrir el producto a familias reales. Coincidimos en el argumento y en la prioridad (los dos la dejamos en Media); la diferencia es de orden y viene del método. El agente declaró que «el orden sigue al valor, no al orden de construcción». Nuestro orden sí considera dependencias técnicas: el borrado en cascada (conversación, fotos, eventos, registro mínimo, aviso al médico, exclusión del historial y del resumen) toca entidades que crean HU-07, HU-14 y HU-15, y construirlo antes obliga a rehacerlo cada vez que aparece una entidad nueva.

Mantenemos el orden, pero adoptamos la condición del agente como regla de liberación: **ninguna familia real entra a DAFI hasta que HU-17 esté terminada**, aunque eso implique adelantarla.

### 3.3 Cocuidador (HU-04) y perfil de otro adulto (HU-03)

El agente pone el perfil de otro adulto por encima del cocuidador, porque abre un segmento nuevo (el hijo que cuida a un padre mayor), y baja al cocuidador a Baja porque tiene un sustituto informal: compartir la cuenta o reenviar el aviso.

Nosotros invertimos ese orden con evidencia de la entrevista. La cliente real contó que el padre de sus hijos también toma y reenvía fotos (S02-A1, P2 y P3); el cocuidador sale de un comportamiento observado. El perfil de otro adulto, en cambio, salió de la visión de producto y nadie lo ha validado con un usuario. Además, el sustituto que propone el agente (compartir la cuenta) rompe la trazabilidad de autoría que piden RF-14-AC-4 y RNF-08: el médico no sabría quién le escribe.

### 3.4 Reportes de abuso (HU-18)

El agente la deja en Baja con un supuesto explícito: el primer lanzamiento es un piloto cerrado con pocas familias conocidas, y mientras tanto el equipo puede desactivar cuentas a mano. Nosotros la dejamos en Media porque, al no verificar cédulas (RD-03), el reporte es la única defensa contra la suplantación.

Aquí el supuesto del agente es razonable y lo aceptamos para el piloto. Sin embargo, «desactivar a mano» significa editar la base de datos directamente, sin la transición a `SIN_MEDICO` ni el aviso a las familias que exige RF-22-AC-3, y eso deja conversaciones abiertas con un médico que ya no puede responder. Mantenemos Media, y la marcamos como la primera historia que sale del alcance si el calendario lo exige.

### 3.5 Notificaciones y fotos (HU-16 y HU-07)

Intercambiamos un lugar. El agente pone las fotos antes porque son el hábito actual de la cliente; nosotros, las notificaciones, porque sin ellas el médico no se entera de que le escribieron. Las dos son Alta y entran al mismo sprint, así que la diferencia no tiene consecuencias prácticas.

## 4. Cambios que hicimos por la comparación

- HU-14 queda condicionada a una prueba técnica (*spike*) en S04; si falla, baja a Media.
- HU-17 pasa a ser requisito de liberación para cualquier prueba con familias reales.
- HU-18 queda marcada como la primera candidata a salir del alcance.

El orden de `backlog_completo.md` no cambió; resolvimos las diferencias que el agente detectó con estas tres condiciones.

---

## Referencias

IEEE Computer Society. (2024). *Guide to the software engineering body of knowledge (SWEBOK Guide)* (Versión 4.0a; H. Washizaki, Ed.). IEEE Computer Society.
