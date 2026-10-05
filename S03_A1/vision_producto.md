# DAFI: visión del producto (borrador v3)

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Actividad:** S03-A1, insumo para la Parte 0 (consolidación del SRS de equipo)
**Autor del borrador:** Francisco Martínez Álvarez (A01840483)
**Estado:** propuesta para discutir con el equipo; parte del `SRS_final.md` 2.1 de S02-A1

---

## 1. Qué es DAFI

DAFI es una aplicación web para celular donde una familia agrega a los médicos que ya conoce (amigos, conocidos, el pediatra de siempre) y conversa con ellos sobre la salud de sus seres queridos en un espacio dedicado, fuera de WhatsApp. DAFI funciona como intermediario: ordena las conversaciones y, cuando el médico abre una, le reúne lo relevante del historial de ese paciente para que pueda dar una mejor valoración. Las conclusiones y las recomendaciones son siempre del médico.

## 2. El problema

Hoy, cuando un hijo amanece con fiebre o regresa de la escuela con una marca en la piel, la familia le escribe por WhatsApp a un médico de confianza. Las fotos y los mensajes quedan mezclados con conversaciones que no tienen que ver con salud, y el médico tiene que preguntar cada vez lo mismo (desde cuándo, qué comió, si ya le había pasado, si es alérgico a algo) porque no tiene a la mano lo que se habló semanas antes. Si la familia consulta a dos médicos distintos, el contexto queda partido en dos chats.

La entrevista de S02-A1 lo confirmó: la madre entrevistada no usaría una app que juzgue la gravedad por su cuenta, pero sí una que le ordene la conversación con su doctora.

## 3. Principio rector: intermediario, no experto

Este es el cambio principal frente al SRS 2.1 y debe guiar cualquier historia de usuario del backlog.

**DAFI sí:**

- Organiza las conversaciones de salud por paciente y por tema.
- Hace a la familia preguntas de contexto fijas según el tema, para que el médico no tenga que pedirlas.
- Le muestra al médico un resumen de los hechos relevantes del historial del paciente, cada uno con un enlace al mensaje de donde salió.
- Avisa a cada parte cuando la otra respondió.

**DAFI no:**

- Diagnostica, sugiere categorías ni interpreta síntomas.
- Da orientación de primeros auxilios ni evalúa la urgencia de un caso.
- Recomienda tratamientos, emite recetas ni funciona como expediente clínico.
- Verifica credenciales: los médicos son contactos que la familia ya conoce y agrega por su cuenta.

La única indicación de salud que muestra DAFI es un **aviso fijo de emergencias**, igual para todas las conversaciones y que no depende de lo que responda la familia: «DAFI no atiende emergencias. Si la persona tiene dificultad para respirar, pierde el conocimiento o la situación le preocupa, llame al 911 o acuda a urgencias.»

## 4. Usuarios

| Rol | Quién es | Qué hace en DAFI |
|---|---|---|
| **Cuidador principal** | Adulto que crea la familia (madre, padre, hijo que cuida a un padre mayor). | Crea perfiles, agrega médicos, invita a un cocuidador, abre y consulta conversaciones. |
| **Cocuidador** | Otro adulto de la familia invitado por el cuidador principal. | Abre y consulta conversaciones de los perfiles compartidos; no administra la familia. |
| **Médico** | Contacto que la familia invitó por correo. Puede tener cualquier especialidad. | Responde las conversaciones que le dirigen, pide información y registra sus indicaciones. Ve el resumen de contexto. |
| **Administrador** | Integrante del equipo durante el curso. | Atiende reportes de abuso y desactiva cuentas. No ve conversaciones ni fotos. |

En el SRS 2.1 los roles se llamaban tutor y cotutor. Proponemos cambiarlos a cuidador y cocuidador porque el producto ya no se limita a padres de menores.

## 5. Conceptos del dominio

- **Familia:** cuenta compartida por el cuidador principal y, opcionalmente, un cocuidador.
- **Perfil:** la persona de quien se habla (un hijo, el propio cuidador, un padre mayor). Tiene nombre, fecha de nacimiento, alergias y medicamentos de uso continuo.
- **Círculo médico:** los médicos que la familia agregó. Una familia puede tener varios.
- **Conversación:** reemplaza al «caso» del SRS 2.1. Es un hilo sobre un problema de salud de un perfil, dirigido a un médico del círculo. Tiene una o más **etiquetas** (Piel, Fiebre, Estómago, Respiratorio, Sueño y ánimo, Alimentación, Otro) que definen qué preguntas de contexto se le hacen a la familia y permiten filtrar el historial.
- **Preguntas de contexto:** cuestionario corto y fijo por etiqueta (desde cuándo, dónde estuvo, qué comió, si tiene fiebre). Es un catálogo que se carga al desplegar; no lo genera la IA.
- **Historial del paciente:** todas las conversaciones de un perfil, en orden cronológico, filtrables por etiqueta y por médico.
- **Resumen de contexto:** ver sección 6.

## 6. La pieza de IA: el resumen de contexto

Cuando un médico abre una conversación, DAFI le muestra arriba un resumen extraído del historial del paciente que ese médico tiene permitido ver. El resumen tiene reglas estrictas para que no cruce la línea de la sección 3:

- **Solo extrae hechos que la familia o un médico escribieron**: alergias, medicamentos mencionados, episodios anteriores con la misma etiqueta, fechas, indicaciones que dio un médico antes.
- **Cada hecho cita su fuente** (conversación, autor y fecha) con un enlace al mensaje original. Un hecho sin fuente no se muestra.
- **No interpreta ni concluye**: no relaciona síntomas, no sugiere causas, no ordena por gravedad.
- Se muestra con el título «Resumen automático del historial. Verifique en los mensajes originales.»
- El médico puede marcar un hecho como incorrecto; la marca queda registrada.

**Permisos del historial.** Por defecto, cada médico solo ve las conversaciones que le dirigieron. Si la familia quiere que un médico vea también lo que habló con otro, lo activa por perfil y por médico («Compartir historial con Dr. …»). El resumen nunca usa algo que el médico no podría abrir por sí mismo.

Esto es verificable: los criterios de aceptación pueden comprobar que cada hecho tiene fuente, que no aparecen conversaciones sin permiso y, con un conjunto de historiales de prueba, que el resumen no contiene diagnósticos ni recomendaciones.

## 7. Flujo principal

1. La familia crea su cuenta, registra los perfiles y agrega a sus médicos por correo.
2. El médico recibe la invitación, crea su cuenta aceptando los términos (sus indicaciones son responsabilidad suya; DAFI no verifica credenciales ni garantiza tiempos de respuesta) y acepta.
3. Cuando aparece un problema, la familia abre una conversación: elige el perfil, la etiqueta y el médico, responde las preguntas de contexto y adjunta fotos si hacen falta.
4. El médico recibe la notificación, abre la conversación con el resumen de contexto y responde, pide más información o registra sus indicaciones.
5. La conversación queda en el historial del perfil y se cierra sola tras unos días sin actividad, o la familia la cierra.

## 8. Épicas tentativas para la Parte 1

| Épica | Alcance |
|---|---|
| **E1. Familia y círculo médico** | Registro, sesión y recuperación; perfiles; cocuidador; invitar, aceptar y quitar médicos; permisos de historial por médico. |
| **E2. Conversaciones de salud** | Abrir conversación con etiqueta y médico; preguntas de contexto; fotos y adjuntos; mensajes y solicitud de información; indicaciones del médico; cierre; aviso fijo de emergencias. |
| **E3. Contexto para el médico** | Bandeja del médico; historial del paciente con filtros; resumen de contexto con fuentes; marcar hechos incorrectos. |
| **E4. Privacidad y confianza** | Aviso de privacidad y consentimientos; eliminación de fotos, conversaciones, perfiles y cuenta; registro de accesos; notificaciones sin contenido clínico; reportes de abuso y desactivación. |

## 9. Qué cambia respecto al SRS 2.1

Esta tabla sirve de punto de partida para `diferencias_SRS.md`, aunque ahí habrá que cruzarla también con los SRS de los demás integrantes.

| Estado | Requerimientos del SRS 2.1 |
|---|---|
| **Se queda** | RF-01 a RF-03 (cuenta y sesión), RF-04 (perfiles, ahora con medicamentos), RF-05 (cocuidador), RF-15 (conversación y solicitud de información), RF-17 (aviso si el médico no abre), RF-18 (historial), RF-19 (notificaciones), RF-20 (eliminación), RF-23 (fallas de red e idempotencia), RNF-03 a RNF-08, RNF-10. |
| **Cambia** | RF-06 (registro del médico sin cédula, solo por invitación), RF-07 (varios médicos por familia, elección por conversación), RF-08 (fotos opcionales, sin mínimo de tres), RF-09 (preguntas por etiqueta), RF-10 (completitud según la etiqueta), RF-14 (bandeja con resumen de contexto), RF-16 (indicaciones del médico, sin catálogo de decisiones obligatorio), RF-22 (administración sin verificación), RNF-01 (tiempo del resumen en lugar de la inferencia), RNF-11 (etiquetas nuevas sin cambiar el esquema). |
| **Sale** | RF-11 (reglas de alarma, sustituidas por el aviso fijo), RF-12 (presuposición), RF-13 (primeros auxilios), RF-21 (consentimiento para entrenar el modelo), RNF-09 (evaluación del modelo), RD-03 (cédula), RD-05, RD-07, RD-08, RD-09 y el catálogo de categorías de la piel. |
| **Nuevo** | Etiquetas de conversación; resumen de contexto con fuentes; permisos de historial por médico; aviso fijo de emergencias; consentimiento para procesar el texto con un modelo de lenguaje; reportes de abuso. |

El stack acordado no cambia (Next.js, Node.js con Express y MongoDB). El módulo de inferencia de imágenes se sustituye por un módulo de resumen con un modelo de lenguaje, cuyo proveedor se decide en S04.

## 10. Riesgos y preguntas abiertas para el equipo

- **Médicos sin verificar.** Bajamos la fricción, pero cualquiera puede presentarse como médico. La mitigación propuesta es que solo entran por invitación de la familia y que la app dice siempre «Contacto agregado por usted». ¿Basta para el curso?
- **Perfiles de adultos (resuelto).** Un hijo que registra a su madre trata datos de salud de otra persona adulta, que según la LFPDPPP debe consentir. Se decidió admitirlos en la versión 1: el adulto recibe un enlace por correo y da su propio consentimiento (RF-05 de `SRS_equipo.md`).
- **Proveedor del modelo de lenguaje.** Mandar conversaciones de salud a un servicio externo es una transferencia de datos sensibles que debe declararse en el aviso de privacidad.
- **Adopción del médico.** El médico atiende por amistad, no por pago; si DAFI le cuesta más que WhatsApp, no la va a usar. La bandeja y el resumen tienen que ahorrarle tiempo desde la primera conversación.
- **Nombre.** DAFI significaba *Dermatological Analysis From Images*, que ya no describe el producto. ¿Lo conservamos como nombre propio o lo cambiamos?
