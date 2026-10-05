# Product Backlog: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A1, Parte 1
**Fuente:** `SRS_equipo.md` 3.0. La propuesta original del agente y los cambios que le hicimos están en `ajustes_backlog.md`.

---

## Convenciones

**Formato.** Cada historia sigue «Como [tipo de usuario], quiero [acción], para [beneficio]». Los criterios de aceptación están en formato Dado que / cuando / entonces y llevan entre paréntesis el `RF-XX-AC-Y` del SRS del que salen, para que las pruebas de S09 se puedan nombrar igual.

**Estimación.** Story Points en Fibonacci (1, 2, 3, 5, 8, 13). La historia de referencia es **HU-15 (historial del paciente) = 3 SP**: una consulta con filtros sobre datos que ya existen y una pantalla, sin reglas de negocio nuevas. Cada estimación se justifica en una línea comparándola con esa referencia. Acordamos que ninguna historia supere 8 SP; una de 13 se divide antes de entrar a un sprint.

**Prioridad.**

- **Alta:** sin ella no existe el flujo mínimo (la familia abre una conversación, el médico la recibe con contexto y deja indicaciones) o se rompe una restricción de dominio (RD-01, RD-02).
- **Media:** necesaria para la versión 1, pero el flujo mínimo funciona sin ella.
- **Baja:** puede quedar para los últimos sprints sin afectar a la cliente de referencia.

**Orden.** La columna «Orden» es el orden en que el equipo propone construir las historias, combinando prioridad y dependencias técnicas. Se compara con la priorización del agente en `priorizacion_comparada.md`.

**Labels en GitHub.** `epica:E1` a `epica:E4`, `prioridad:alta|media|baja` y `sp:N`.

---

## Resumen

| Orden | ID | Épica | Historia (resumida) | SP | Prioridad | Cubre |
|---|---|---|---|---|---|---|
| 1 | HU-01 | E1 | Crear cuenta, iniciar sesión y recuperar acceso | 8 | Alta | RF-01 a RF-03, RNF-05 |
| 2 | HU-02 | E1 | Perfiles de los hijos y del propio cuidador | 3 | Alta | RF-04, RD-02 |
| 3 | HU-05 | E1 | Invitar médicos al círculo y decidir qué historial ve cada uno | 8 | Alta | RF-07, RF-08, RD-03 |
| 4 | HU-06 | E2 | Abrir una conversación con preguntas de contexto y aviso fijo | 8 | Alta | RF-09, RF-10, RF-13, RD-01 |
| 5 | HU-09 | E2 | Revisar y enviar la conversación | 5 | Alta | RF-12, RF-23 |
| 6 | HU-12 | E3 | Bandeja y detalle para el médico | 5 | Alta | RF-16, RNF-08 |
| 7 | HU-10 | E2 | Mensajes y solicitud de información | 5 | Alta | RF-14 |
| 8 | HU-11 | E2 | Indicaciones del médico y cierre | 5 | Alta | RF-15 |
| 9 | HU-16 | E4 | Notificaciones y aviso por falta de respuesta | 5 | Alta | RF-19, RF-20 |
| 10 | HU-07 | E2 | Agregar fotos desde cámara o galería | 8 | Alta | RF-11, RNF-02, RNF-06 |
| 11 | HU-13 | E3 | Resumen: datos del perfil y estructura | 3 | Alta | RF-17 |
| 12 | HU-14 | E3 | Resumen: citas del historial verificadas | 8 | Alta | RF-17, RF-23, RNF-09, RNF-12, RD-06 |
| 13 | HU-15 | E3 | Historial del paciente | 3 | Media | RF-18 |
| 14 | HU-04 | E1 | Cocuidador | 5 | Media | RF-06 |
| 15 | HU-03 | E1 | Perfil de otro adulto con su consentimiento | 5 | Media | RF-05, RD-02 |
| 16 | HU-17 | E4 | Eliminación de datos | 5 | Media | RF-21, RNF-07 |
| 17 | HU-18 | E4 | Reportes de abuso y desactivación de cuentas | 3 | Media | RF-22, RD-03 |
| 18 | HU-08 | E2 | Validación de calidad de fotos y guía para «Piel» | 5 | Baja | RF-11 |
| | | | **Total** | **97** | | |

Por épica: E1 = 29 SP, E2 = 36 SP, E3 = 19 SP, E4 = 13 SP. Por prioridad: Alta = 76 SP (12 historias), Media = 21 SP (5 historias), Baja = 5 SP (1 historia).

---

## Épica E1: Familia y círculo médico

Lo que la familia necesita antes de abrir su primera conversación: cuenta, perfiles de las personas que cuida, cocuidador y los médicos que ya conoce.

### HU-01: Acceso a la cuenta familiar

**Como** cuidador principal, **quiero** crear una cuenta familiar, iniciar sesión y recuperar el acceso si olvido la contraseña, **para** tener un espacio propio y seguro donde hablar de la salud de mi familia fuera de WhatsApp.

**Criterios de aceptación**

1. **Dado que** una persona sin cuenta captura un correo válido, una contraseña de al menos 8 caracteres y marca las tres declaraciones, **cuando** envía el registro, **entonces** se crea la familia con ella como cuidador principal, se guarda la fecha y versión del aviso aceptado y se abre su sesión. (RF-01-AC-1)
2. **Dado que** una persona dejó sin marcar alguna de las tres declaraciones, **cuando** envía el registro, **entonces** no se crea la cuenta y se señala la declaración faltante con «Necesitamos esta autorización para usar DAFI.» (RF-01-AC-2)
3. **Dado que** con `MAX_INTENTOS_LOGIN` = 5 y `MINUTOS_BLOQUEO` = 15 hubo 5 intentos fallidos para un correo desde una IP, **cuando** se hace un sexto intento desde esa IP, **entonces** la API responde `BLOQUEADO` durante 15 minutos. (RF-02-AC-3)
4. **Dado que** con `MINUTOS_ENLACE_RESTABLECER` = 30 un enlace de restablecimiento se generó hace 31 minutos, **cuando** la persona lo abre, **entonces** ve «El enlace venció. Solicite uno nuevo.» y no puede cambiar la contraseña. (RF-03-AC-2)

**Story Points:** 8. Tres flujos distintos (registro con verificación de correo, sesión con bloqueo por IP y restablecimiento) más hash de contraseñas y expiración de sesión; casi tres veces la referencia.
**Prioridad:** Alta. Nada funciona sin cuenta, y el registro es donde se recoge el consentimiento que exige RD-02.

### HU-02: Perfiles de los hijos y del propio cuidador

**Como** cuidador principal, **quiero** registrar un perfil por cada hijo y uno para mí, con alergias y medicamentos, **para** que cada conversación quede asociada a la persona correcta y el médico vea esos datos sin preguntarlos.

**Criterios de aceptación**

1. **Dado que** el cuidador captura nombre «Mateo» y fecha de nacimiento 12/03/2021, **cuando** guarda el perfil, **entonces** aparece en la lista de la familia con la edad calculada en años. (RF-04-AC-1)
2. **Dado que** el cuidador captura una fecha de nacimiento posterior a hoy, **cuando** guarda, **entonces** la API responde `DATOS_INVALIDOS` y el cliente muestra «Revise la fecha de nacimiento.» (RF-04-AC-2)
3. **Dado que** un cocuidador tiene sesión abierta, **cuando** intenta crear, editar o eliminar un perfil, **entonces** la API responde `SIN_PERMISOS`. (RF-04-AC-3)
4. **Dado que** el cuidador captura para un perfil de menor una fecha que da 18 años o más, **cuando** guarda, **entonces** el sistema no crea el perfil y le ofrece «Agregar a otro adulto». (RF-04-AC-5)

**Story Points:** 3. Un CRUD con dos validaciones, del mismo tamaño que la referencia.
**Prioridad:** Alta. Toda conversación pertenece a un perfil.

### HU-03: Perfil de otro adulto con su consentimiento

**Como** cuidador principal, **quiero** agregar el perfil de otro adulto de mi familia (por ejemplo, mi madre) y que ella autorice por correo que compartamos su información, **para** poder consultar a nuestros médicos sobre su salud con su permiso.

**Criterios de aceptación**

1. **Dado que** el cuidador crea el perfil «Elena», de 68 años, con su correo, **cuando** guarda, **entonces** el perfil queda «Pendiente de consentimiento» y Elena recibe un correo con el enlace. (RF-05-AC-1)
2. **Dado que** el perfil «Elena» sigue pendiente, **cuando** la familia intenta enviar una conversación sobre ella, **entonces** la API responde `CONSENTIMIENTO_PENDIENTE`, el borrador se conserva y el cliente muestra «Elena aún no autoriza que compartamos su información.» (RF-05-AC-2)
3. **Dado que** Elena había dado su consentimiento, **cuando** abre el enlace de revocación y confirma, **entonces** su perfil, conversaciones y fotos se borran, y el cuidador y los médicos involucrados reciben un aviso. (RF-05-AC-4)

**Story Points:** 5. Un flujo externo sin sesión (enlace con vigencia, aceptación y revocación) que además dispara el borrado en cascada de HU-17.
**Prioridad:** Media. La cliente de referencia consulta por sus hijos; los adultos amplían el producto pero no son parte del flujo mínimo.

### HU-04: Cocuidador

**Como** cuidador principal, **quiero** invitar a otro adulto de la familia como cocuidador, **para** que pueda abrir y seguir conversaciones cuando yo no esté disponible.

**Criterios de aceptación**

1. **Dado que** la persona invitada abre un enlace vigente y completa el registro con las tres declaraciones, **cuando** confirma, **entonces** su cuenta queda con rol cocuidador y ve los perfiles de menores y los de adulto compartidos con ella. (RF-06-AC-2)
2. **Dado que** la familia ya tiene un cocuidador, **cuando** el cuidador intenta enviar otra invitación, **entonces** la API responde `LIMITE_ALCANZADO` y el cliente muestra «Esta familia ya tiene otro adulto registrado.» (RF-06-AC-3)
3. **Dado que** el cuidador quita al cocuidador, **cuando** confirma, **entonces** el cocuidador pierde el acceso de inmediato y las conversaciones que registró se conservan en la familia. (RF-06-AC-4)

**Story Points:** 5. Reutiliza el registro de HU-01, pero agrega invitación con vigencia, un rol nuevo en la matriz de permisos y la salida voluntaria.
**Prioridad:** Media. La entrevista mostró que el padre también manda fotos, pero un solo cuidador basta para validar el flujo.

### HU-05: Círculo médico y permisos de historial

**Como** cuidador principal, **quiero** invitar por correo a los médicos que ya conozco y decidir, por perfil, si cada uno puede ver el historial completo, **para** consultar a personas de mi confianza y controlar qué información ve cada una.

**Criterios de aceptación**

1. **Dado que** el cuidador captura el correo de una persona sin cuenta, **cuando** envía la invitación, **entonces** se envía un enlace de registro válido por `DIAS_INVITACION` días y el círculo muestra «Esperando respuesta». (RF-07-AC-1)
2. **Dado que** la persona invitada completa el registro sin aceptar los términos de uso para médicos, **cuando** lo envía, **entonces** la API responde `DATOS_INVALIDOS` y la cuenta no se crea. (RF-07-AC-2)
3. **Dado que** «Compartir historial» de «Mateo» está apagado para el Dr. B, **cuando** el Dr. B solicita por su identificador una conversación de Mateo con la Dra. A, **entonces** la API responde `NO_ENCONTRADO`. (RF-08-AC-1)
4. **Dado que** el Dr. B tiene una conversación `EN_REVISION`, **cuando** el cuidador lo quita del círculo, **entonces** la conversación pasa a `SIN_MEDICO` y la familia ve «Este médico ya no atiende la conversación. Puede dirigirla a otro médico de su círculo.» (RF-08-AC-3)

**Story Points:** 8. Registro de médico por invitación, pertenencia a varias familias y la regla de visibilidad que después usan HU-12, HU-14 y HU-15.
**Prioridad:** Alta. Sin médico en el círculo no hay a quién enviar la conversación, y la regla de visibilidad protege datos sensibles (RD-02).

---

## Épica E2: Conversaciones de salud

El flujo central: la familia arma la conversación con contexto y fotos, la envía, el médico pregunta lo que falte y deja sus indicaciones.

### HU-06: Abrir una conversación con preguntas de contexto

**Como** cuidador, **quiero** abrir una conversación eligiendo perfil, etiquetas y médico, y responder las preguntas de contexto de esas etiquetas, **para** que mi médico reciba desde el principio la información que siempre me pide.

**Criterios de aceptación**

1. **Dado que** el círculo tiene a la Dra. A, **cuando** el cuidador abre una conversación para «Mateo» con la etiqueta «Fiebre» y el título «Fiebre desde anoche», **entonces** se crea en `BORRADOR` y se muestran las preguntas de la etiqueta. (RF-09-AC-1)
2. **Dado que** la conversación tiene las etiquetas «Fiebre» y «Respiratorio», **cuando** la familia abre el cuestionario, **entonces** ve G1 a G4, F1, F2, R1 y R2, cada pregunta una sola vez. (RF-10-AC-2)
3. **Dado que** la familia abre una conversación con cualquier etiqueta, **cuando** se muestra la primera pantalla, **entonces** aparece el aviso fijo de emergencias con el botón «Llamar al 911». (RF-13-AC-1)
4. **Dado que** dos conversaciones tienen F1 = 36.8 y F1 = 40.2, **cuando** la familia las consulta, **entonces** el aviso es idéntico en ambas y no aparece ningún otro mensaje del sistema sobre la salud del paciente. (RF-13-AC-2)

**Story Points:** 8. El cuestionario se arma desde un catálogo (agregar etiquetas no cambia el esquema, RNF-11) y combina preguntas de varias etiquetas sin duplicarlas.
**Prioridad:** Alta. Es el punto de entrada del flujo, y el criterio 4 es la prueba de que DAFI cumple RD-01 (no evalúa la salud).

### HU-07: Agregar fotos desde la cámara o la galería

**Como** cuidador, **quiero** agregar fotos desde la cámara o la galería (incluidas las que recibí por WhatsApp), **para** que mi médico vea lo que me preocupa sin que yo tenga que pensar en el formato o el tamaño.

**Criterios de aceptación**

1. **Dado que** una madre elige una foto HEIC de 4032 × 3024 píxeles, **cuando** la agrega, **entonces** la API recibe un JPEG con lado mayor de `LADO_MAX_PX` píxeles o menos y sin EXIF. (RF-11-AC-1)
2. **Dado que** con `MAX_FOTOS` = 6 la conversación ya tiene 6 fotos, **cuando** la familia intenta agregar otra, **entonces** la API responde `LIMITE_ALCANZADO`. (RF-11-AC-4)
3. **Dado que** la API recibe directamente un archivo que no es JPEG o que pesa más de 1 048 576 bytes, **cuando** lo procesa, **entonces** responde `ARCHIVO_INVALIDO` sin guardarlo. (RF-11-AC-5)
4. **Dado que** la familia respondió P1 con «zona del pañal o genital», **cuando** pulsa «Tomar foto», **entonces** el sistema muestra antes de abrir la cámara «Las fotos de esta zona solo las verá su médico y no se podrán descargar.» (RF-11-AC-6)

**Story Points:** 8. Conversión de HEIC y reducción en el navegador, almacenamiento privado sin URL públicas y pruebas en Chrome para Android y Safari para iOS.
**Prioridad:** Alta. Las fotos son opcionales en el SRS, pero en la entrevista eran la forma natural de consultar por la piel, y las protecciones de RNF-06 aplican a menores.

### HU-08: Validación de calidad de fotos y guía para «Piel»

**Como** cuidador, **quiero** que la app me avise si una foto salió borrosa u oscura y me guíe sobre cómo tomarlas, **para** no tener que mandar otra cuando el médico me la pida.

**Criterios de aceptación**

1. **Dado que** con `UMBRAL_NITIDEZ` = 100 una foto tiene nitidez de 40, **cuando** se valida, **entonces** no se agrega y se muestra «La foto salió borrosa. Acérquese y mantenga el teléfono quieto.» (RF-11-AC-2)
2. **Dado que** con `UMBRAL_BRILLO_MIN` = 50 una foto nítida tiene brillo promedio de 30, **cuando** se valida, **entonces** no se agrega y se muestra «La foto está muy oscura. Busque luz natural.» (RF-11-AC-3)
3. **Dado que** la conversación tiene la etiqueta «Piel», **cuando** la familia va a agregar la primera foto, **entonces** ve la guía de tres tomas (de cerca, a media distancia y desde otro ángulo). (RF-11)

**Story Points:** 5. Procesamiento de imagen en el servidor (laplaciano y luminancia) y un conjunto de imágenes de prueba versionado para calibrar umbrales.
**Prioridad:** Baja. Mejora la calidad de lo que recibe el médico, pero él ya puede pedir otra foto con HU-10.

### HU-09: Revisión y envío

**Como** cuidador, **quiero** ver una lista de lo que falta antes de enviar y que el envío no se pierda ni se duplique si falla la conexión, **para** tener la certeza de que mi médico recibió toda la información.

**Criterios de aceptación**

1. **Dado que** un borrador tiene médico elegido y le falta G2, **cuando** la familia lo revisa, **entonces** la lista muestra «Falta: ¿Qué le preocupa?» y el botón «Enviar a mi médico» está deshabilitado. (RF-12-AC-1)
2. **Dado que** un borrador tiene los tres puntos completos, **cuando** la familia pulsa «Enviar a mi médico», **entonces** pasa a `ENVIADA`, lo enviado queda de solo lectura y la familia ve «Enviamos la conversación a su médico.» (RF-12-AC-2)
3. **Dado que** la API recibe el envío de un borrador sin G1 saltándose el cliente, **cuando** lo procesa, **entonces** responde `CONVERSACION_INCOMPLETA` con los puntos faltantes y el borrador sigue en `BORRADOR`. (RF-12-AC-3)
4. **Dado que** la API ya procesó un envío con cierta `Idempotency-Key`, **cuando** recibe otra petición con la misma clave, **entonces** no lo duplica y devuelve el resultado del primero. (RF-23-AC-3)

**Story Points:** 5. Validación en cliente y API, una transición de estado y el mecanismo de idempotencia que luego reutilizan fotos y mensajes.
**Prioridad:** Alta. Sin envío no hay flujo.

### HU-10: Mensajes y solicitud de información

**Como** médico, **quiero** escribir mensajes y pedirle a la familia más fotos o datos dentro de la conversación, **para** completar lo que necesito antes de dar una indicación.

**Criterios de aceptación**

1. **Dado que** una conversación está `EN_REVISION`, **cuando** el médico pulsa «Pedir información» y escribe «Mándeme una foto con una moneda al lado», **entonces** pasa a `INFO_SOLICITADA` y la familia recibe una notificación con ese texto. (RF-14-AC-1)
2. **Dado que** una conversación está en `INFO_SOLICITADA`, **cuando** la familia agrega una foto válida o un mensaje y pulsa «Responder», **entonces** vuelve a `EN_REVISION` y la respuesta aparece con fecha y autor. (RF-14-AC-2)
3. **Dado que** una conversación está `CERRADA`, **cuando** cualquiera intenta enviar un mensaje, **entonces** la API responde `TRANSICION_INVALIDA` y el cliente muestra «Esta conversación está cerrada. Abra una nueva si algo cambió.» (RF-14-AC-3)

**Story Points:** 5. Dos transiciones de estado y eventos nuevos sobre lo ya enviado, con autoría de tres roles.
**Prioridad:** Alta. La entrevista mostró que la médica siempre pide más fotos o pregunta antes de opinar.

### HU-11: Indicaciones del médico y cierre

**Como** médico, **quiero** registrar mis indicaciones y, si aplica, una decisión (cuidado en casa, consulta presencial o urgencias), **para** dejarle a la familia una respuesta clara que quede en el historial.

**Criterios de aceptación**

1. **Dado que** una conversación está `EN_REVISION`, **cuando** el médico registra «Paracetamol según su peso cada 6 horas; si sigue igual mañana, me escribe.» sin decisión, **entonces** pasa a `CON_INDICACIONES` y la familia ve el texto, el nombre del médico con «Contacto agregado por usted» y la fecha. (RF-15-AC-1)
2. **Dado que** el médico marca «Consulta presencial», **cuando** intenta guardar sin plazo en días, **entonces** la API responde `DATOS_INVALIDOS`. (RF-15-AC-2)
3. **Dado que** con `DIAS_CIERRE_AUTOMATICO` = 14 el último evento de una conversación `CON_INDICACIONES` tiene 14 días y 1 minuto, **cuando** corre el proceso programado, **entonces** pasa a `CERRADA`; si tiene 13 días, sigue `CON_INDICACIONES`. (RF-15-AC-3)

**Story Points:** 5. Validación condicional, sustitución de indicaciones vigentes y un proceso programado con reloj inyectable.
**Prioridad:** Alta. Es el cierre del flujo mínimo.

---

## Épica E3: Contexto para el médico

Lo que ve el médico: su bandeja, el detalle de cada conversación, el resumen de contexto y el historial del paciente.

### HU-12: Bandeja y detalle para el médico

**Como** médico, **quiero** una bandeja que separe lo que la familia marcó como prioritario, lo que espera mi respuesta y lo que espera a la familia, **para** atender primero lo que lleva más tiempo sin respuesta.

**Criterios de aceptación**

1. **Dado que** el médico tiene tres conversaciones `ENVIADA`, una con prioridad indicada por la familia, **cuando** abre su bandeja, **entonces** esa aparece en «Prioridad indicada por la familia» y las otras dos en «Esperan su respuesta», de la más antigua a la más reciente. (RF-16-AC-1)
2. **Dado que** el médico abre una conversación `ENVIADA` por primera vez, **cuando** se carga el detalle, **entonces** pasa a `EN_REVISION`, la familia ve «Su médico está revisando la conversación.» y queda registrado quién la abrió y cuándo. (RF-16-AC-2, RNF-08)
3. **Dado que** el médico pertenece al círculo de dos familias, **cuando** abre su bandeja, **entonces** ve las conversaciones de ambas con el nombre de familia y paciente, y puede filtrar por familia. (RF-16-AC-4)

**Story Points:** 5. Tres secciones con reglas de orden distintas, registro de accesos y vista en celular y escritorio.
**Prioridad:** Alta. Es la pantalla principal del médico.

### HU-13: Resumen de contexto, datos del perfil y estructura

**Como** médico, **quiero** ver arriba de cada conversación las alergias y medicamentos del paciente en un bloque de resumen, **para** tenerlos presentes sin buscarlos.

**Criterios de aceptación**

1. **Dado que** «Mateo» tiene la alergia «penicilina» registrada en su perfil, **cuando** la médica abre una conversación de Mateo, **entonces** ve bajo el título «Resumen automático del historial. Verifique en los mensajes originales.» el grupo «Alergias y medicamentos» con «penicilina» y la fuente «Perfil». (RF-17-AC-1, parcial)
2. **Dado que** el perfil no tiene conversaciones anteriores visibles para el médico, **cuando** abre la conversación, **entonces** el resumen muestra solo los datos del perfil y «No hay conversaciones anteriores que pueda ver.» (RF-17-AC-4)
3. **Dado que** la familia desactivó el resumen para «Mateo», **cuando** el médico abre una conversación de Mateo, **entonces** ve «La familia desactivó el resumen automático». (RF-17-AC-5)

**Story Points:** 3. Lectura directa del perfil y una pantalla; no usa el modelo de lenguaje. Mismo tamaño que la referencia.
**Prioridad:** Alta. Entrega valor al médico desde el primer sprint en que haya conversaciones y deja lista la estructura para HU-14.

### HU-14: Resumen de contexto, citas del historial verificadas

**Como** médico, **quiero** ver citas textuales del historial (episodios anteriores con la misma etiqueta e indicaciones previas) con enlace a su origen, **para** no releer todo el historial y poder verificar cada dato.

**Criterios de aceptación**

1. **Dado que** «Mateo» tiene una conversación anterior de «Piel» donde la médica escribió el 12/08 «Use crema de óxido de zinc dos veces al día», **cuando** ella abre una conversación nueva de Mateo con «Piel», **entonces** el grupo «Indicaciones previas» muestra esa cita con autor, fecha 12/08 y enlace. (RF-17-AC-1)
2. **Dado que** el módulo de resumen simulado devuelve una cita cuyo texto no aparece en el evento que dice citar, **cuando** la API prepara el resumen, **entonces** la descarta y muestra las demás. (RF-17-AC-2)
3. **Dado que** «Compartir historial» está apagado para la Dra. A, **cuando** ella abre una conversación del perfil, **entonces** la petición al módulo no incluye eventos de conversaciones con otros médicos ni nombre, fecha de nacimiento o correo del paciente. (RF-17-AC-3, RNF-12)
4. **Dado que** con `TIMEOUT_RESUMEN_S` = 20 el módulo no responde en 20 s, **cuando** el médico abre la conversación, **entonces** ve la conversación completa y «Resumen no disponible. Puede consultar el historial completo.» (RF-23-AC-1)

**Story Points:** 8. Integración con un servicio externo, verificación textual de cada cita, anonimización de la petición, manejo de fallas y la evaluación de RNF-09 con 20 historiales sintéticos. Es la historia con más incertidumbre técnica del backlog.
**Prioridad:** Alta. Es lo que distingue a DAFI de un chat con formularios y lo que le ahorra tiempo al médico; si el médico no percibe ese ahorro, no deja WhatsApp.

### HU-15: Historial del paciente

**Como** cuidador, **quiero** consultar todas las conversaciones de un perfil en orden y filtrarlas por etiqueta o médico, **para** seguir la evolución de mi hijo y recordar qué me indicaron antes.

**Criterios de aceptación**

1. **Dado que** «Mateo» tiene conversaciones del 1 y del 20 de septiembre, **cuando** el cuidador abre su historial, **entonces** ve primero la del 20 y luego la del 1, cada una con estado, etiquetas, médico, fecha e indicaciones. (RF-18-AC-1)
2. **Dado que** el cuidador filtra el historial por «Piel», **cuando** se aplica el filtro, **entonces** solo aparecen conversaciones con esa etiqueta. (RF-18-AC-2)
3. **Dado que** una conversación tiene respuestas iniciales, un mensaje del médico, una foto posterior e indicaciones, **cuando** la familia la abre, **entonces** ve los eventos en orden cronológico con fecha, hora y autor. (RF-18-AC-3)

**Story Points:** 3 (referencia). Consulta y filtros sobre datos que ya existen; la regla de visibilidad del médico se hereda de HU-05.
**Prioridad:** Media. Cada conversación ya se puede consultar por separado; el historial agrega la vista de conjunto.

---

## Épica E4: Privacidad y confianza

Avisos que no exponen datos de salud, control de la familia sobre lo que se borra y un canal para reportar abusos.

### HU-16: Notificaciones y aviso por falta de respuesta

**Como** cuidador, **quiero** recibir avisos cuando mi médico responde o cuando no ha abierto la conversación a tiempo, sin que el correo muestre datos de salud, **para** enterarme sin exponer la información de mi familia y saber cuándo buscar otra opción.

**Criterios de aceptación**

1. **Dado que** se envía una conversación con prioridad indicada por la familia, **cuando** se guarda el envío, **entonces** el médico recibe un correo con el asunto «Una familia le pidió respuesta pronto en DAFI», sin datos del paciente. (RF-19-AC-2)
2. **Dado que** el médico registra indicaciones, **cuando** se guardan, **entonces** cuidador y cocuidador reciben un correo con el asunto «Su médico respondió en DAFI» y un enlace, sin nombre del paciente ni texto de las indicaciones. (RF-19-AC-1)
3. **Dado que** con `HORAS_SIN_RESPUESTA` = 4 una conversación sin prioridad lleva 4 horas y 1 minuto en `ENVIADA`, **cuando** corre el proceso programado, **entonces** la familia recibe el texto fijo de RF-20-AC-1. (RF-20-AC-1)
4. **Dado que** el médico abrió la conversación a las 3 horas de enviada, **cuando** corre el proceso a las 4 horas y 1 minuto, **entonces** no se envía el aviso. (RF-20-AC-2)

**Story Points:** 5. Siete eventos de notificación en app y correo, y un proceso programado con dos plazos y aviso único por conversación.
**Prioridad:** Alta. Sin aviso, el médico no se entera de que le escribieron; ese aviso es lo que hoy le da WhatsApp.

### HU-17: Eliminación de datos

**Como** cuidador, **quiero** borrar fotos, conversaciones, perfiles o la cuenta completa de forma definitiva, **para** decidir yo qué información de salud de mi familia se conserva.

**Criterios de aceptación**

1. **Dado que** una conversación está en `BORRADOR`, **cuando** la familia borra una de sus fotos, **entonces** la foto desaparece de la conversación y del almacenamiento. (RF-21-AC-1)
2. **Dado que** una conversación fue enviada, **cuando** la familia intenta borrar solo una foto, **entonces** el sistema lo impide y ofrece borrar la conversación completa. (RF-21-AC-2)
3. **Dado que** el cocuidador confirma el borrado de una conversación `CON_INDICACIONES`, **cuando** se procesa, **entonces** se borran conversación, fotos y eventos, el médico recibe «La familia eliminó una conversación enviada el 20/09» y queda solo el registro mínimo. (RF-21-AC-3)

**Story Points:** 5. Borrado físico en cascada sobre base de datos y almacenamiento de archivos, con permisos distintos por rol.
**Prioridad:** Media. La cliente lo pidió expresamente y la LFPDPPP lo exige, pero debe estar listo antes de cualquier prueba con usuarios reales, no antes del flujo mínimo.

### HU-18: Reportes de abuso y desactivación de cuentas

**Como** cuidador, cocuidador o médico, **quiero** reportar a otra cuenta por suplantación o mensajes ofensivos, **para** que el administrador la revise y la desactive si corresponde.

**Criterios de aceptación**

1. **Dado que** un cuidador reporta a un médico con el motivo «No es médico», **cuando** se guarda, **entonces** el administrador ve el reporte con motivo, fecha y cuentas involucradas, sin mensajes ni fotos. (RF-22-AC-1)
2. **Dado que** el administrador tiene sesión abierta, **cuando** solicita cualquier conversación, foto o perfil, **entonces** la API responde `SIN_PERMISOS`. (RF-22-AC-2)
3. **Dado que** el administrador desactiva la cuenta de un médico, **cuando** ese médico intenta usar su sesión, **entonces** la API lo rechaza y sus conversaciones abiertas pasan a `SIN_MEDICO`. (RF-22-AC-3)

**Story Points:** 3. Un formulario, una vista de administrador sin datos clínicos y la desactivación, que reutiliza la transición a `SIN_MEDICO` de HU-05.
**Prioridad:** Media. Como DAFI no verifica cédulas (RD-03), el reporte es la única defensa contra alguien que se haga pasar por médico.

---

## Definition of Done

Una historia se considera terminada cuando:

- Cada criterio de aceptación tiene una prueba automatizada con el identificador `RF-XX-AC-Y` en el nombre.
- Las pantallas funcionan en 360 px de ancho en Chrome para Android y Safari para iOS (RNF-03).
- La API aplica la matriz de roles y el contrato de errores de la sección 3.0 del SRS.
- Toda comunicación usa TLS 1.2 o superior y no hay datos de salud, contraseñas ni tokens en registros, correos ni URL (RNF-05, RNF-13, RF-19).
- El flujo se puede completar solo con teclado y ningún estado se comunica únicamente con color (RNF-14).
- El cambio está desplegado en el ambiente del curso y ese ambiente cumple la disponibilidad de RNF-10.

RNF-04 (enviar una conversación en 3 minutos o menos) se valida con usuarios una vez que HU-06, HU-07 y HU-09 estén terminadas.

## Dependencias e impedimentos

- **RD-05:** un médico debe revisar las preguntas de contexto y los textos de los avisos antes de la primera versión, y el equipo aún no define quién. Bloquea la liberación de HU-06 y HU-16, no su desarrollo.
- **Proveedor del modelo de lenguaje:** se decide en S04 y bloquea HU-14. Antes de comprometer HU-14 se hace una prueba técnica de la verificación de citas; si falla, HU-14 baja a Media (ver `priorizacion_comparada.md`).
- **Liberación a familias reales:** ninguna familia real usa DAFI hasta que HU-17 esté terminada.
- **Recorte de alcance:** si el calendario lo exige, HU-18 es la primera historia que sale.
