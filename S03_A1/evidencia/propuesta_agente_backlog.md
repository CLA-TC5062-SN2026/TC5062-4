# Product Backlog de DAFI (propuesta del agente)

**Fuente:** `SRS_equipo.md`, versión 3.0 de equipo (octubre de 2026).
**Contenido:** 4 épicas, 15 historias de usuario (HU-01 a HU-15), 99 story points.

Las épicas siguen la misma división que ya usa el SRS (E1 a E4), para que la trazabilidad SRS → backlog → API → pruebas no cambie de nombres entre documentos. Los criterios de aceptación de cada historia se toman o se condensan de los `RF-XX-AC-Y` del SRS; entre paréntesis se indica de cuál salen.

**Escala de estimación:** Fibonacci (1, 2, 3, 5, 8, 13). La referencia es HU-12 (historial del paciente) = 3 puntos: una consulta con filtro sobre datos que ya existen y una pantalla.

**Prioridad:** Alta = sin ella no existe el flujo mínimo familia → médico → indicaciones; Media = necesaria para la versión 1, pero el flujo mínimo funciona sin ella; Baja = puede entrar en los últimos sprints.

---

## Resumen del backlog

| ID | Épica | Historia (resumida) | SP | Prioridad | RF / RNF / RD cubiertos |
|---|---|---|---|---|---|
| HU-01 | E1 | Crear cuenta, iniciar sesión y recuperar acceso | 8 | Alta | RF-01, RF-02, RF-03, RNF-05, RD-02 |
| HU-02 | E1 | Crear perfiles de pacientes (menores, propio y otro adulto con consentimiento) | 8 | Alta | RF-04, RF-05, RD-02 |
| HU-03 | E1 | Invitar y quitar al cocuidador | 5 | Media | RF-06 |
| HU-04 | E1 | Invitar médicos al círculo y decidir qué historial ve cada uno | 8 | Alta | RF-07, RF-08, RD-03 |
| HU-05 | E2 | Abrir una conversación con etiquetas y preguntas de contexto | 8 | Alta | RF-09, RF-10, RF-13, RD-01, RD-05, RD-07, RNF-11 |
| HU-06 | E2 | Agregar fotos válidas y sin metadatos | 13 | Alta | RF-11, RNF-02, RNF-06 |
| HU-07 | E2 | Revisar y enviar la conversación al médico | 5 | Alta | RF-12, RF-23 (AC-2, AC-3), RNF-04 |
| HU-08 | E2 | Intercambiar mensajes y pedir/responder información | 5 | Alta | RF-14 |
| HU-09 | E2 | Registrar indicaciones y cerrar la conversación | 5 | Alta | RF-15 |
| HU-10 | E3 | Bandeja del médico y detalle de la conversación | 5 | Alta | RF-16, RNF-01, RNF-03, RNF-08 |
| HU-11 | E3 | Resumen de contexto con citas verificables | 13 | Media | RF-17, RF-23 (AC-1), RNF-01, RNF-09, RNF-12, RD-06 |
| HU-12 | E3 | Consultar el historial del paciente | 3 | Media | RF-18 |
| HU-13 | E4 | Notificaciones sin contenido clínico y aviso por falta de respuesta | 5 | Alta | RF-19, RF-20, RD-01 |
| HU-14 | E4 | Eliminar fotos, conversaciones, perfiles o la cuenta | 5 | Media | RF-21, RNF-07 |
| HU-15 | E4 | Reportar abuso y desactivar cuentas | 3 | Baja | RF-22 |
| | | **Total** | **99** | | |

Puntos por épica: E1 = 29, E2 = 36, E3 = 21, E4 = 13.

---

## Épica E1: Familia y círculo médico

Todo lo que la familia necesita antes de abrir la primera conversación: cuenta, perfiles de las personas que cuida, cocuidador y los médicos que ya conoce.

### HU-01: Acceso a la cuenta familiar

**Como** cuidador principal, **quiero** crear una cuenta familiar, iniciar sesión y recuperar el acceso si olvido la contraseña, **para** tener un espacio propio y seguro donde hablar de la salud de mi familia fuera de WhatsApp.

**Criterios de aceptación**

1. **Dado que** una persona sin cuenta captura un correo válido, una contraseña de al menos 8 caracteres y marca las tres declaraciones, **cuando** envía el registro, **entonces** se crea la familia con ella como cuidador principal, se guarda la fecha y versión del aviso aceptado y se abre su sesión. (RF-01-AC-1)
2. **Dado que** una persona dejó sin marcar alguna de las tres declaraciones, **cuando** envía el registro, **entonces** no se crea la cuenta y se señala la declaración faltante con «Necesitamos esta autorización para usar DAFI.» (RF-01-AC-2)
3. **Dado que** con `MAX_INTENTOS_LOGIN` = 5 y `MINUTOS_BLOQUEO` = 15 hubo 5 intentos fallidos para un correo desde una IP, **cuando** se hace un sexto intento desde esa IP, **entonces** la API responde `BLOQUEADO` durante 15 minutos. (RF-02-AC-3)
4. **Dado que** con `MINUTOS_ENLACE_RESTABLECER` = 60 un enlace de restablecimiento se generó hace 61 minutos, **cuando** la persona lo abre, **entonces** ve «El enlace venció. Solicite uno nuevo.» y no puede cambiar la contraseña. (RF-03-AC-2)

**Story Points:** 8. Son tres flujos (registro con verificación de correo, sesión con bloqueo por IP y restablecimiento) más el hash de contraseñas y la expiración de sesión.
**Prioridad:** Alta.
**Cubre:** RF-01, RF-02, RF-03, RNF-05, RD-02.

### HU-02: Perfiles de pacientes

**Como** cuidador principal, **quiero** registrar un perfil por cada hijo, uno para mí y uno para otro adulto que lo autorice, **para** que cada conversación quede asociada a la persona correcta con sus alergias y medicamentos.

**Criterios de aceptación**

1. **Dado que** el cuidador captura nombre «Mateo» y fecha de nacimiento 12/03/2021, **cuando** guarda el perfil, **entonces** aparece en la lista de la familia con la edad calculada en años. (RF-04-AC-1)
2. **Dado que** el cuidador captura una fecha de nacimiento posterior a hoy, **cuando** guarda, **entonces** la API responde `DATOS_INVALIDOS` y el cliente muestra «Revise la fecha de nacimiento.» (RF-04-AC-2)
3. **Dado que** el cuidador crea el perfil «Elena», de 68 años, con su correo, **cuando** guarda, **entonces** el perfil queda «Pendiente de consentimiento» y Elena recibe un correo con el enlace. (RF-05-AC-1)
4. **Dado que** el perfil «Elena» sigue pendiente de consentimiento, **cuando** la familia intenta enviar una conversación sobre ella, **entonces** la API responde `CONSENTIMIENTO_PENDIENTE` y el borrador se conserva. (RF-05-AC-2)

**Story Points:** 8. CRUD de perfiles más un flujo de consentimiento externo con enlace, revocación y borrado en cascada.
**Prioridad:** Alta.
**Cubre:** RF-04, RF-05, RD-02.

### HU-03: Cocuidador

**Como** cuidador principal, **quiero** invitar a otro adulto de la familia como cocuidador, **para** que pueda abrir y seguir conversaciones cuando yo no esté disponible.

**Criterios de aceptación**

1. **Dado que** la persona invitada abre un enlace vigente y completa el registro con las tres declaraciones, **cuando** confirma, **entonces** su cuenta queda con rol cocuidador y ve los perfiles de menores y los de adulto compartidos con ella. (RF-06-AC-2)
2. **Dado que** la familia ya tiene un cocuidador, **cuando** el cuidador intenta enviar otra invitación, **entonces** la API responde `LIMITE_ALCANZADO` y el cliente muestra «Esta familia ya tiene otro adulto registrado.» (RF-06-AC-3)
3. **Dado que** el cuidador quita al cocuidador, **cuando** confirma, **entonces** el cocuidador pierde el acceso de inmediato y las conversaciones que registró se conservan en la familia. (RF-06-AC-4)

**Story Points:** 5. Reutiliza el registro de HU-01, pero agrega invitación con vigencia, rol nuevo y salida voluntaria.
**Prioridad:** Media.
**Cubre:** RF-06.

### HU-04: Círculo médico y permisos de historial

**Como** cuidador principal, **quiero** invitar por correo a los médicos que ya conozco y decidir, por perfil, si cada uno puede ver el historial completo, **para** consultar a personas de mi confianza y controlar qué información ve cada una.

**Criterios de aceptación**

1. **Dado que** el cuidador captura el correo de una persona sin cuenta, **cuando** envía la invitación, **entonces** se envía un enlace de registro válido por `DIAS_INVITACION` días y el círculo muestra «Esperando respuesta». (RF-07-AC-1)
2. **Dado que** la persona invitada completa el registro sin aceptar los términos de uso para médicos, **cuando** lo envía, **entonces** la API responde `DATOS_INVALIDOS` y la cuenta no se crea. (RF-07-AC-2)
3. **Dado que** «Compartir historial» de «Mateo» está apagado para el Dr. B, **cuando** el Dr. B solicita por su identificador una conversación de Mateo con la Dra. A, **entonces** la API responde `NO_ENCONTRADO`. (RF-08-AC-1)
4. **Dado que** el Dr. B tiene una conversación `EN_REVISION`, **cuando** el cuidador lo quita del círculo, **entonces** la conversación pasa a `SIN_MEDICO` y la familia puede dirigirla a otro médico del círculo. (RF-08-AC-3)

**Story Points:** 8. Registro de médico por invitación, pertenencia a varias familias y la regla de visibilidad que luego usan HU-10, HU-11 y HU-12.
**Prioridad:** Alta.
**Cubre:** RF-07, RF-08, RD-03.

---

## Épica E2: Conversaciones de salud

El flujo central: la familia arma la conversación con contexto y fotos, la envía, el médico pregunta lo que falte y deja sus indicaciones.

### HU-05: Abrir una conversación con preguntas de contexto

**Como** cuidador, **quiero** abrir una conversación eligiendo perfil, etiquetas y médico, y responder las preguntas de contexto de esas etiquetas, **para** que mi médico reciba desde el principio la información que siempre me pide.

**Criterios de aceptación**

1. **Dado que** el círculo tiene a la Dra. A, **cuando** el cuidador abre una conversación para «Mateo» con la etiqueta «Fiebre» y el título «Fiebre desde anoche», **entonces** se crea en `BORRADOR` y se muestran las preguntas de la etiqueta. (RF-09-AC-1)
2. **Dado que** la conversación tiene las etiquetas «Fiebre» y «Respiratorio», **cuando** la familia abre el cuestionario, **entonces** ve G1 a G4, F1, F2, R1 y R2, cada pregunta una sola vez. (RF-10-AC-2)
3. **Dado que** la familia captura 39.5 en F1, **cuando** guarda, **entonces** se registra el valor sin ninguna interpretación ni mensaje adicional. (RF-10-AC-4)
4. **Dado que** la familia abre una conversación con cualquier etiqueta, **cuando** se muestra la primera pantalla, **entonces** aparece el aviso fijo de emergencias con el botón «Llamar al 911». (RF-13-AC-1)

**Story Points:** 8. El cuestionario se arma desde un catálogo (sin cambiar esquema al agregar etiquetas) y combina preguntas de varias etiquetas sin duplicar.
**Prioridad:** Alta.
**Cubre:** RF-09, RF-10, RF-13, RD-01, RD-05, RD-07, RNF-11.

### HU-06: Fotos de la conversación

**Como** cuidador, **quiero** agregar fotos desde la cámara o la galería (incluidas las que recibí por WhatsApp), **para** que mi médico vea lo que me preocupa sin que yo tenga que preocuparme por el formato o el tamaño.

**Criterios de aceptación**

1. **Dado que** una madre elige una foto HEIC de 4032 × 3024 píxeles, **cuando** la agrega, **entonces** la API recibe un JPEG con lado mayor de `LADO_MAX_PX` píxeles o menos y sin EXIF. (RF-11-AC-1)
2. **Dado que** con `UMBRAL_NITIDEZ` = 100 una foto tiene nitidez de 40, **cuando** se valida, **entonces** no se agrega y se muestra «La foto salió borrosa. Acérquese y mantenga el teléfono quieto.» (RF-11-AC-2)
3. **Dado que** con `MAX_FOTOS` = 6 la conversación ya tiene 6 fotos, **cuando** la familia intenta agregar otra, **entonces** la API responde `LIMITE_ALCANZADO`. (RF-11-AC-4)
4. **Dado que** la familia respondió P1 con «zona del pañal o genital», **cuando** pulsa «Tomar foto», **entonces** el sistema muestra antes de abrir la cámara «Las fotos de esta zona solo las verá su médico y no se podrán descargar.» (RF-11-AC-6)

**Story Points:** 13. Conversión HEIC y reducción en el navegador, validación de nitidez y brillo en el servidor, almacenamiento privado y pruebas en dos navegadores móviles.
**Prioridad:** Alta.
**Cubre:** RF-11, RNF-02, RNF-06.

### HU-07: Revisión y envío

**Como** cuidador, **quiero** ver una lista de lo que falta antes de enviar y que el envío no se pierda ni se duplique si falla la conexión, **para** estar segura de que mi médico recibió toda la información.

**Criterios de aceptación**

1. **Dado que** un borrador tiene médico elegido y le falta G2, **cuando** la familia lo revisa, **entonces** la lista muestra «Falta: ¿Qué le preocupa?» y el botón «Enviar a mi médico» está deshabilitado. (RF-12-AC-1)
2. **Dado que** un borrador tiene los tres puntos completos, **cuando** la familia pulsa «Enviar a mi médico», **entonces** pasa a `ENVIADA`, lo enviado queda de solo lectura y la familia ve «Enviamos la conversación a su médico.» (RF-12-AC-2)
3. **Dado que** la API recibe el envío de un borrador sin G1 saltándose el cliente, **cuando** lo procesa, **entonces** responde `CONVERSACION_INCOMPLETA` con los puntos faltantes y el borrador sigue en `BORRADOR`. (RF-12-AC-3)
4. **Dado que** la API ya procesó un envío con cierta `Idempotency-Key`, **cuando** recibe otra petición con la misma clave, **entonces** no lo duplica y devuelve el resultado del primero. (RF-23-AC-3)

**Story Points:** 5. Validación doble (cliente y API), transición de estado e idempotencia, que se reutiliza en fotos y mensajes.
**Prioridad:** Alta.
**Cubre:** RF-12, RF-23 (AC-2, AC-3), RNF-04.

### HU-08: Mensajes y solicitud de información

**Como** médico, **quiero** escribir mensajes y pedirle a la familia más fotos o datos dentro de la conversación, **para** completar lo que necesito antes de dar una indicación.

**Criterios de aceptación**

1. **Dado que** una conversación está `EN_REVISION`, **cuando** el médico pulsa «Pedir información» y escribe «Mándeme una foto con una moneda al lado», **entonces** pasa a `INFO_SOLICITADA` y la familia recibe una notificación con ese texto. (RF-14-AC-1)
2. **Dado que** una conversación está en `INFO_SOLICITADA`, **cuando** la familia agrega una foto válida o un mensaje y pulsa «Responder», **entonces** vuelve a `EN_REVISION` y la respuesta aparece con fecha y autor. (RF-14-AC-2)
3. **Dado que** una conversación está `CERRADA`, **cuando** cualquiera intenta enviar un mensaje, **entonces** la API responde `TRANSICION_INVALIDA` y el cliente muestra «Esta conversación está cerrada. Abra una nueva si algo cambió.» (RF-14-AC-3)

**Story Points:** 5. Dos transiciones de estado y eventos nuevos sobre lo ya enviado, con autoría de tres roles posibles.
**Prioridad:** Alta.
**Cubre:** RF-14.

### HU-09: Indicaciones y cierre

**Como** médico, **quiero** registrar mis indicaciones y, si aplica, una decisión (cuidado en casa, consulta presencial o urgencias), **para** dejarle a la familia una respuesta clara que quede guardada en el historial.

**Criterios de aceptación**

1. **Dado que** una conversación está `EN_REVISION`, **cuando** el médico registra «Paracetamol según su peso cada 6 horas; si sigue igual mañana, me escribe.» sin decisión, **entonces** pasa a `CON_INDICACIONES` y la familia ve el texto, el nombre del médico con «Contacto agregado por usted» y la fecha. (RF-15-AC-1)
2. **Dado que** el médico marca «Consulta presencial», **cuando** intenta guardar sin plazo en días, **entonces** la API responde `DATOS_INVALIDOS`. (RF-15-AC-2)
3. **Dado que** con `DIAS_CIERRE_AUTOMATICO` = 14 el último evento de una conversación `CON_INDICACIONES` tiene 14 días y 1 minuto, **cuando** corre el proceso programado, **entonces** pasa a `CERRADA`; si tiene 13 días, sigue `CON_INDICACIONES`. (RF-15-AC-3)

**Story Points:** 5. Registro con validación condicional, sustitución de indicaciones vigentes y un proceso programado con reloj inyectable.
**Prioridad:** Alta.
**Cubre:** RF-15.

---

## Épica E3: Contexto para el médico

Lo que ve el médico: su bandeja, el detalle de cada conversación, el resumen automático y el historial del paciente.

### HU-10: Bandeja y detalle para el médico

**Como** médico, **quiero** una bandeja que separe lo que la familia marcó como prioritario, lo que espera mi respuesta y lo que espera a la familia, **para** atender primero lo que lleva más tiempo sin respuesta.

**Criterios de aceptación**

1. **Dado que** el médico tiene tres conversaciones `ENVIADA`, una con prioridad indicada por la familia, **cuando** abre su bandeja, **entonces** esa aparece en «Prioridad indicada por la familia» y las otras dos en «Esperan su respuesta», de la más antigua a la más reciente. (RF-16-AC-1)
2. **Dado que** el médico abre una conversación `ENVIADA` por primera vez, **cuando** se carga el detalle, **entonces** pasa a `EN_REVISION`, la familia ve «Su médico está revisando la conversación.» y queda registrado quién la abrió y cuándo. (RF-16-AC-2, RNF-08)
3. **Dado que** el médico pertenece al círculo de dos familias, **cuando** abre su bandeja, **entonces** ve las conversaciones de ambas con el nombre de familia y paciente, y puede filtrar por familia. (RF-16-AC-4)

**Story Points:** 5. Tres secciones con reglas de orden distintas, registro de accesos y vista en celular y escritorio.
**Prioridad:** Alta.
**Cubre:** RF-16, RNF-01 (detalle en 2 s), RNF-03, RNF-08.

### HU-11: Resumen de contexto

**Como** médico, **quiero** ver al abrir una conversación citas textuales del historial (alergias, medicamentos, episodios anteriores e indicaciones previas) con enlace a su origen, **para** no tener que releer todo el historial y poder verificar cada dato.

**Criterios de aceptación**

1. **Dado que** «Mateo» tiene la alergia «penicilina» y una conversación anterior de «Piel» donde la médica escribió el 12/08 «Use crema de óxido de zinc dos veces al día», **cuando** ella abre una conversación nueva de Mateo con «Piel», **entonces** el resumen muestra «penicilina» con fuente «Perfil» y la cita con autor, fecha y enlace. (RF-17-AC-1)
2. **Dado que** el módulo de resumen simulado devuelve una cita cuyo texto no aparece en el evento que dice citar, **cuando** la API prepara el resumen, **entonces** la descarta y muestra las demás. (RF-17-AC-2)
3. **Dado que** «Compartir historial» está apagado para la Dra. A, **cuando** ella abre una conversación del perfil, **entonces** la petición al módulo no incluye eventos de conversaciones con otros médicos ni nombre, fecha de nacimiento o correo del paciente. (RF-17-AC-3, RNF-12)
4. **Dado que** con `TIMEOUT_RESUMEN_S` = 20 el módulo no responde en 20 s, **cuando** el médico abre la conversación, **entonces** ve la conversación completa y «Resumen no disponible. Puede consultar el historial completo.» (RF-23-AC-1)

**Story Points:** 13. Integración con un modelo externo, verificación textual de cada cita, anonimización, manejo de fallas y la evaluación con 20 historiales sintéticos de RNF-09.
**Prioridad:** Media (es la función que distingue a DAFI, pero el flujo familia → médico funciona sin ella; conviene programarla después de HU-10 y HU-12).
**Cubre:** RF-17, RF-23 (AC-1), RNF-01, RNF-09, RNF-12, RD-06.

### HU-12: Historial del paciente

**Como** cuidador, **quiero** consultar todas las conversaciones de un perfil en orden y filtrarlas por etiqueta o médico, **para** seguir la evolución de mi hijo y recordar qué me indicaron antes.

**Criterios de aceptación**

1. **Dado que** «Mateo» tiene conversaciones del 1 y del 20 de septiembre, **cuando** el cuidador abre su historial, **entonces** ve primero la del 20 y luego la del 1, cada una con estado, etiquetas, médico, fecha e indicaciones. (RF-18-AC-1)
2. **Dado que** el cuidador filtra el historial por «Piel», **cuando** se aplica el filtro, **entonces** solo aparecen conversaciones con esa etiqueta. (RF-18-AC-2)
3. **Dado que** una conversación tiene respuestas iniciales, un mensaje del médico, una foto posterior e indicaciones, **cuando** la familia la abre, **entonces** ve los eventos en orden cronológico con fecha, hora y autor. (RF-18-AC-3)

**Story Points:** 3. Consulta y filtros sobre datos que ya existen; la regla de visibilidad del médico se hereda de HU-04.
**Prioridad:** Media.
**Cubre:** RF-18.

---

## Épica E4: Privacidad y confianza

Avisos que no exponen datos de salud, control de la familia sobre lo que se borra y un canal para reportar abusos.

### HU-13: Notificaciones y aviso por falta de respuesta

**Como** cuidador, **quiero** recibir avisos cuando mi médico responde o cuando no ha abierto la conversación a tiempo, sin que el correo muestre datos de salud, **para** enterarme sin exponer la información de mi familia y saber cuándo buscar otra opción.

**Criterios de aceptación**

1. **Dado que** el médico registra indicaciones, **cuando** se guardan, **entonces** cuidador y cocuidador reciben un correo con el asunto «Su médico respondió en DAFI» y un enlace, sin nombre del paciente ni texto de las indicaciones. (RF-19-AC-1)
2. **Dado que** con `HORAS_SIN_RESPUESTA` = 4 una conversación sin prioridad lleva 4 horas y 1 minuto en `ENVIADA`, **cuando** corre el proceso programado, **entonces** la familia recibe el texto fijo de RF-20-AC-1. (RF-20-AC-1)
3. **Dado que** el médico abrió la conversación a las 3 horas de enviada, **cuando** corre el proceso a las 4 horas y 1 minuto, **entonces** no se envía el aviso. (RF-20-AC-2)

**Story Points:** 5. Siete eventos de notificación en app y correo, más un proceso programado con dos plazos y aviso único por conversación.
**Prioridad:** Alta.
**Cubre:** RF-19, RF-20, RD-01.

### HU-14: Eliminación de datos

**Como** cuidador, **quiero** borrar fotos, conversaciones, perfiles o la cuenta completa de forma definitiva, **para** decidir yo qué información de salud de mi familia se conserva.

**Criterios de aceptación**

1. **Dado que** una conversación está en `BORRADOR`, **cuando** la familia borra una de sus fotos, **entonces** la foto desaparece de la conversación y del almacenamiento. (RF-21-AC-1)
2. **Dado que** una conversación fue enviada, **cuando** la familia intenta borrar solo una foto, **entonces** el sistema lo impide y ofrece borrar la conversación completa. (RF-21-AC-2)
3. **Dado que** el cocuidador confirma el borrado de una conversación `CON_INDICACIONES`, **cuando** se procesa, **entonces** se borran conversación, fotos y eventos, el médico recibe «La familia eliminó una conversación enviada el 20/09» y queda solo el registro mínimo. (RF-21-AC-3)

**Story Points:** 5. Borrado físico en cascada sobre base de datos y almacenamiento de archivos, con permisos distintos por rol.
**Prioridad:** Media.
**Cubre:** RF-21, RNF-07.

### HU-15: Reportes de abuso y administración

**Como** usuario de DAFI (cuidador, cocuidador o médico), **quiero** reportar a otra cuenta por suplantación o mensajes ofensivos, **para** que el administrador la revise y la desactive si corresponde.

**Criterios de aceptación**

1. **Dado que** un cuidador reporta a un médico con el motivo «No es médico», **cuando** se guarda, **entonces** el administrador ve el reporte con motivo, fecha y cuentas involucradas, sin mensajes ni fotos. (RF-22-AC-1)
2. **Dado que** el administrador tiene sesión abierta, **cuando** solicita cualquier conversación, foto o perfil, **entonces** la API responde `SIN_PERMISOS`. (RF-22-AC-2)
3. **Dado que** el administrador desactiva la cuenta de un médico, **cuando** ese médico intenta usar su sesión, **entonces** la API lo rechaza y sus conversaciones abiertas pasan a `SIN_MEDICO`. (RF-22-AC-3)

**Story Points:** 3. Un formulario, una vista de administrador sin datos clínicos y la desactivación, que reutiliza la transición a `SIN_MEDICO` de HU-04.
**Prioridad:** Baja.
**Cubre:** RF-22.

---

## Cobertura del SRS

- **RF:** los 23 requerimientos funcionales (RF-01 a RF-23) quedan cubiertos por al menos una historia.
- **RNF:** RNF-01 a RNF-09, RNF-11 y RNF-12 están asignados a historias concretas. **RNF-10 (disponibilidad del 99 %)** no se asignó a ninguna historia porque es transversal; se propone incluirlo en la Definition of Done o como tarea técnica de infraestructura. RNF-03 (pantallas de 360 px) y RNF-04 (enviar en 3 minutos) se asignaron a HU-10 y HU-07, pero en la práctica aplican a todas las pantallas y también conviene llevarlos a la Definition of Done.
- **RD:** RD-01 a RD-03 y RD-05 a RD-07 aparecen en historias. **RD-04** (DAFI no es expediente clínico) es una restricción de alcance que no genera funcionalidad; se cumple al no construir recetas ni expediente.
- **Pendiente fuera del backlog:** RD-05 exige que un médico revise preguntas y avisos antes de la primera versión, y el SRS dice que aún no se define quién. Es una dependencia de HU-05 y HU-13.
