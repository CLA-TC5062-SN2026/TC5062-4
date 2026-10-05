# Reflexión sobre SCRUM y el uso de IA

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A1, Parte 4

## ¿Qué ventajas y riesgos identificamos en usar un agente de IA para generar el Product Backlog?

La ventaja más clara fue la velocidad con trazabilidad. A partir del SRS, el agente generador entregó en un par de minutos 15 historias en formato correcto, con criterios tomados de los `RF-XX-AC-Y`, cada uno con su referencia, y una justificación de una línea por estimación. Ese trabajo mecánico (pasar requerimientos a historias sin perder el identificador de origen) es el que un equipo hace mal cuando tiene prisa, y es el que después permite nombrar las pruebas de S09 igual que los criterios. El agente también detectó cosas que nosotros no habíamos pedido, como que RNF-03, RNF-04 y RNF-10 no pertenecen a una historia sino a la Definition of Done.

Los riesgos aparecieron en la revisión. El agente evalúa cada historia por separado y pierde las conexiones entre decisiones del SRS: dejó los reportes de abuso en prioridad Baja sin relacionarlos con que DAFI no verifica cédulas, que es lo que los vuelve la única defensa contra la suplantación. También tendió a agrupar demasiado (dos historias de 13 SP que tuvimos que dividir) y no distinguió entre lo que la cliente pidió y lo que salió de nuestra visión de producto. El riesgo más grande es que un backlog bien formado parece correcto aunque no lo sea, y eso invita a aceptarlo sin leerlo; nosotros encontramos estos problemas porque revisamos historia por historia.

## ¿Puede un agente reemplazar al Product Owner?

No. Puede asistirlo, y bien, pero no reemplazarlo, por tres razones que vimos en esta actividad. En Scrum, el Product Owner decide qué elementos entran al Product Backlog (IEEE Computer Society, 2025, p. 11-10; Sutherland y Schwaber, 2020), y esa decisión depende de cosas que el agente no tiene.

El Product Owner es dueño de la relación con los stakeholders, y lo más valioso del producto salió de ahí. El cambio de alcance de DAFI (de un clasificador de lesiones a un intermediario entre la familia y su médico) no lo propuso ningún agente: salió de una entrevista en la que la cliente dijo que no usaría una app que juzgue la salud de sus hijos y que hoy le manda las fotos por WhatsApp a su amiga pediatra. En la comparación de la Parte 3 pasó lo mismo en pequeño. El agente Product Owner puso el perfil de otro adulto por encima del cocuidador con un argumento de mercado razonable, y sin darle peso a que la cliente nos contó que el papá de sus hijos también toma y reenvía fotos; en el SRS ese dato solo aparece como una referencia en la matriz de trazabilidad, y quien estuvo en la entrevista sabe cuánto pesa.

El Product Owner además responde por las decisiones. Cuando el agente y nosotros diferimos sobre el resumen de contexto, ninguna de las dos posiciones era incorrecta: el agente priorizaba el valor entregado en el momento y nosotros incluíamos el riesgo técnico. Decidir entre ellas (y fijar la condición de una prueba técnica en S04) es asumir una apuesta frente al equipo y frente a la cliente, y esa responsabilidad no se puede delegar en un sistema que no tiene que rendir cuentas.

El Product Owner también negocia, y la negociación es emocional antes que racional. Convencer a un médico que atiende por amistad de dejar WhatsApp, o explicarle a la cliente por qué la versión 1 no le dará orientación de primeros auxilios, no se resuelve con un ranking bien justificado.

Lo que sí puede hacer el agente es servir como segunda opinión independiente. El dato más útil de la actividad fue que dos sesiones que no se conocían (la que generó el backlog y la que hizo de Product Owner) pusieron el resumen en prioridad Media. Esa coincidencia nos obligó a matizar nuestra posición en lugar de defenderla por inercia.

## ¿Cómo afecta la calidad del SRS a la calidad del backlog generado?

La calidad del SRS se trasladó directo al backlog, tanto en lo bueno como en lo que faltaba.

Lo bueno del backlog se explica por el SRS, y cuánto lo determina tiene que ver con la validación de requerimientos: el SWEBOK la define como ganar confianza en que los requerimientos representan las necesidades reales de los stakeholders (IEEE Computer Society, 2025, p. 1-15), y un agente no puede validar nada que el SRS no le diga. Como cada requerimiento ya tenía criterios en formato Dado que / cuando / entonces con valores concretos (umbrales, textos exactos, estados de origen y destino), el agente no tuvo que inventar criterios: los tomó y los condensó. Las ocho primeras posiciones de la priorización coincidieron entre el agente y nosotros porque el SRS define una máquina de estados explícita y cada historia del tope es una transición de ella. Un SRS con requerimientos vagos («la app debe ser fácil de usar») habría producido historias con criterios igual de vagos.

Lo que el SRS deja abierto también queda abierto en el backlog. RD-05 deja pendiente quién será el médico que revise las preguntas y los avisos, y el agente lo único que pudo hacer fue marcarlo como impedimento. Además, un agente produce un backlog bien formado para cualquier SRS que le den, incluso para el producto equivocado. Los SRS individuales de S02 que describían la idea original (mostrarle a la persona información médica sobre manchas y lunares) habrían generado un backlog igual de ordenado para un producto con un riesgo regulatorio que no podíamos asumir. Que el SRS describa el producto correcto depende de haberlo validado con el cliente real antes de escribirlo, y por eso dedicamos la Parte 0 a consolidar el SRS antes de pedirle nada al agente.

---

## Referencias

IEEE Computer Society. (2025). *Guide to the software engineering body of knowledge (SWEBOK Guide)* (Versión 4.0a; H. Washizaki, Ed.). IEEE Computer Society.

Sutherland, J., & Schwaber, K. (2020). *The Scrum guide*. Scrum.org.
