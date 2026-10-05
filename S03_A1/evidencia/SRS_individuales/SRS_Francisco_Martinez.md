# Especificación de Requerimientos de Software (SRS): DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Alumno:** Francisco Martínez Álvarez (A01840483)
**Actividad:** S02-A1
**Versión:** 2.1 (septiembre de 2026). La 2.0 cambió el alcance de la versión 1.1 a partir de la entrevista con el cliente real; la 2.1 incorpora la revisión técnica. Ambos cambios están documentados en `revision_SRS.md`.
**Estructura:** IEEE 830 simplificada

---

## 1. Introducción

### 1.1 Propósito del documento

Este documento especifica qué debe hacer DAFI (Dermatological Analysis From Images) y bajo qué condiciones, a partir de las dos entrevistas de `transcript_entrevista.md`. Es el contrato del proyecto: los criterios de aceptación con identificador `RF-XX-AC-Y` son la base para diseñar la API en S04-A2 (cada endpoint de `openapi.yaml` referenciará uno o más de ellos) y para escribir las pruebas automatizadas en S09-A1 (cada prueba llevará el identificador como nombre).

Está dirigido al equipo de desarrollo, a quien diseñe las pruebas y a los stakeholders que validan que lo escrito corresponda a lo que pidieron.

### 1.2 Alcance del sistema

DAFI es una aplicación web para celular que sirve de intermediario entre una familia y su médico de confianza cuando aparece un problema en la piel. Hoy ese intercambio pasa por WhatsApp: una foto suelta, mezclada con conversaciones que no tienen que ver con salud, y el médico tiene que pedir más fotos y hacer las mismas preguntas cada vez. DAFI ordena ese intercambio. La familia registra el caso con al menos tres fotos, la zona del cuerpo y un cuestionario de contexto; el sistema revisa que el caso esté completo antes de enviarlo; el médico lo recibe con toda la información, conversa con la familia si le falta algo y registra su valoración. Todo queda en una bitácora por paciente.

Un modelo de IA ayuda en dos puntos acotados: le da al médico una presuposición de la categoría de la lesión, marcada como sugerencia no validada, y a la familia le muestra orientación de primeros auxilios solo cuando la lesión parece menor (un raspón, un piquete) con buena confianza. La IA no decide la gravedad; quien valora el caso es el médico.

La versión 1 cubre solo problemas de la piel. El modelo de datos admite otros tipos de caso (fiebre, síntomas respiratorios) para versiones posteriores (RNF-11).

**Incluido en la versión 1:**

- Cuenta familiar con tutor y cotutor, y perfiles de paciente para cada hijo o para el propio adulto.
- Registro de médicos con verificación de cédula profesional y vinculación de un médico de confianza por perfil de paciente.
- Registro de casos de piel: mínimo tres fotos, zona del cuerpo, cuestionario de contexto, validación de completitud y envío al médico.
- Aviso inmediato de urgencia cuando las respuestas del cuestionario contienen una señal de alarma.
- Presuposición automática para el médico y orientación de primeros auxilios para lesiones menores.
- Bandeja del médico, conversación dentro del caso, solicitud de información y valoración médica.
- Bitácora por paciente, notificaciones, eliminación de datos y consentimiento foto por foto para mejorar el modelo.
- Administración: verificación de médicos y desactivación de cuentas.

**Excluido de la versión 1:**

- Diagnóstico o clasificación de gravedad hecha por la IA.
- Recetas, indicación de medicamentos y cualquier documento con validez de expediente clínico.
- Videollamadas, agenda de citas y pagos.
- Tipos de caso distintos de la piel.
- Directorio o búsqueda de médicos: la familia vincula a un médico que ya conoce.
- Aplicación nativa para Android o iOS y uso desde computadora para familias.
- Integración con expedientes clínicos o sistemas de hospitales.
- Reentrenamiento del modelo durante el curso.

### 1.3 Definiciones y acrónimos

| Término | Definición |
|---|---|
| **Familia** | Cuenta compartida por un tutor y, opcionalmente, un cotutor. Contiene los perfiles de paciente. |
| **Tutor** | Adulto que crea la familia. Administra miembros, perfiles y médicos vinculados. |
| **Cotutor** | Adulto invitado por el tutor (por ejemplo, el otro padre). Registra y consulta casos de todos los perfiles, pero no administra la familia. |
| **Perfil de paciente** | Datos de la persona afectada (un hijo o el propio adulto): nombre, fecha de nacimiento y alergias conocidas. Un menor no tiene cuenta ni inicia sesión. |
| **Médico de confianza** | Médico verificado que la familia vinculó a un perfil de paciente. Solo él ve los casos de ese perfil. |
| **Caso** | Registro de un problema de salud de un paciente: fotos, zona del cuerpo, cuestionario, presuposición, conversación y valoración. |
| **Evento** | Cada entrada fechada dentro de un caso: una foto, una respuesta, un mensaje, un cambio de estado o una valoración. La bitácora es la secuencia de eventos. |
| **Cuestionario de contexto** | Preguntas fijas por tipo de caso (qué pasó, cuándo, dónde estuvo, qué comió, síntomas), definidas en RF-09. |
| **Señal de alarma** | Respuesta del cuestionario que exige atención inmediata (tabla en RF-11). Se evalúa con reglas fijas, sin IA. |
| **Presuposición** | Las tres categorías más probables según el modelo, con su nivel de confianza, que se muestran al médico como sugerencia no validada. |
| **Nivel de confianza** | Traducción a palabras (baja, mediana, buena) de la probabilidad de la primera categoría, según `UMBRAL_CONF_MEDIA` y `UMBRAL_CONF_BUENA`. |
| **Caso urgente** | Caso marcado por las reglas de RF-11. Aparece primero en la bandeja del médico y tiene un plazo de aviso más corto (RF-17). |
| **Valoración médica** | Decisión que registra el médico al revisar un caso: cuidado en casa, consulta presencial o acudir a urgencias, con indicaciones escritas. |
| **Cédula profesional** | Registro que expide la Secretaría de Educación Pública y que acredita el ejercicio de la medicina en México. |
| **EXIF** | Metadatos incrustados en una imagen (ubicación GPS, fecha, modelo del dispositivo). |
| **HEIC / HEIF** | Formato de imagen que usan por defecto los iPhone. |
| **LFPDPPP** | Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México). |
| **p95** | Percentil 95: valor por debajo del cual queda el 95 % de las mediciones. |
| **GWT** | Given-When-Then (Dado que, cuando, entonces): formato de los criterios de aceptación. |
| **RF / RNF / RD** | Requerimiento funcional / no funcional / de dominio. |

---

## 2. Descripción general

### 2.1 Perspectiva del producto

DAFI es un sistema nuevo e independiente. No se integra con expedientes clínicos ni con sistemas de hospitales; el médico conserva su propio expediente fuera de DAFI (RD-04). Tiene cuatro componentes:

- **Cliente web** (Next.js), pensado para el navegador del celular. Además de la interfaz, convierte y reduce las fotos en el dispositivo antes de subirlas.
- **API** (Node.js con Express), que maneja autenticación, roles, vinculaciones, casos, reglas de alarma y notificaciones.
- **Base de datos** (MongoDB) para cuentas, familias, perfiles, casos, eventos y catálogos. Las imágenes se guardan en un almacenamiento de archivos accesible solo desde la API.
- **Módulo de inferencia**, que ejecuta un modelo preentrenado de condiciones de la piel y devuelve la probabilidad de cada categoría del catálogo (3.0). La API es su único cliente. Qué modelo se usa y cómo se ejecuta se decide en S04; este documento solo exige que sus clases se puedan mapear al catálogo y que responda dentro del tiempo de RNF-01.

El cuestionario, las señales de alarma, las categorías y los textos de primeros auxilios son catálogos que se cargan al desplegar. Un médico revisa y aprueba su contenido antes de la primera versión (RD-06).

### 2.2 Funciones del producto

- **Cuenta y familia:** registrarse, iniciar sesión, recuperar acceso, crear perfiles de paciente e invitar a un cotutor.
- **Médicos:** registrarse como médico, ser verificado y aceptar la vinculación con una familia.
- **Casos:** tomar al menos tres fotos, marcar la zona del cuerpo, responder el cuestionario, revisar que el caso esté completo y enviarlo.
- **Apoyo automático:** avisar de urgencia ante una señal de alarma, generar la presuposición para el médico y mostrar primeros auxilios en lesiones menores.
- **Atención:** que el médico revise su bandeja, converse con la familia, pida información y registre su valoración.
- **Seguimiento:** consultar la bitácora del paciente, reportar que el paciente empeoró, recibir notificaciones y un aviso si el médico tarda en responder.
- **Privacidad:** borrar fotos, casos, perfiles o la cuenta, y decidir foto por foto cuáles pueden usarse para mejorar el modelo.
- **Administración:** verificar médicos y desactivar cuentas.

### 2.3 Características del usuario

| Rol | Quién es | Rasgos relevantes para el diseño |
|---|---|---|
| **Tutor** | Madre, padre o adulto responsable. El caso de referencia es una madre con dos hijos pequeños que se lastiman en el parque o regresan de la escuela con marcas que no saben explicar. | Usa solo el celular. Hoy manda fotos por WhatsApp a una médica de confianza. No confía en que una IA juzgue la gravedad; sí acepta una orientación de primeros auxilios para algo simple. Si la app exagera, la desinstala. |
| **Cotutor** | El otro padre u otro adulto de la familia. | Toma fotos cuando el tutor no está; hoy las reenvía por WhatsApp. |
| **Médico de confianza** | Médico con cédula (en el caso de referencia, una pediatra que no es dermatóloga). | Atiende a familias que conoce, entre otras actividades. Antes de opinar pide más fotos y pregunta por el contexto. Puede usar celular o computadora. |
| **Administrador** | Integrante del equipo de desarrollo durante el curso. | Verifica médicos. No tiene acceso a casos ni a fotos. |

### 2.4 Restricciones

- **Tecnológicas:** Next.js en el frontend, Node.js con Express en el backend y MongoDB como base de datos, según el acuerdo de equipo en `proyecto_base.md`. Aplicación web únicamente.
- **Modelo:** se usa un modelo preentrenado público de condiciones de la piel en fotos de celular. Sus clases se mapean a las categorías del catálogo 3.0; lo que no tenga correspondencia se reporta como "No determinado". No se entrena ni ajusta durante el curso (RD-07). HAM10000, que se había considerado en la versión 1.1, no sirve para este alcance: contiene lesiones pigmentadas en imagen dermatoscópica y ninguna de las lesiones que describió el cliente real (raspones, piquetes, ronchas).
- **Calendario:** 12 semanas de curso. El alcance excluye todo lo que no sea el flujo familia-médico para la piel.
- **Legales:** tratamiento de datos sensibles de menores conforme a la LFPDPPP (RD-02) y verificación de cédula de los médicos (RD-03).
- **Supuesto de conectividad:** el sistema requiere internet para enviar un caso.

---

## 3. Requerimientos específicos

### 3.0 Reglas generales

Estas reglas aplican a todos los criterios de aceptación y no se repiten en cada uno.

**Parámetros.** Los nombres en `MAYÚSCULAS` son parámetros configurables sin cambiar código (tabla 3.4). Los criterios que dependen de un parámetro declaran su valor en el "Dado que"; las pruebas inyectan esos valores.

**Roles y permisos.** Cada cuenta tiene un solo rol. Esta matriz es la fuente de autorización de la API.

| Operación | Tutor | Cotutor | Médico | Administrador |
|---|---|---|---|---|
| Crear, editar y eliminar perfiles de paciente (RF-04) | ✔ | | | |
| Invitar o quitar al cotutor (RF-05) | ✔ | | | |
| Vincular o desvincular médicos (RF-07) | ✔ | | | |
| Registrar, enviar y consultar casos de la familia (RF-08 a RF-13, RF-18) | ✔ | ✔ | | |
| Reportar que el paciente empeoró (RF-11) | ✔ | ✔ | | |
| Salir de la familia (RF-05) | | ✔ | | |
| Aceptar, rechazar o terminar una vinculación (RF-07) | | | ✔ | |
| Conversar en un caso (RF-15) | ✔ | ✔ | ✔ solo pacientes vinculados | |
| Eliminar fotos y casos (RF-20) | ✔ | ✔ | | |
| Eliminar perfiles o la cuenta familiar (RF-20) | ✔ | | | |
| Decidir el uso de una foto para el modelo (RF-21) | ✔ | ✔ | | |
| Bandeja, detalle de casos y valoración (RF-14, RF-16) | | | ✔ solo pacientes vinculados | |
| Verificar médicos y desactivar cuentas (RF-22) | | | | ✔ |

**Acceso indebido.** Si al rol le falta la operación, el sistema responde "sin permisos" (se verifica primero). Si el rol tiene la operación pero el recurso es de otra familia o de un paciente no vinculado, responde "no encontrado", sin revelar que existe. En S04 se sugiere mapearlos a 403 y 404.

**Estados del caso.** Estas son las únicas transiciones válidas. Cualquier otra acción sobre el estado se rechaza con `TRANSICION_INVALIDA`.

| Estado origen | Acción | Quién | Estado destino |
|---|---|---|---|
| (ninguno) | Crear caso | Tutor, cotutor | `BORRADOR` |
| `BORRADOR` | Enviar con los puntos de RF-10 completos | Tutor, cotutor | `ENVIADO` |
| `ENVIADO` | Abrir el caso por primera vez (RF-14) | Médico | `EN_REVISION` |
| `EN_REVISION` o `VALORADO` | Pedir información (RF-15) | Médico | `INFO_SOLICITADA` |
| `INFO_SOLICITADA` | Responder la solicitud (RF-15) | Tutor, cotutor | `EN_REVISION` |
| `EN_REVISION` o `INFO_SOLICITADA` | Registrar valoración (RF-16) | Médico | `VALORADO` |
| `VALORADO` | Registrar una nueva valoración (sustituye a la vigente; ambas quedan en la bitácora) | Médico | `VALORADO` |
| `VALORADO` | Cerrar | Tutor, cotutor | `CERRADO` |
| `VALORADO` | Pasan `DIAS_CIERRE_AUTOMATICO` días sin eventos nuevos | Sistema | `CERRADO` |
| `ENVIADO`, `EN_REVISION` o `INFO_SOLICITADA` | El médico se desvincula o se desactiva (RF-07, RF-22) | Sistema | `SIN_MEDICO` |
| `SIN_MEDICO` | Reenviar tras vincular a otro médico (RF-07) | Tutor | `ENVIADO` |

Los mensajes (RF-15) y el reporte "Empeoró" (RF-11) no cambian el estado. Un caso `CERRADO` no se reabre. Los borradores no caducan en la versión 1. Todo cambio de estado se registra como evento en la bitácora (RF-18).

**Catálogo de categorías de la piel (versión 1).**

| Código | Nombre que ve el médico | Primeros auxilios para la familia (RF-13) |
|---|---|---|
| `lesion_menor` | Raspón o corte superficial | Sí |
| `picadura` | Piquete o picadura de insecto | Sí |
| `roncha` | Ronchas o reacción en la piel (posible alergia o irritación) | No |
| `erupcion` | Erupción con puntos o granitos | No |
| `mancha` | Mancha o lunar | No |
| `no_determinado` | No determinado | No |

**Zonas del cuerpo.** Cabeza y cuello, cara, boca y labios, pecho y abdomen, espalda, brazo izquierdo, brazo derecho, mano izquierda, mano derecha, zona del pañal o genital, pierna izquierda, pierna derecha, pie izquierdo, pie derecho.

**Visibilidad de perfiles de adulto.** Si el tutor crea un perfil para sí mismo (18 años o más), solo él lo ve, salvo que active "Compartir con el cotutor".

**Fechas y reloj.** Las fechas se registran en UTC y se muestran en la zona horaria America/Mexico_City. La API toma la hora de un reloj inyectable. Los procesos programados (cierre automático de RF-16 y avisos de RF-17) corren cada 15 minutos y las pruebas pueden invocarlos directamente.

**Contrato de errores.** Todo rechazo de la API devuelve un código de esta tabla, además del texto que muestra el cliente. Los códigos HTTP son la sugerencia para S04.

| Código | HTTP | Uso |
|---|---|---|
| `NO_AUTENTICADO` | 401 | Sesión inexistente o expirada |
| `SIN_PERMISOS` | 403 | El rol no tiene la operación |
| `CUENTA_NO_VERIFICADA` | 403 | Correo sin verificar o médico pendiente de verificación |
| `NO_ENCONTRADO` | 404 | Recurso de otra familia, de un paciente no vinculado o inexistente |
| `TRANSICION_INVALIDA` | 409 | Acción no permitida en el estado actual del caso |
| `LIMITE_ALCANZADO` | 409 | La familia ya tiene cotutor o el caso ya tiene `MAX_FOTOS` fotos |
| `ARCHIVO_INVALIDO` | 415 | La foto no es JPEG o pesa más de 1 MB (1 048 576 bytes) |
| `DATOS_INVALIDOS` | 422 | Campo faltante o con formato incorrecto; la respuesta lista los campos |
| `FOTO_RECHAZADA` | 422 | Foto borrosa u oscura; la respuesta indica el motivo |
| `CASO_INCOMPLETO` | 422 | Envío sin los puntos de RF-10; la respuesta lista los puntos faltantes |
| `BLOQUEADO` | 429 | Demasiados intentos de inicio de sesión |

**Idempotencia.** Las peticiones que suben fotos o envían casos llevan la cabecera `Idempotency-Key`, generada por el cliente. La clave es única por usuario y vale `HORAS_IDEMPOTENCIA` horas.

**Imágenes de prueba.** Los criterios de RF-08 se prueban con un conjunto de imágenes versionado en el repositorio, con el resultado esperado de cada una.

### 3.1 Requerimientos funcionales

#### RF-01: Registro del tutor

Una persona crea una cuenta familiar con correo y contraseña, y confirma el correo con un enlace. Antes de crear la cuenta, el sistema muestra el aviso de privacidad y exige tres declaraciones: ser mayor de 18 años, consentir el tratamiento de sus datos de salud y consentir, como madre, padre o tutor legal, el tratamiento de los datos de salud de los menores que registre.

- **RF-01-AC-1:** **Dado que** una persona sin cuenta llenó un correo válido y una contraseña de al menos 8 caracteres, y marcó las tres declaraciones, **cuando** envía el registro, **entonces** el sistema crea una familia con esa persona como tutor, guarda la fecha y la versión del aviso aceptado y abre su sesión.
- **RF-01-AC-2:** **Dado que** una persona dejó sin marcar cualquiera de las tres declaraciones, **cuando** envía el registro, **entonces** el sistema no crea la cuenta y señala la declaración faltante con el texto "Necesitamos esta autorización para usar DAFI."
- **RF-01-AC-3:** **Dado que** ya existe una cuenta con el correo capturado, **cuando** la persona envía el registro, **entonces** el sistema no crea una cuenta nueva y muestra "Ya existe una cuenta con este correo."
- **RF-01-AC-4:** **Dado que** un tutor se registró y no ha abierto el enlace de verificación enviado a su correo, **cuando** intenta enviar un caso o una invitación, **entonces** la API responde `CUENTA_NO_VERIFICADA` y el cliente muestra "Confirme su correo para continuar." Crear perfiles y borradores sí está permitido.

#### RF-02: Inicio y cierre de sesión

- **RF-02-AC-1:** **Dado que** una cuenta activa existe, **cuando** su dueño ingresa el correo y la contraseña correctos, **entonces** el sistema abre la sesión y muestra la pantalla de inicio de su rol (perfiles de la familia para tutor y cotutor, bandeja para el médico).
- **RF-02-AC-2:** **Dado que** alguien ingresa credenciales incorrectas, **cuando** envía el formulario, **entonces** el sistema muestra "Los datos no coinciden" sin indicar si el error está en el correo o en la contraseña.
- **RF-02-AC-3:** **Dado que** con `MAX_INTENTOS_LOGIN` = 5 y `MINUTOS_BLOQUEO` = 15 se registraron 5 intentos fallidos consecutivos para un mismo correo desde una misma dirección IP (exista o no la cuenta), **cuando** se hace un sexto intento desde esa IP aun con credenciales correctas, **entonces** la API responde `BLOQUEADO` durante 15 minutos contados desde el quinto intento, el cliente muestra "Demasiados intentos. Intente de nuevo en 15 minutos." y, si la cuenta existe, su titular recibe un correo de aviso. Los intentos desde otra IP no quedan bloqueados.
- **RF-02-AC-4:** **Dado que** un usuario tiene sesión abierta, **cuando** pulsa "Cerrar sesión", **entonces** el sistema invalida la sesión y cualquier petición posterior con ella se rechaza como no autenticada.

#### RF-03: Recuperación de acceso

- **RF-03-AC-1:** **Dado que** alguien captura un correo en "Olvidé mi contraseña", **cuando** envía la solicitud, **entonces** el sistema muestra "Si el correo está registrado, recibirá un enlace." exista o no la cuenta, y si existe envía un enlace válido por `MINUTOS_ENLACE_RESTABLECER` minutos.
- **RF-03-AC-2:** **Dado que** con `MINUTOS_ENLACE_RESTABLECER` = 60 un enlace se generó hace 61 minutos, **cuando** la persona lo abre, **entonces** el sistema muestra "El enlace venció. Solicite uno nuevo." y no permite cambiar la contraseña.
- **RF-03-AC-3:** **Dado que** una persona restableció su contraseña, **cuando** termina el cambio, **entonces** todas sus sesiones abiertas se invalidan.

#### RF-04: Perfiles de paciente

El tutor crea un perfil por cada persona cuyos casos se registrarán: sus hijos o él mismo. Cada perfil tiene nombre, fecha de nacimiento y, opcionalmente, alergias conocidas.

- **RF-04-AC-1:** **Dado que** un tutor captura nombre "Mateo" y fecha de nacimiento 12/03/2021, **cuando** guarda el perfil, **entonces** el perfil aparece en la lista de la familia para el tutor y el cotutor, con la edad calculada en años.
- **RF-04-AC-2:** **Dado que** un tutor captura una fecha de nacimiento posterior a la fecha actual, **cuando** guarda el perfil, **entonces** el sistema lo rechaza con "Revise la fecha de nacimiento."
- **RF-04-AC-3:** **Dado que** un cotutor tiene sesión abierta, **cuando** intenta crear, editar o eliminar un perfil, **entonces** el sistema lo rechaza por falta de permisos.
- **RF-04-AC-4:** **Dado que** un tutor edita las alergias de un perfil, **cuando** guarda el cambio, **entonces** el médico vinculado a ese perfil ve las alergias actualizadas en el detalle de los casos (RF-14).

#### RF-05: Invitación del cotutor

El tutor invita por correo a un segundo adulto. Al aceptar, esa persona crea su cuenta con las mismas declaraciones de RF-01 (incluida la de ser madre, padre o tutor legal de los menores registrados) y queda como cotutor. En la versión 1 el cotutor debe tener la patria potestad o la tutela; otros adultos de apoyo quedan fuera de alcance. Una familia tiene como máximo un cotutor.

- **RF-05-AC-1:** **Dado que** un tutor captura un correo en "Invitar a otro adulto", **cuando** envía la invitación, **entonces** el sistema envía a ese correo un enlace válido por `DIAS_INVITACION` días.
- **RF-05-AC-2:** **Dado que** la persona invitada abre un enlace vigente y completa el registro con las tres declaraciones, **cuando** confirma, **entonces** su cuenta queda con rol cotutor en esa familia y ve todos los perfiles de menores y sus casos.
- **RF-05-AC-3:** **Dado que** la familia ya tiene un cotutor, **cuando** el tutor intenta enviar otra invitación, **entonces** la API responde `LIMITE_ALCANZADO` y el cliente muestra "Esta familia ya tiene otro adulto registrado."
- **RF-05-AC-4:** **Dado que** el tutor quita al cotutor de la familia, **cuando** confirma, **entonces** el cotutor pierde acceso a todos los perfiles y casos de inmediato, y los casos y fotos que él registró se conservan en la familia.
- **RF-05-AC-5:** **Dado que** un cotutor pulsa "Salir de la familia" y confirma, **cuando** se procesa, **entonces** pierde el acceso a la familia, su cuenta se borra, los casos que registró se conservan y el tutor recibe un aviso.

#### RF-06: Registro y verificación de médicos

Un médico crea su cuenta con nombre, correo, contraseña, número de cédula profesional y una foto de su identificación oficial. Antes de crearla acepta los términos de uso para médicos (su valoración es responsabilidad profesional suya; DAFI no es expediente clínico ni garantiza tiempos de respuesta) y el aviso de privacidad. La cuenta queda "pendiente" hasta que el administrador verifica la cédula y la identidad (RF-22). Solo un médico verificado puede aceptar vinculaciones.

- **RF-06-AC-1:** **Dado que** un médico se registra con nombre, correo, contraseña, una cédula de 7 u 8 dígitos y la foto de su identificación, y acepta términos y aviso, **cuando** envía el registro, **entonces** el sistema crea la cuenta con estado "pendiente de verificación" y le muestra "Revisaremos su cédula. Le avisaremos por correo."
- **RF-06-AC-2:** **Dado que** la cédula capturada tiene letras o una longitud distinta de 7 u 8 dígitos, **cuando** el médico envía el registro, **entonces** la API responde `DATOS_INVALIDOS` y el cliente muestra "Revise el número de cédula."
- **RF-06-AC-3:** **Dado que** un médico está pendiente de verificación, **cuando** intenta aceptar una vinculación, **entonces** la API responde `CUENTA_NO_VERIFICADA` y el cliente muestra "Su cuenta aún no está verificada."
- **RF-06-AC-4:** **Dado que** un médico no marcó la aceptación de los términos de uso, **cuando** envía el registro, **entonces** la API responde `DATOS_INVALIDOS` y la cuenta no se crea.

#### RF-07: Vinculación del médico de confianza

El tutor vincula un médico a cada perfil de paciente invitándolo por correo, y al hacerlo autoriza que los casos de ese perfil se compartan con él. Cada perfil tiene como máximo un médico de confianza a la vez; un mismo médico puede atender varios perfiles y familias. El médico acepta o rechaza, y puede terminar la vinculación después. El tutor también puede desvincularlo en cualquier momento. Cuando un perfil cambia de médico, el nuevo solo ve los casos anteriores si el tutor marca "Compartir casos anteriores".

- **RF-07-AC-1:** **Dado que** un tutor elige el perfil "Mateo", captura el correo de un médico registrado y verificado y marca la autorización para compartir los casos, **cuando** envía la invitación, **entonces** el médico ve la solicitud con el nombre del tutor y del paciente, y el perfil muestra "Esperando respuesta del médico".
- **RF-07-AC-2:** **Dado que** el correo no pertenece a un médico registrado, **cuando** el tutor envía la invitación, **entonces** el sistema envía a ese correo una invitación para registrarse como médico, válida por `DIAS_INVITACION` días, y la vinculación queda pendiente hasta que se registre, sea verificado y acepte.
- **RF-07-AC-3:** **Dado que** el médico acepta la vinculación, **cuando** se procesa, **entonces** el perfil muestra el nombre del médico y los casos nuevos de ese perfil se le envían a él.
- **RF-07-AC-4:** **Dado que** el médico rechaza la vinculación, **cuando** se procesa, **entonces** el tutor ve "El médico no aceptó la invitación" y el perfil queda sin médico.
- **RF-07-AC-5:** **Dado que** el perfil "Mateo" tiene un caso `EN_REVISION`, **cuando** el tutor desvincula al médico o el médico termina la vinculación, **entonces** el médico deja de ver todos los casos del perfil en su siguiente petición, el caso pasa a `SIN_MEDICO` y la familia ve "Su médico ya no atiende este caso. Si hay urgencia, acuda a un centro de salud. Puede vincular a otro médico y reenviarlo."
- **RF-07-AC-6:** **Dado que** un perfil tiene casos anteriores y el tutor vincula a un médico nuevo sin marcar "Compartir casos anteriores", **cuando** el médico nuevo abre un caso de ese perfil, **entonces** no ve los casos previos a su vinculación.
- **RF-07-AC-7:** **Dado que** un perfil no tiene médico vinculado, **cuando** la familia intenta enviar un caso (RF-10), **entonces** la API responde `CASO_INCOMPLETO` con el punto "médico vinculado", el borrador se conserva y el cliente muestra "Vincule a su médico de confianza para enviar el caso."

#### RF-08: Captura de fotos del caso

La familia crea un caso para un perfil, marca la zona del cuerpo en un catálogo (3.0) y agrega entre `MIN_FOTOS` y `MAX_FOTOS` fotos. Antes de la primera, el sistema muestra una guía: una foto de cerca, una a media distancia en la que se vea en qué parte del cuerpo está la lesión y una desde otro ángulo, con luz natural y sin flash. Cada foto se puede tomar con la cámara o elegir de la galería (incluidas las recibidas por WhatsApp), en JPEG, PNG o HEIC. El cliente la convierte a JPEG, reduce su lado mayor a `LADO_MAX_PX` y elimina los metadatos EXIF antes de subirla. La API valida cada foto recibida (ya reducida) por nitidez e iluminación y rechaza con `FOTO_RECHAZADA` las que no cumplan. La nitidez es la varianza de la convolución de la imagen en escala de grises con el kernel laplaciano [[0, 1, 0], [1, −4, 1], [0, 1, 0]]; el brillo es el promedio de la luminancia Y = 0.299 R + 0.587 G + 0.114 B, de 0 a 255. Si la zona marcada es "zona del pañal o genital", el sistema lo advierte antes de la captura y aplica las protecciones de RNF-06.

- **RF-08-AC-1:** (Prueba de extremo a extremo en Chrome para Android y Safari para iOS.) **Dado que** una madre elige una foto HEIC de 4032 × 3024 píxeles, **cuando** la agrega al caso, **entonces** el archivo que recibe la API es JPEG, su lado mayor mide como máximo `LADO_MAX_PX` píxeles y no contiene EXIF.
- **RF-08-AC-2:** **Dado que** un cotutor elige de la galería un JPEG reenviado por WhatsApp de 1600 × 1200 píxeles, **cuando** lo agrega al caso, **entonces** el sistema lo acepta y lo muestra en el borrador.
- **RF-08-AC-3:** **Dado que** con `UMBRAL_NITIDEZ` = 100 una foto tiene nitidez de 40, **cuando** se valida, **entonces** el sistema no la agrega y muestra "La foto salió borrosa. Acérquese y mantenga el teléfono quieto."
- **RF-08-AC-4:** **Dado que** con `UMBRAL_BRILLO_MIN` = 50 una foto nítida tiene brillo promedio de 30, **cuando** se valida, **entonces** el sistema no la agrega y muestra "La foto está muy oscura. Busque luz natural."
- **RF-08-AC-5:** **Dado que** con `MAX_FOTOS` = 6 un caso ya tiene 6 fotos, **cuando** la familia intenta agregar otra, **entonces** la API responde `LIMITE_ALCANZADO` y el cliente muestra "Un caso admite hasta 6 fotos."
- **RF-08-AC-6:** **Dado que** la API recibe directamente un archivo que no es JPEG, o un JPEG de más de 1 048 576 bytes, **cuando** lo procesa, **entonces** responde `ARCHIVO_INVALIDO` sin guardarlo.
- **RF-08-AC-7:** **Dado que** la familia no ha marcado la zona del cuerpo, **cuando** revisa el borrador, **entonces** el punto "Zona del cuerpo" aparece como pendiente en la lista de RF-10.
- **RF-08-AC-8:** **Dado que** la familia marca "zona del pañal o genital", **cuando** pulsa "Tomar foto", **entonces** el sistema muestra antes de abrir la cámara "Las fotos de esta zona solo las verá su médico, no se podrán descargar y nunca se usarán para mejorar DAFI."

#### RF-09: Cuestionario de contexto

Cada caso incluye el cuestionario del tipo "Piel". Las preguntas marcadas como obligatorias deben responderse para enviar el caso.

| # | Pregunta | Respuesta | Obligatoria |
|---|---|---|---|
| C1 | ¿Cuándo apareció? | Hoy / ayer / hace 2 a 7 días / hace más de una semana | Sí |
| C2 | ¿Dónde estuvo antes de que apareciera? | Casa / escuela o guardería / parque o jardín / otro (texto) | Sí |
| C3 | ¿Comió algo nuevo o tomó algún medicamento en los últimos 3 días? | Sí (texto) / No / No sé | Sí |
| C4 | ¿Pica o duele? | Pica / duele / ambas / ninguna | Sí |
| C5 | ¿Ha crecido o se ha extendido? | Sí / No / No sé | Sí |
| C6 | ¿Tiene fiebre? | No / sí, menos de 38 °C / sí, de 38 a 38.9 °C / sí, 39 °C o más / no la he medido | Sí |
| C7 | Señales de alarma (RF-11) | Una respuesta Sí / No por cada señal | Sí |
| C8 | ¿Algo más que quiera contarle a su médico? | Texto libre | No |

- **RF-09-AC-1:** **Dado que** una familia respondió C1 a C7, **cuando** guarda el cuestionario, **entonces** las respuestas quedan en el caso como eventos con fecha y autor.
- **RF-09-AC-2:** **Dado que** una familia respondió C3 con "Sí" sin escribir qué comió o tomó, **cuando** guarda el cuestionario, **entonces** el sistema marca C3 como incompleta con "Cuéntenos qué comió o qué medicamento tomó."
- **RF-09-AC-3:** **Dado que** el perfil tiene alergias registradas, **cuando** la familia abre el cuestionario, **entonces** ve las alergias del perfil como referencia sobre C3.

#### RF-10: Validación de completitud y envío

Antes de enviar, el sistema muestra una lista con cuatro puntos: zona del cuerpo marcada, al menos `MIN_FOTOS` fotos válidas, preguntas obligatorias respondidas y médico vinculado. El botón "Enviar a mi médico" solo se habilita con los cuatro completos.

- **RF-10-AC-1:** **Dado que** con `MIN_FOTOS` = 3 un borrador tiene zona marcada, 2 fotos válidas y el cuestionario completo, **cuando** la familia revisa el borrador, **entonces** la lista muestra "Falta 1 foto" y el botón "Enviar a mi médico" está deshabilitado.
- **RF-10-AC-2:** **Dado que** un borrador tiene los cuatro puntos completos, **cuando** la familia pulsa "Enviar a mi médico", **entonces** el caso pasa a `ENVIADO`, las fotos y respuestas enviadas quedan de solo lectura, y el médico vinculado lo recibe en su bandeja.
- **RF-10-AC-3:** **Dado que** la API recibe una petición de envío de un caso con 2 fotos (por ejemplo, saltándose el cliente), **cuando** la procesa, **entonces** la rechaza, el caso sigue en `BORRADOR` y la respuesta indica los puntos faltantes.

#### RF-11: Señales de alarma

Las reglas de esta sección no usan el modelo y su contenido lo aprueba un médico (RD-06). Hay dos niveles:

- **Aviso de urgencia.** Si cualquiera de las señales A1 a A6 se responde "Sí", o si el paciente tiene menos de `EDAD_MESES_FIEBRE_BEBE` meses y C6 indica 38 °C o más, el sistema muestra de inmediato un aviso fijo para acudir a urgencias. El caso se sigue pudiendo enviar y llega al médico marcado como urgente.
- **Prioridad para el médico.** Si C6 es "sí, 39 °C o más" en un paciente de `EDAD_MESES_FIEBRE_BEBE` meses o más, sin ninguna señal A1 a A6, el caso llega al médico marcado como urgente, pero la familia no recibe el aviso de urgencias. Una fiebre alta por sí sola en un niño mayor no justifica mandar a la familia a urgencias sin la opinión de su médico.

Además, en cualquier caso abierto (`ENVIADO`, `EN_REVISION`, `INFO_SOLICITADA` o `VALORADO`) la familia tiene el botón "Empeoró", que vuelve a preguntar A1 a A6 y la fiebre, y aplica las mismas reglas.

| Señal | Pregunta |
|---|---|
| A1 | ¿Le cuesta respirar? |
| A2 | ¿Se le hinchó la cara, los labios o la lengua? |
| A3 | ¿Sangra y no deja de sangrar después de 10 minutos de presión? |
| A4 | ¿Es una herida profunda o abierta? |
| A5 | ¿Está muy decaído, somnoliento o no responde como siempre? |
| A6 | ¿Tiene manchas moradas o rojas que no se borran al presionarlas? |

Los criterios siguientes usan `EDAD_MESES_FIEBRE_BEBE` = 3.

- **RF-11-AC-1:** **Dado que** una familia responde "Sí" en A2, **cuando** guarda la respuesta, **entonces** el sistema muestra en pantalla completa "Por lo que respondió, no espere la respuesta de su médico: llame al 911 o acuda a urgencias ahora." con un botón para llamar al 911.
- **RF-11-AC-2:** **Dado que** una familia responde "No" en A1 a A6 y C6 es "No", **cuando** guarda el cuestionario, **entonces** no aparece el aviso de urgencia y el caso no se marca como urgente.
- **RF-11-AC-3:** **Dado que** un caso con una señal A1 a A6 se envía, **cuando** el médico abre su bandeja, **entonces** el caso aparece en la sección "Urgentes" con la señal que lo originó.
- **RF-11-AC-4:** **Dado que** el perfil tiene 2 meses de edad, C6 es "sí, de 38 a 38.9 °C" y A1 a A6 son "No", **cuando** la familia guarda el cuestionario, **entonces** aparece el aviso de RF-11-AC-1.
- **RF-11-AC-5:** **Dado que** el perfil tiene 4 años, C6 es "sí, 39 °C o más" y A1 a A6 son "No", **cuando** la familia guarda el cuestionario, **entonces** no aparece el aviso de urgencias, la familia ve "Marcamos el caso como prioritario para su médico." y, al enviarse, el caso aparece en "Urgentes" con el motivo "Fiebre de 39 °C o más".
- **RF-11-AC-6:** **Dado que** un caso está `EN_REVISION`, **cuando** la familia pulsa "Empeoró" y responde "Sí" en A1, **entonces** aparece el aviso de RF-11-AC-1, el caso queda marcado como urgente sin cambiar de estado, se registra el evento y el médico recibe la notificación de caso urgente (RF-19).

#### RF-12: Presuposición automática para el médico

Al enviar un caso, la API manda las fotos al módulo de inferencia, que devuelve la probabilidad de cada categoría del catálogo para cada foto. La presuposición del caso es el promedio de las probabilidades de todas sus fotos. Se calcula una sola vez, con las fotos del envío inicial; las fotos que llegan después por RF-15 no la recalculan. El médico ve las tres categorías más probables con el nivel de confianza, bajo el título "Sugerencia automática (no validada)". Los empates se ordenan según el catálogo 3.0. La familia no ve la presuposición, salvo en el caso de RF-13. Si el nivel es bajo, o si la primera categoría es `no_determinado`, el médico ve "El sistema no pudo sugerir una categoría".

| Probabilidad de la primera categoría (p1) | Nivel |
|---|---|
| p1 < `UMBRAL_CONF_MEDIA` | Baja |
| `UMBRAL_CONF_MEDIA` ≤ p1 < `UMBRAL_CONF_BUENA` | Mediana |
| p1 ≥ `UMBRAL_CONF_BUENA` | Buena |

- **RF-12-AC-1:** **Dado que** con `UMBRAL_CONF_MEDIA` = 0.50 y `UMBRAL_CONF_BUENA` = 0.75 las tres fotos de un caso dan, en promedio, `picadura` 0.62, `roncha` 0.20 y `erupcion` 0.10, **cuando** el médico abre el caso, **entonces** ve bajo "Sugerencia automática (no validada)" las categorías "Piquete o picadura de insecto", "Ronchas o reacción en la piel (posible alergia o irritación)" y "Erupción con puntos o granitos", en ese orden, con "confianza mediana".
- **RF-12-AC-2:** **Dado que** con los mismos umbrales la primera categoría promedia 0.35, **cuando** el médico abre el caso, **entonces** ve "El sistema no pudo sugerir una categoría" y ninguna categoría.
- **RF-12-AC-3:** **Dado que** un caso tiene presuposición, **cuando** la familia consulta el caso, **entonces** la respuesta de la API no contiene categorías ni probabilidades, salvo la orientación de RF-13.
- **RF-12-AC-4:** **Dado que** el médico abrió la presuposición, **cuando** marca "La sugerencia no corresponde" y elige la categoría que él considera correcta, **entonces** el sistema guarda su corrección como evento del caso.

#### RF-13: Orientación de primeros auxilios

La familia ve una orientación solo cuando se cumplen cuatro condiciones: `PRIMEROS_AUXILIOS_HABILITADO` está activo, la primera categoría de la presuposición es `lesion_menor` o `picadura`, el nivel es bueno y el caso no está marcado como urgente. El texto sale del catálogo aprobado por un médico (RD-06) y siempre termina con "Su médico revisará el caso." En cualquier otro caso, la familia solo ve "Enviamos el caso a su médico." La orientación llega en la respuesta del envío y queda guardada como evento del caso, visible en la bitácora. El sistema nunca recomienda por su cuenta acudir a urgencias, salvo el aviso por reglas de RF-11.

- **RF-13-AC-1:** **Dado que** con `UMBRAL_CONF_BUENA` = 0.75 la primera categoría es `lesion_menor` con 0.86 y no hay señales de alarma, **cuando** se envía el caso, **entonces** la familia ve "Parece un raspón o corte superficial. Lave la zona con agua y jabón, séquela sin tallar y cúbrala con una gasa o curita. Su médico revisará el caso."
- **RF-13-AC-2:** **Dado que** la primera categoría es `lesion_menor` con 0.86 pero A4 es "Sí", **cuando** se envía el caso, **entonces** la familia no ve la orientación de primeros auxilios; ve el aviso de RF-11.
- **RF-13-AC-3:** **Dado que** la primera categoría es `roncha` con 0.90, **cuando** se envía el caso, **entonces** la familia solo ve "Enviamos el caso a su médico."
- **RF-13-AC-4:** **Dado que** la primera categoría es `picadura` con 0.60 (confianza mediana), **cuando** se envía el caso, **entonces** la familia solo ve "Enviamos el caso a su médico."
- **RF-13-AC-5:** **Dado que** `PRIMEROS_AUXILIOS_HABILITADO` está desactivado y la primera categoría es `lesion_menor` con 0.86, **cuando** se envía el caso, **entonces** la familia solo ve "Enviamos el caso a su médico."

#### RF-14: Bandeja y detalle del caso para el médico

La bandeja del médico muestra solo casos de sus pacientes vinculados, en tres secciones:

| Sección | Incluye | Orden |
|---|---|---|
| Urgentes | Casos abiertos marcados como urgentes (RF-11) | Del evento de la familia más antiguo sin atender al más reciente |
| Esperan su respuesta | Casos `ENVIADO`, `EN_REVISION` y `VALORADO` cuyo último evento es de la familia | Igual |
| Esperando a la familia | Casos `INFO_SOLICITADA` | Por fecha de la solicitud |

Los casos `VALORADO` cuyo último evento es del médico, y los `CERRADO`, no aparecen en la bandeja; se consultan en el historial de cada paciente. Al abrir un caso, el médico ve: paciente (nombre, edad, alergias), zona del cuerpo, fotos, cuestionario, señales de alarma, presuposición, conversación y los casos anteriores del mismo paciente que tenga permitido ver (RF-07-AC-6).

- **RF-14-AC-1:** **Dado que** un médico tiene tres casos `ENVIADO`, uno de ellos urgente, **cuando** abre su bandeja, **entonces** el urgente aparece en "Urgentes" y los otros dos en "Esperan su respuesta", del enviado hace más tiempo al más reciente.
- **RF-14-AC-2:** **Dado que** un médico abre un caso `ENVIADO` por primera vez, **cuando** se carga el detalle, **entonces** el caso pasa a `EN_REVISION` y la familia ve "Su médico está revisando el caso."
- **RF-14-AC-3:** **Dado que** un paciente tiene dos casos anteriores de la misma zona del cuerpo que el médico puede ver, **cuando** el médico abre el caso nuevo, **entonces** ve esos casos con sus fotos en orden de fecha.
- **RF-14-AC-4:** **Dado que** un médico no está vinculado al paciente de un caso, **cuando** solicita ese caso por su identificador, **entonces** la API responde `NO_ENCONTRADO`.
- **RF-14-AC-5:** **Dado que** un caso está en `INFO_SOLICITADA`, **cuando** el médico abre su bandeja, **entonces** el caso aparece en "Esperando a la familia"; cuando la familia responde, pasa a "Esperan su respuesta".
- **RF-14-AC-6:** **Dado que** un caso está `VALORADO` y la familia escribe un mensaje nuevo, **cuando** el médico abre su bandeja, **entonces** el caso aparece en "Esperan su respuesta".

#### RF-15: Conversación y solicitud de información

Médico y familia intercambian mensajes de texto dentro del caso. El médico puede además pedir información: más fotos, respuesta a una pregunta o ambas. La familia responde agregando fotos o texto como eventos nuevos, sin alterar lo ya enviado.

- **RF-15-AC-1:** **Dado que** un caso está `EN_REVISION`, **cuando** el médico pulsa "Pedir información" y escribe "Mándeme una foto con una moneda al lado", **entonces** el caso pasa a `INFO_SOLICITADA` y la familia recibe una notificación (RF-19) con ese texto.
- **RF-15-AC-2:** **Dado que** un caso está en `INFO_SOLICITADA`, **cuando** la familia agrega una foto válida o un mensaje y pulsa "Responder", **entonces** el caso vuelve a `EN_REVISION` y la foto o el mensaje aparece en la bitácora con fecha y autor.
- **RF-15-AC-3:** **Dado que** un caso está `CERRADO`, **cuando** cualquiera intenta enviar un mensaje, **entonces** la API responde `TRANSICION_INVALIDA` y el cliente muestra "Este caso está cerrado. Abra un caso nuevo si la lesión cambió."
- **RF-15-AC-4:** **Dado que** el cotutor envía un mensaje, **cuando** el médico abre la conversación, **entonces** ve el mensaje con el nombre del cotutor como autor.

#### RF-16: Valoración médica y cierre

El médico registra una valoración con una de tres decisiones (cuidado en casa, consulta presencial con un plazo en días, acudir a urgencias) y un texto con indicaciones. El caso pasa a `VALORADO`. La familia puede cerrarlo; si no lo hace, se cierra solo tras `DIAS_CIERRE_AUTOMATICO` días.

- **RF-16-AC-1:** **Dado que** un caso está `EN_REVISION`, **cuando** el médico registra "Cuidado en casa" con el texto "Crema de avena dos veces al día; si en 3 días sigue igual, me escribe.", **entonces** el caso pasa a `VALORADO` y la familia ve la decisión, el texto, el nombre del médico y la fecha.
- **RF-16-AC-2:** **Dado que** el médico elige "Consulta presencial", **cuando** intenta guardar sin indicar el plazo en días, **entonces** el sistema lo impide y pide el plazo.
- **RF-16-AC-3:** **Dado que** con `DIAS_CIERRE_AUTOMATICO` = 14 el último evento de un caso `VALORADO` tiene 14 días y 1 minuto, **cuando** corre el proceso programado, **entonces** el caso pasa a `CERRADO`. Si el último evento tiene 13 días, el caso sigue `VALORADO`.
- **RF-16-AC-4:** **Dado que** el médico registró una valoración, **cuando** la familia consulta el caso, **entonces** la valoración aparece como la decisión del médico y la presuposición no se muestra junto a ella.
- **RF-16-AC-5:** **Dado que** un caso está `VALORADO` con "Cuidado en casa", **cuando** el médico registra una nueva valoración "Consulta presencial" en 2 días, **entonces** la nueva queda como vigente, la anterior sigue visible en la bitácora y la familia recibe la notificación de RF-19.
- **RF-16-AC-6:** **Dado que** un caso está `CERRADO`, **cuando** el médico intenta registrar una valoración, **entonces** la API responde `TRANSICION_INVALIDA`.

#### RF-17: Aviso por falta de respuesta

DAFI no controla cuándo responde el médico. Si un caso enviado sigue sin que el médico lo abra, el sistema avisa a la familia por la app y por correo, sin esperar a que ella abra la app. El plazo es `HORAS_SIN_RESPUESTA` para casos normales y `MINUTOS_SIN_RESPUESTA_URGENTE` para urgentes. Cada caso recibe este aviso una sola vez.

- **RF-17-AC-1:** **Dado que** con `HORAS_SIN_RESPUESTA` = 4 un caso normal lleva 4 horas y 1 minuto en `ENVIADO`, **cuando** corre el proceso programado, **entonces** el tutor y el cotutor reciben el aviso "Su médico aún no ha abierto el caso. Si la lesión empeora, llámele directamente o acuda a un centro de salud." en la app y por correo.
- **RF-17-AC-2:** **Dado que** el médico abrió el caso a las 3 horas de enviado, **cuando** corre el proceso programado a las 4 horas y 1 minuto, **entonces** no se envía el aviso.
- **RF-17-AC-3:** **Dado que** con `MINUTOS_SIN_RESPUESTA_URGENTE` = 30 un caso urgente lleva 31 minutos en `ENVIADO`, **cuando** corre el proceso programado, **entonces** la familia recibe "Su médico aún no ha visto el caso. No espere: acuda a urgencias o llame al 911 si la situación lo requiere."

#### RF-18: Bitácora del paciente

Cada perfil tiene una bitácora con todos sus casos, del más reciente al más antiguo, con estado, zona del cuerpo, fecha y valoración. Dentro de cada caso se ven todos sus eventos en orden cronológico. La bitácora se puede filtrar por zona del cuerpo.

- **RF-18-AC-1:** **Dado que** el perfil "Mateo" tiene casos del 1 de septiembre y del 20 de septiembre, **cuando** el tutor abre su bitácora, **entonces** ve primero el del 20 de septiembre y luego el del 1 de septiembre, cada uno con estado, zona, fecha y valoración.
- **RF-18-AC-2:** **Dado que** el tutor filtra la bitácora por "Pierna izquierda", **cuando** se aplica el filtro, **entonces** solo aparecen los casos con esa zona.
- **RF-18-AC-3:** **Dado que** un caso tiene fotos iniciales, un mensaje del médico, una foto agregada después y una valoración, **cuando** la familia abre el caso, **entonces** ve esos eventos en orden cronológico, cada uno con fecha, hora y autor.

#### RF-19: Notificaciones

El sistema avisa dentro de la app y por correo cuando cambia algo que requiere acción del otro lado. El correo no incluye fotos, nombres de pacientes ni contenido clínico, solo un enlace a la app.

| Evento | A quién se notifica |
|---|---|
| Caso enviado (urgente o normal) | Médico vinculado |
| Médico solicita información | Tutor y cotutor |
| Familia responde una solicitud | Médico |
| Médico registra una valoración | Tutor y cotutor |
| Nuevo mensaje | La otra parte |
| La familia reporta que empeoró (RF-11) | Médico, como caso urgente |
| El médico no abre el caso a tiempo (RF-17) | Tutor y cotutor |
| La familia borra un caso enviado (RF-20) | Médico |

- **RF-19-AC-1:** **Dado que** el médico registra una valoración, **cuando** se guarda, **entonces** el tutor y el cotutor reciben un correo con el asunto "Su médico respondió en DAFI" y un enlace, sin nombre del paciente ni texto de la valoración.
- **RF-19-AC-2:** **Dado que** se envía un caso urgente, **cuando** se guarda el envío, **entonces** el médico recibe un correo con el asunto "Caso urgente en DAFI" y el caso aparece marcado en su bandeja.

#### RF-20: Eliminación de datos

Tutor y cotutor pueden borrar una foto de un caso en `BORRADOR` o un caso completo. Solo el tutor puede borrar un perfil o la cuenta familiar. El borrado es físico (RNF-07) y el médico pierde el acceso en su siguiente petición. Si el caso ya se había enviado, el médico recibe un aviso y queda un registro mínimo sin contenido clínico (identificador, fecha de envío y fecha de borrado), declarado en el aviso de privacidad, para que el médico pueda explicar su actuación.

- **RF-20-AC-1:** **Dado que** un caso está en `BORRADOR`, **cuando** la familia borra una de sus fotos, **entonces** la foto desaparece del caso y del almacenamiento.
- **RF-20-AC-2:** **Dado que** un caso fue enviado, **cuando** la familia intenta borrar solo una de sus fotos, **entonces** el sistema lo impide y ofrece borrar el caso completo, para no alterar lo que el médico ya valoró.
- **RF-20-AC-3:** **Dado que** el cotutor confirma el borrado de un caso `VALORADO`, **cuando** se procesa, **entonces** el caso, sus fotos, sus eventos y su presuposición se borran, el médico ya no lo ve en su bandeja, recibe "La familia eliminó un caso de Mateo enviado el 20/09" y queda el registro mínimo sin contenido clínico.
- **RF-20-AC-4:** **Dado que** el tutor escribe "ELIMINAR" y confirma el borrado de la cuenta familiar, **cuando** se procesa, **entonces** se borran la familia, sus perfiles, casos, fotos y la cuenta del cotutor, y se cierran todas sus sesiones.

#### RF-21: Consentimiento foto por foto

Cada foto tiene un interruptor "Usar para mejorar DAFI", apagado por defecto. Solo las fotos con el interruptor encendido pueden entrar a un conjunto de datos para mejorar el modelo, y solo sin nombre, fecha de nacimiento ni texto del caso. En la versión 1 el sistema solo registra la decisión; ninguna función usa esas fotos todavía (RD-08).

- **RF-21-AC-1:** **Dado que** una familia sube una foto, **cuando** se guarda, **entonces** el interruptor "Usar para mejorar DAFI" de esa foto está apagado.
- **RF-21-AC-2:** **Dado que** una familia enciende el interruptor en 1 de las 3 fotos de un caso, **cuando** se consulta el registro de consentimientos, **entonces** solo esa foto aparece como autorizada, con fecha y autor.
- **RF-21-AC-3:** **Dado que** una foto estaba autorizada, **cuando** la familia apaga el interruptor, **entonces** la foto deja de estar autorizada y se registra la fecha de revocación.

#### RF-22: Administración

El administrador revisa los médicos pendientes y los aprueba o rechaza tras consultar la cédula en el Registro Nacional de Profesionistas y comparar el nombre con la identificación oficial. Al resolver, la foto de la identificación se borra. También puede desactivar cualquier cuenta. No tiene acceso a casos, fotos de pacientes ni perfiles.

- **RF-22-AC-1:** **Dado que** un médico está pendiente, **cuando** el administrador lo aprueba, **entonces** la cuenta queda verificada, la foto de la identificación se borra y el médico recibe un correo que se lo confirma.
- **RF-22-AC-2:** **Dado que** el administrador rechaza a un médico con el motivo "La cédula no corresponde al nombre", **cuando** se guarda, **entonces** el médico recibe ese motivo por correo y sigue sin poder aceptar vinculaciones.
- **RF-22-AC-3:** **Dado que** el administrador tiene sesión abierta, **cuando** solicita cualquier caso o foto, **entonces** el sistema lo rechaza por falta de permisos.
- **RF-22-AC-4:** **Dado que** el administrador desactiva la cuenta de un médico, **cuando** ese médico intenta iniciar sesión o usar una sesión abierta, **entonces** la API lo rechaza, sus casos abiertos pasan a `SIN_MEDICO` y las familias vinculadas ven el aviso de RF-07-AC-5.

#### RF-23: Fallas durante el envío y el análisis

- **RF-23-AC-1:** **Dado que** con `TIMEOUT_INFERENCIA_S` = 40 el módulo de inferencia no responde en 40 s o responde con error, **cuando** se envía un caso, **entonces** el caso llega al médico de todos modos, el médico ve "Sugerencia no disponible" y la familia ve "Enviamos el caso a su médico."
- **RF-23-AC-2:** **Dado que** la conexión se pierde mientras se sube una foto, **cuando** el cliente detecta el fallo, **entonces** muestra "Se perdió la conexión." con el botón "Reintentar", que reenvía la misma foto ya preparada; el borrador conserva todo lo anterior.
- **RF-23-AC-3:** **Dado que** la API ya procesó una foto o un envío con cierta clave de solicitud, **cuando** recibe otra petición con la misma clave (por reintento o doble clic), **entonces** no duplica la foto ni el envío y devuelve el resultado del primero.

### 3.2 Requerimientos no funcionales

- **RNF-01:** La validación de una foto (RF-08) responde en 5 s o menos en el p95. Desde el envío de un caso hasta que la familia ve la respuesta de RF-13, el tiempo es de 60 s o menos en el p95; por eso `TIMEOUT_INFERENCIA_S` es menor que ese presupuesto. Ambos se miden con 30 casos de 3 fotos enviados en 10 minutos. | Categoría: rendimiento
- **RNF-02:** Cada foto que el cliente sube a la API pesa 1 MB o menos. | Categoría: rendimiento (eficiencia de red)
- **RNF-03:** Las pantallas de tutor y cotutor funcionan sin desplazamiento horizontal en pantallas de 360 px de ancho, en Chrome para Android 10 o superior y Safari para iOS 16 o superior. Las del médico funcionan además en navegadores de escritorio desde 1280 px. | Categoría: usabilidad y portabilidad
- **RNF-04:** Una persona que nunca ha usado DAFI registra un caso completo (tres fotos, zona y cuestionario) en 4 minutos o menos. Se verifica antes de la entrega con al menos 5 personas, midiendo desde que pulsan "Nuevo caso" hasta que pulsan "Enviar a mi médico". | Categoría: usabilidad
- **RNF-05:** Toda comunicación entre cliente y API usa HTTPS. Las contraseñas se guardan con un algoritmo de hash adaptativo (bcrypt o argon2). Las sesiones expiran tras `MINUTOS_SESION` minutos sin peticiones; cada petición reinicia el plazo. | Categoría: seguridad
- **RNF-06:** Ninguna foto guardada ni entregada por la API contiene metadatos EXIF; la API los vuelve a eliminar al recibirla aunque el cliente ya lo haya hecho. Las fotos solo se entregan a través de la API a tutor, cotutor o médico vinculado, sin URL públicas ni permanentes. Las fotos de la zona del pañal o genital se muestran solo en un visor sin opción de descarga, cada acceso queda registrado (RNF-08) y nunca pueden autorizarse para RF-21. Una app web no puede impedir capturas de pantalla; el aviso de RF-08-AC-8 lo deja claro sin prometer más. | Categoría: privacidad
- **RNF-07:** Al borrar una foto, un caso, un perfil o una cuenta (RF-20), los documentos y archivos se borran físicamente en el momento; no se usa borrado lógico. Los respaldos que contengan fotos se conservan como máximo `DIAS_RETENCION_RESPALDO` días, plazo que se declara en el aviso de privacidad. | Categoría: privacidad
- **RNF-08:** Cada vez que un médico abre un caso o una foto, el sistema registra quién, qué y cuándo. El tutor ve ese registro en el caso ("Visto por Dra. … el 27/09 a las 18:40"). | Categoría: seguridad (trazabilidad)
- **RNF-09:** Antes de la entrega, el modelo se evalúa con un conjunto documentado de al menos 30 fotos de celular por categoría, etiquetadas por un médico, que incluya pieles morenas, niños y lesiones que se parecen a una menor sin serlo (quemaduras, piquetes infectados, petequias). El informe registra cuántas veces `lesion_menor` o `picadura` con confianza buena correspondían en realidad a otra categoría. Los umbrales se ajustan hasta que esa tasa sea menor al 5 %. Si ningún umbral lo logra, `PRIMEROS_AUXILIOS_HABILITADO` se desactiva y RF-13 no muestra orientación. | Categoría: confiabilidad del modelo
- **RNF-10:** El sistema está disponible el 99 % del tiempo medido por mes. Si la infraestructura gratuita suspende servicios por inactividad, el primer envío tras la suspensión debe cumplir igual RNF-01. | Categoría: disponibilidad
- **RNF-11:** Agregar un tipo de caso nuevo (por ejemplo, "Fiebre") requiere solo cargar su cuestionario, sus señales de alarma y sus categorías en los catálogos. No requiere cambiar el esquema de la base de datos ni los endpoints de casos. Se verifica en S09 cargando un tipo de prueba. | Categoría: mantenibilidad (extensibilidad)

### 3.3 Requerimientos de dominio

- **RD-01:** DAFI no diagnostica. La IA no clasifica gravedad ni recomienda tratamientos con medicamentos; la valoración de cada caso es del médico y es su responsabilidad profesional. Ningún texto generado por el sistema afirma que el paciente tiene una enfermedad.
- **RD-02:** Las fotos y los datos de salud son datos personales sensibles conforme a la LFPDPPP. Su tratamiento, incluida su transferencia al médico vinculado, requiere aviso de privacidad y consentimiento expreso. Los datos de un menor los consiente quien ejerce la patria potestad o la tutela, y los menores no tienen cuenta propia.
- **RD-03:** Solo pueden atender casos médicos con cédula profesional verificada en el Registro Nacional de Profesionistas de la Secretaría de Educación Pública.
- **RD-04:** DAFI no es un expediente clínico ni emite recetas. El médico registra en su propio expediente, conforme a la NOM-004-SSA3-2012, lo que considere necesario de la atención dada por DAFI.
- **RD-05:** Las señales de alarma se evalúan con reglas fijas sobre las respuestas de la familia y no con el modelo. Son el único caso en que el sistema recomienda acudir a urgencias sin la decisión del médico.
- **RD-06:** Los textos del cuestionario, las señales de alarma y la orientación de primeros auxilios los revisa y aprueba un médico antes de la primera versión. La aprobación queda registrada con nombre, cédula y fecha. Quién será ese médico está pendiente de definir (ver `revision_SRS.md`).
- **RD-07:** El modelo es preentrenado y no se reentrena durante el curso. Sus clases se mapean al catálogo de categorías de la versión 1.
- **RD-08:** Ninguna foto se usa para mejorar el modelo sin el consentimiento foto por foto de RF-21. En la versión 1 no hay ningún uso de este tipo.
- **RD-09:** La versión 1 cubre solo problemas de la piel. Otros tipos de caso se agregan en versiones posteriores sobre los mismos catálogos (RNF-11).

### 3.4 Parámetros configurables

Valores iniciales. Los marcados con † se ajustan según RNF-09.

| Parámetro | Valor inicial | Usado en |
|---|---|---|
| `MIN_FOTOS` | 3 | RF-08, RF-10 |
| `MAX_FOTOS` | 6 | RF-08 |
| `LADO_MAX_PX` | 1024 px | RF-08, RNF-02 |
| `UMBRAL_NITIDEZ` | 100 (varianza del laplaciano) | RF-08 |
| `UMBRAL_BRILLO_MIN` | 50 (de 0 a 255) | RF-08 |
| `UMBRAL_CONF_MEDIA` † | 0.50 | RF-12 |
| `UMBRAL_CONF_BUENA` † | 0.75 | RF-12, RF-13 |
| `TIMEOUT_INFERENCIA_S` | 40 s | RF-23, RNF-01 |
| `HORAS_SIN_RESPUESTA` | 4 h | RF-17 |
| `MINUTOS_SIN_RESPUESTA_URGENTE` | 30 | RF-17 |
| `EDAD_MESES_FIEBRE_BEBE` | 3 | RF-11 |
| `PRIMEROS_AUXILIOS_HABILITADO` | Activo | RF-13, RNF-09 |
| `HORAS_IDEMPOTENCIA` | 24 | 3.0 |
| `DIAS_CIERRE_AUTOMATICO` | 14 | RF-16 |
| `DIAS_INVITACION` | 7 | RF-05, RF-07 |
| `MAX_INTENTOS_LOGIN` | 5 | RF-02 |
| `MINUTOS_BLOQUEO` | 15 | RF-02 |
| `MINUTOS_ENLACE_RESTABLECER` | 60 | RF-03 |
| `MINUTOS_SESION` | 60 | RNF-05 |
| `DIAS_RETENCION_RESPALDO` | 7 | RNF-07 |

### 3.5 Matriz de trazabilidad con la elicitación

"B" es la sesión con el cliente real (Rocío Vega) y "A" la sesión simulada, ambas en `transcript_entrevista.md`.

| Requerimiento | Origen |
|---|---|
| RF-01, RF-04, RD-02 | B: P1, P2 (los pacientes son sus hijos) |
| RF-05 | B: P2 ("su papá también"), P3 (fotos que él reenvía) |
| RF-06, RF-07, RD-03 | B: P2 (su médica de confianza), P7 |
| RF-08 | B: P3 (mínimo 3 fotos, ubicación visible); A: P3 (fotos borrosas, HEIC, WhatsApp) |
| RF-09, RF-10 | B: P1 (preguntas de contexto), P4 ("corroborar que he dado toda la información") |
| RF-11, RD-05 | Agregado por mí, ajustado tras la revisión técnica; B: P4 (no exagerar la urgencia). Justificación en `revision_SRS.md` |
| RF-12, RF-13, RD-01 | B: P4 (presuposición a la doctora; primeros auxilios en un raspón), P7 |
| RF-14, RF-15, RF-16 | B: P1 (la doctora pide más fotos y pregunta), P2 (canal fuera de WhatsApp) |
| RF-17 | B: P4, P6 (espera de minutos; confía en la respuesta de su doctora) |
| RF-18 | B: P2; A: P1, S5 (seguir la evolución de una lesión) |
| RF-20, RF-21, RD-08 | B: P5 (ella elige qué borrar y qué se usa) |
| RF-22 | Derivado de RD-03 |
| RF-23 | A: P6 (mala señal) |
| RNF-03, RNF-04 | B: P6 (solo celular), P4 (desinstalaría la app si no le sirve) |
| RNF-06, RNF-07, RNF-08 | B: P5 (solo su doctora ve las fotos); A: P5, S3 |
| RNF-09 | B: P4 (perdería la confianza si la app exagera); A: P4 (sesgo hacia pieles claras) |
| RNF-11, RD-09 | Decisión de alcance (versión 1 solo piel) |
