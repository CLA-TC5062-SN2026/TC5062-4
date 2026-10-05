# Especificación de Requerimientos de Software (SRS): DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A1, Parte 0
**Versión:** 3.0 de equipo (octubre de 2026). Sustituye a los SRS individuales de S02-A1. El cambio de alcance y su resolución están en `diferencias_SRS.md`.
**Estructura:** IEEE 830 simplificada

---

## 1. Introducción

### 1.1 Propósito del documento

Este documento especifica qué debe hacer DAFI y bajo qué condiciones. Es el contrato del equipo para el resto del curso: los criterios de aceptación con identificador `RF-XX-AC-Y` son la base del backlog (S03), del diseño de la API (S04, cada operación de `openapi.yaml` declarará los suyos en la extensión `x-acceptance-criteria`) y de las pruebas automatizadas (S09, cada prueba llevará el identificador como nombre). Escribimos los criterios en formato Dado que / cuando / entonces porque es la especificación basada en criterios de aceptación que describe el SWEBOK: los escenarios de BDD son a la vez el requerimiento y el caso de prueba de aceptación, lo que reduce la ambigüedad del lenguaje natural (IEEE Computer Society, 2024, pp. 1-12–1-13).

Está dirigido al equipo de desarrollo, a quien diseñe las pruebas y a los stakeholders que validan que lo escrito corresponda a lo que pidieron.

### 1.2 Alcance del sistema

DAFI es una aplicación web para celular donde una familia agrega a los médicos que ya conoce (amigos, conocidos, el médico de siempre) y conversa con ellos sobre la salud de sus seres queridos en un espacio dedicado, fuera de WhatsApp. Cada conversación pertenece a un paciente, tiene una o más etiquetas (Piel, Fiebre, Estómago, Respiratorio, Otro) y llega al médico con las respuestas a unas preguntas de contexto fijas, para que no tenga que pedirlas cada vez.

DAFI es un intermediario: no diagnostica, no evalúa la urgencia y no recomienda tratamientos. La única función con IA es el **resumen de contexto**: cuando el médico abre una conversación, DAFI le muestra citas textuales del historial del paciente que son relevantes (alergias, medicamentos, episodios anteriores con la misma etiqueta, indicaciones previas), cada una con enlace al mensaje de donde salió. Las conclusiones son del médico.

**Incluido en la versión 1:**

- Cuenta familiar con cuidador principal y cocuidador, y perfiles de paciente para hijos menores, para el propio cuidador y para otros adultos que den su consentimiento.
- Círculo médico: varios médicos por familia, invitados por correo, sin verificación de credenciales.
- Conversaciones con etiqueta, preguntas de contexto por etiqueta, fotos opcionales, mensajes, solicitud de información, indicaciones del médico y cierre.
- Aviso fijo de emergencias.
- Bandeja del médico, historial del paciente y resumen de contexto con citas verificables.
- Permisos de historial por médico, notificaciones, eliminación de datos, registro de accesos y reportes de abuso.

**Excluido de la versión 1:**

- Diagnóstico, clasificación de imágenes, evaluación de urgencia u orientación de salud generada por el sistema.
- Recetas, indicación de medicamentos por parte del sistema y cualquier documento con validez de expediente clínico.
- Verificación de cédula profesional.
- Videollamadas, agenda de citas y pagos.
- Directorio o búsqueda de médicos: la familia agrega a médicos que ya conoce.
- Aplicación nativa para Android o iOS.
- Integración con expedientes clínicos o sistemas de hospitales.

### 1.3 Definiciones y acrónimos

| Término | Definición |
|---|---|
| **Familia** | Cuenta compartida por un cuidador principal y, opcionalmente, un cocuidador. Contiene los perfiles de paciente y el círculo médico. |
| **Cuidador principal** | Adulto que crea la familia. Administra perfiles, cocuidador y círculo médico. |
| **Cocuidador** | Adulto invitado por el cuidador principal. Abre y consulta conversaciones, pero no administra la familia. |
| **Perfil de paciente** | La persona de quien se habla: nombre, fecha de nacimiento, alergias y medicamentos de uso continuo. No tiene cuenta ni inicia sesión. |
| **Adulto representado** | Persona de 18 años o más, distinta del cuidador, que tiene un perfil en la familia (por ejemplo, un padre mayor). Debe dar su consentimiento (RF-05). |
| **Círculo médico** | Los médicos que la familia invitó y que aceptaron. |
| **Médico** | Persona que se registró por invitación de una familia y aceptó los términos de uso para médicos. DAFI no verifica sus credenciales (RD-03). |
| **Conversación** | Hilo sobre un problema de salud de un perfil, dirigido a un médico del círculo. Contiene preguntas de contexto, mensajes, fotos e indicaciones. |
| **Etiqueta** | Tema de la conversación tomado del catálogo (3.0). Define las preguntas de contexto y permite filtrar el historial. |
| **Evento** | Cada entrada fechada dentro de una conversación: una respuesta, un mensaje, una foto, un cambio de estado o una indicación. |
| **Historial del paciente** | Todas las conversaciones de un perfil con sus eventos, en orden cronológico. |
| **Resumen de contexto** | Lista de citas textuales del historial, agrupadas por tipo y con su fuente, que se muestra al médico al abrir una conversación (RF-17). |
| **Cita textual** | Fragmento copiado sin cambios de un mensaje o respuesta del historial. |
| **Prioridad indicada por la familia** | Marca que la familia pone al abrir la conversación («Necesito respuesta pronto»). Es decisión de la familia; DAFI no la evalúa. |
| **Módulo de resumen** | Componente que llama a un modelo de lenguaje para seleccionar las citas del resumen de contexto. |
| **EXIF** | Metadatos incrustados en una imagen (ubicación GPS, fecha, modelo del dispositivo). |
| **HEIC / HEIF** | Formato de imagen que usan por defecto los iPhone. |
| **LFPDPPP** | Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México). |
| **p95** | Percentil 95: valor por debajo del cual queda el 95 % de las mediciones. |
| **GWT** | Given-When-Then (Dado que, cuando, entonces): formato de los criterios de aceptación. |
| **RF / RNF / RD** | Requerimiento funcional / no funcional / de dominio. |

---

## 2. Descripción general

### 2.1 Perspectiva del producto

DAFI es un sistema nuevo e independiente. No se integra con expedientes clínicos; el médico conserva su propio expediente fuera de DAFI (RD-04). Tiene cuatro componentes:

- **Cliente web** (Next.js), pensado para el navegador del celular. Convierte y reduce las fotos en el dispositivo antes de subirlas.
- **API** (Node.js con Express), que maneja autenticación, roles, círculo médico, conversaciones, permisos y notificaciones.
- **Base de datos** (MongoDB) para cuentas, familias, perfiles, conversaciones, eventos y catálogos. Las fotos se guardan en un almacenamiento de archivos accesible solo desde la API.
- **Módulo de resumen**, que recibe de la API los eventos que el médico puede ver, sin datos que identifiquen al paciente (RNF-12), y devuelve citas candidatas. La API es su único cliente y verifica cada cita antes de mostrarla. El proveedor del modelo de lenguaje se decide en S04.

Las etiquetas, las preguntas de contexto y el aviso de emergencias son catálogos que se cargan al desplegar. Un médico revisa su contenido antes de la primera versión (RD-05).

### 2.2 Funciones del producto

- **Cuenta y familia:** registrarse, iniciar sesión, recuperar acceso, crear perfiles, pedir el consentimiento de un adulto representado e invitar a un cocuidador.
- **Círculo médico:** invitar médicos, que se registren y acepten, quitarlos y decidir qué historial ve cada uno.
- **Conversaciones:** abrir una conversación con etiqueta y médico, responder las preguntas de contexto, agregar fotos, enviarla, conversar, responder solicitudes de información, recibir indicaciones y cerrarla.
- **Contexto para el médico:** bandeja, historial del paciente y resumen de contexto.
- **Privacidad y confianza:** aviso de emergencias, notificaciones sin contenido clínico, eliminación de datos, registro de accesos y reportes de abuso.

### 2.3 Características del usuario

| Rol | Quién es | Rasgos relevantes para el diseño |
|---|---|---|
| **Cuidador principal** | Madre, padre o adulto que cuida de alguien. El caso de referencia es una madre con dos hijos pequeños que hoy manda fotos por WhatsApp a una amiga pediatra. | Usa solo el celular. No confía en que una app juzgue la salud de sus hijos; sí quiere que su médico tenga toda la información. Si la app le cuesta más que WhatsApp, la deja. |
| **Cocuidador** | El otro padre u otro adulto de la familia. | Abre conversaciones cuando el cuidador principal no está. |
| **Médico** | Amigo o conocido de la familia, de cualquier especialidad. | Atiende por confianza, no por pago, entre otras actividades. Antes de opinar pide fotos y contexto. Usa celular o computadora. |
| **Administrador** | Integrante del equipo durante el curso. | Atiende reportes de abuso y desactiva cuentas. No ve conversaciones, fotos ni perfiles. |

### 2.4 Restricciones

- **Tecnológicas:** Next.js en el frontend, Node.js con Express en el backend y MongoDB como base de datos. Aplicación web únicamente.
- **Modelo de lenguaje:** se usa un servicio externo para el módulo de resumen. El proveedor debe permitir por contrato que los datos no se usen para entrenar sus modelos (RD-06).
- **Calendario:** 12 semanas de curso.
- **Legales:** tratamiento de datos sensibles de salud conforme a la LFPDPPP (RD-02).
- **Supuesto de conectividad:** el sistema requiere internet para enviar mensajes y fotos.

---

## 3. Requerimientos específicos

### 3.0 Reglas generales

Estas reglas aplican a todos los criterios de aceptación y no se repiten en cada uno.

**Parámetros.** Los nombres en `MAYÚSCULAS` son parámetros configurables sin cambiar código (tabla 3.4). Los criterios que dependen de un parámetro declaran su valor en el «Dado que»; las pruebas inyectan esos valores.

**Roles y permisos.** Cada cuenta tiene un solo rol. Esta matriz es la fuente de autorización de la API.

| Operación | Cuidador principal | Cocuidador | Médico | Administrador |
|---|---|---|---|---|
| Crear, editar y eliminar perfiles (RF-04, RF-05) | ✔ | | | |
| Invitar o quitar al cocuidador (RF-06) | ✔ | | | |
| Invitar o quitar médicos y compartir historial (RF-07, RF-08) | ✔ | | | |
| Abrir, enviar, consultar y cerrar conversaciones (RF-09 a RF-12, RF-15) | ✔ | ✔ | | |
| Salir de la familia (RF-06) | | ✔ | | |
| Aceptar o rechazar una invitación de familia y retirarse (RF-07, RF-08) | | | ✔ | |
| Enviar mensajes en una conversación (RF-14) | ✔ | ✔ | ✔ solo las dirigidas a él | |
| Pedir información y registrar indicaciones (RF-14, RF-15) | | | ✔ solo las dirigidas a él | |
| Bandeja, historial permitido y resumen de contexto (RF-16 a RF-18) | | | ✔ | |
| Historial completo de la familia (RF-18) | ✔ | ✔ | | |
| Eliminar fotos y conversaciones (RF-21) | ✔ | ✔ | | |
| Eliminar perfiles o la cuenta familiar (RF-21) | ✔ | | | |
| Reportar abuso o problemas técnicos (RF-22) | ✔ | ✔ | ✔ | |
| Atender reportes y desactivar cuentas (RF-22) | | | | ✔ |

**Acceso indebido.** Si al rol le falta la operación, el sistema responde «sin permisos» (se verifica primero). Si el rol tiene la operación pero el recurso es de otra familia o de una conversación que el médico no puede ver, responde «no encontrado», sin revelar que existe.

**Qué puede ver un médico.** Un médico ve las conversaciones dirigidas a él. Ve además las demás conversaciones de un perfil solo si la familia activó «Compartir historial» para ese perfil y ese médico (RF-08). Esta regla aplica igual al historial (RF-18) y al resumen de contexto (RF-17).

**Estados de la conversación.** Estas son las únicas transiciones válidas. Cualquier otra se rechaza con `TRANSICION_INVALIDA`.

| Estado origen | Acción | Quién | Estado destino |
|---|---|---|---|
| (ninguno) | Abrir conversación | Cuidador, cocuidador | `BORRADOR` |
| `BORRADOR` | Enviar con los puntos de RF-12 completos | Cuidador, cocuidador | `ENVIADA` |
| `ENVIADA` | Abrir la conversación por primera vez (RF-16) | Médico | `EN_REVISION` |
| `EN_REVISION` o `CON_INDICACIONES` | Pedir información (RF-14) | Médico | `INFO_SOLICITADA` |
| `INFO_SOLICITADA` | Responder la solicitud (RF-14) | Cuidador, cocuidador | `EN_REVISION` |
| `EN_REVISION` o `INFO_SOLICITADA` | Registrar indicaciones (RF-15) | Médico | `CON_INDICACIONES` |
| `CON_INDICACIONES` | Registrar nuevas indicaciones (sustituyen a las vigentes; ambas quedan en el historial) | Médico | `CON_INDICACIONES` |
| `ENVIADA`, `EN_REVISION`, `INFO_SOLICITADA` o `CON_INDICACIONES` | Cerrar | Cuidador, cocuidador | `CERRADA` |
| `CON_INDICACIONES` | Pasan `DIAS_CIERRE_AUTOMATICO` días sin eventos nuevos | Sistema | `CERRADA` |
| `ENVIADA`, `EN_REVISION` o `INFO_SOLICITADA` | El médico sale del círculo o se desactiva (RF-08, RF-22) | Sistema | `SIN_MEDICO` |
| `SIN_MEDICO` | Redirigir a otro médico del círculo (RF-08) | Cuidador, cocuidador | `ENVIADA` |

Los mensajes (RF-14) no cambian el estado. Una conversación `CERRADA` no se reabre. Los borradores no caducan en la versión 1. Todo cambio de estado se registra como evento.

**Catálogo de etiquetas (versión 1).** Una conversación tiene de una a tres etiquetas.

| Código | Nombre | Preguntas de contexto (RF-10) |
|---|---|---|
| `piel` | Piel | Generales + P1 a P3 |
| `fiebre` | Fiebre | Generales + F1 a F2 |
| `estomago` | Estómago y digestión | Generales + E1 a E2 |
| `respiratorio` | Respiratorio | Generales + R1 a R2 |
| `otro` | Otro | Generales |

**Zonas del cuerpo** (pregunta P1). Cabeza y cuello, cara, boca y labios, pecho y abdomen, espalda, brazo izquierdo, brazo derecho, mano izquierda, mano derecha, zona del pañal o genital, pierna izquierda, pierna derecha, pie izquierdo, pie derecho.

**Visibilidad de perfiles de adulto.** El perfil del propio cuidador y el de un adulto representado solo los ve el cuidador principal, salvo que active «Compartir con el cocuidador».

**Fechas y reloj.** Las fechas se registran en UTC y se muestran en la zona horaria America/Mexico_City. La API toma la hora de un reloj inyectable. Los procesos programados (RF-15 y RF-20) corren cada 15 minutos y las pruebas pueden invocarlos directamente.

**Contrato de errores.** Todo rechazo de la API devuelve un código de esta tabla y un identificador de correlación, además del texto que muestra el cliente. La respuesta nunca incluye trazas internas, y una falla a mitad de una operación no deja datos a medias. Los códigos HTTP son la sugerencia para S04.

| Código | HTTP | Uso |
|---|---|---|
| `NO_AUTENTICADO` | 401 | Sesión inexistente o expirada |
| `SIN_PERMISOS` | 403 | El rol no tiene la operación |
| `CUENTA_NO_VERIFICADA` | 403 | Correo sin verificar |
| `NO_ENCONTRADO` | 404 | Recurso de otra familia, conversación que el médico no puede ver o recurso inexistente |
| `TRANSICION_INVALIDA` | 409 | Acción no permitida en el estado actual de la conversación |
| `LIMITE_ALCANZADO` | 409 | La familia ya tiene cocuidador, la conversación ya tiene `MAX_FOTOS` fotos o ya tiene tres etiquetas |
| `CONSENTIMIENTO_PENDIENTE` | 409 | El adulto representado aún no da su consentimiento |
| `ARCHIVO_INVALIDO` | 415 | La foto no es JPEG o pesa más de 1 MB (1 048 576 bytes) |
| `DATOS_INVALIDOS` | 422 | Campo faltante o con formato incorrecto; la respuesta lista los campos |
| `FOTO_RECHAZADA` | 422 | Foto borrosa u oscura; la respuesta indica el motivo |
| `CONVERSACION_INCOMPLETA` | 422 | Envío sin los puntos de RF-12; la respuesta lista los puntos faltantes |
| `BLOQUEADO` | 429 | Demasiados intentos de inicio de sesión |

**Idempotencia.** Las peticiones que suben fotos, envían conversaciones o envían mensajes llevan la cabecera `Idempotency-Key`, generada por el cliente. La clave es única por usuario y vale `HORAS_IDEMPOTENCIA` horas.

### 3.1 Requerimientos funcionales

#### Épica E1: Familia y círculo médico

#### RF-01: Registro del cuidador principal

Una persona crea una cuenta familiar con correo y contraseña, y confirma el correo con un enlace. Antes de crear la cuenta, el sistema muestra el aviso de privacidad (que declara el uso del módulo de resumen, RD-06) y exige tres declaraciones: ser mayor de 18 años, consentir el tratamiento de sus datos de salud y consentir, como madre, padre o tutor legal, el tratamiento de los datos de salud de los menores que registre.

- **RF-01-AC-1:** **Dado que** una persona sin cuenta llenó un correo válido y una contraseña de al menos 8 caracteres, y marcó las tres declaraciones, **cuando** envía el registro, **entonces** el sistema crea una familia con esa persona como cuidador principal, guarda la fecha y la versión del aviso aceptado y abre su sesión.
- **RF-01-AC-2:** **Dado que** una persona dejó sin marcar cualquiera de las tres declaraciones, **cuando** envía el registro, **entonces** el sistema no crea la cuenta y señala la declaración faltante con el texto «Necesitamos esta autorización para usar DAFI.»
- **RF-01-AC-3:** **Dado que** ya existe una cuenta con el correo capturado, **cuando** la persona envía el registro, **entonces** el sistema no crea una cuenta nueva y muestra «Ya existe una cuenta con este correo.»
- **RF-01-AC-4:** **Dado que** un cuidador se registró y no ha abierto el enlace de verificación, **cuando** intenta enviar una conversación o una invitación, **entonces** la API responde `CUENTA_NO_VERIFICADA` y el cliente muestra «Confirme su correo para continuar.» Crear perfiles y borradores sí está permitido.
- **RF-01-AC-5:** **Dado que** un usuario aceptó la versión 1 del aviso de privacidad y se publica una versión 2 que requiere aceptación, **cuando** inicia sesión, **entonces** el sistema le muestra la versión 2 y no le permite enviar conversaciones ni mensajes hasta aceptarla; al aceptarla, registra usuario, versión, fecha y hora.
- **RF-01-AC-6:** **Dado que** una persona sin sesión entra a DAFI, **cuando** abre «Qué es DAFI», **entonces** ve, sin necesidad de registrarse, que DAFI organiza conversaciones con médicos que la familia ya conoce, que no diagnostica ni evalúa la urgencia, que no verifica las credenciales de los médicos y el aviso fijo de emergencias de RF-13.

#### RF-02: Inicio y cierre de sesión

- **RF-02-AC-1:** **Dado que** una cuenta activa existe, **cuando** su dueño ingresa el correo y la contraseña correctos, **entonces** el sistema abre la sesión y muestra la pantalla de inicio de su rol (perfiles de la familia para cuidador y cocuidador, bandeja para el médico).
- **RF-02-AC-2:** **Dado que** alguien ingresa credenciales incorrectas, **cuando** envía el formulario, **entonces** el sistema muestra «Los datos no coinciden» sin indicar si el error está en el correo o en la contraseña.
- **RF-02-AC-3:** **Dado que** con `MAX_INTENTOS_LOGIN` = 5 y `MINUTOS_BLOQUEO` = 15 se registraron 5 intentos fallidos consecutivos para un mismo correo desde una misma dirección IP (exista o no la cuenta), **cuando** se hace un sexto intento desde esa IP aun con credenciales correctas, **entonces** la API responde `BLOQUEADO` durante 15 minutos contados desde el quinto intento y, si la cuenta existe, su titular recibe un correo de aviso. Los intentos desde otra IP no quedan bloqueados.
- **RF-02-AC-4:** **Dado que** un usuario tiene sesión abierta, **cuando** pulsa «Cerrar sesión», **entonces** el sistema invalida la sesión y cualquier petición posterior con ella se rechaza con `NO_AUTENTICADO`.
- **RF-02-AC-5:** **Dado que** no existe una sesión válida, **cuando** se solicita cerrar sesión, **entonces** la API no crea ninguna sesión, no devuelve un error interno y el cliente muestra la pantalla de inicio de sesión.

#### RF-03: Recuperación de acceso y gestión de la cuenta

Además de recuperar el acceso, un usuario con sesión puede cambiar su contraseña y editar su nombre. El correo no se edita en la versión 1.

- **RF-03-AC-1:** **Dado que** alguien captura un correo en «Olvidé mi contraseña», **cuando** envía la solicitud, **entonces** el sistema muestra «Si el correo está registrado, recibirá un enlace.» exista o no la cuenta, y si existe envía un enlace de un solo uso válido por `MINUTOS_ENLACE_RESTABLECER` minutos.
- **RF-03-AC-2:** **Dado que** con `MINUTOS_ENLACE_RESTABLECER` = 30 un enlace se generó hace 31 minutos, **cuando** la persona lo abre, **entonces** el sistema muestra «El enlace venció. Solicite uno nuevo.» y no permite cambiar la contraseña.
- **RF-03-AC-3:** **Dado que** una persona restableció su contraseña, **cuando** termina el cambio, **entonces** todas sus sesiones abiertas se invalidan.
- **RF-03-AC-4:** **Dado que** una persona ya usó un enlace de restablecimiento vigente para cambiar su contraseña, **cuando** vuelve a abrir el mismo enlace, **entonces** el sistema muestra «El enlace ya se usó. Solicite uno nuevo.» y no permite otro cambio.
- **RF-03-AC-5:** **Dado que** un usuario tiene sesión abierta, **cuando** captura su contraseña actual correcta y una nueva de al menos 8 caracteres, **entonces** la contraseña cambia, se invalidan sus demás sesiones y recibe un correo de aviso. Si la contraseña actual es incorrecta, la API responde `DATOS_INVALIDOS` y la contraseña no cambia.
- **RF-03-AC-6:** **Dado que** un médico cambia su nombre en «Mi cuenta», **cuando** guarda, **entonces** las familias de su círculo ven el nombre nuevo en las conversaciones abiertas y en las anteriores.

#### RF-04: Perfiles de menores y del propio cuidador

El cuidador principal crea un perfil por cada hijo menor y, si quiere, uno para sí mismo. Cada perfil tiene nombre, fecha de nacimiento y, opcionalmente, alergias conocidas y medicamentos de uso continuo.

- **RF-04-AC-1:** **Dado que** un cuidador captura nombre «Mateo» y fecha de nacimiento 12/03/2021, **cuando** guarda el perfil, **entonces** el perfil aparece en la lista de la familia para el cuidador y el cocuidador, con la edad calculada en años.
- **RF-04-AC-2:** **Dado que** un cuidador captura una fecha de nacimiento posterior a la fecha actual, **cuando** guarda el perfil, **entonces** la API responde `DATOS_INVALIDOS` y el cliente muestra «Revise la fecha de nacimiento.»
- **RF-04-AC-3:** **Dado que** un cocuidador tiene sesión abierta, **cuando** intenta crear, editar o eliminar un perfil, **entonces** la API responde `SIN_PERMISOS`.
- **RF-04-AC-4:** **Dado que** un cuidador agrega «Salbutamol inhalado» a los medicamentos de un perfil, **cuando** guarda el cambio, **entonces** los médicos que pueden ver conversaciones de ese perfil ven el medicamento en el resumen de contexto (RF-17) con la fuente «Perfil».
- **RF-04-AC-5:** **Dado que** un cuidador captura para un perfil de menor una fecha de nacimiento que da 18 años o más y que no es la suya, **cuando** guarda, **entonces** el sistema no crea el perfil y le ofrece «Agregar a otro adulto» (RF-05).

#### RF-05: Perfil de otro adulto con consentimiento

El cuidador principal puede crear el perfil de otro adulto (por ejemplo, su madre). Ese adulto debe dar su propio consentimiento: recibe un correo con un enlace válido por `DIAS_INVITACION` días, lee el aviso de privacidad y acepta. Hasta entonces el perfil queda «Pendiente de consentimiento» y no se puede enviar ninguna conversación sobre él. El adulto representado no tiene cuenta, pero el correo de confirmación incluye un enlace permanente para revocar su consentimiento.

- **RF-05-AC-1:** **Dado que** un cuidador crea el perfil «Elena», de 68 años, y captura su correo, **cuando** guarda, **entonces** el perfil aparece como «Pendiente de consentimiento» y Elena recibe un correo con el enlace.
- **RF-05-AC-2:** **Dado que** el perfil «Elena» está pendiente de consentimiento, **cuando** la familia intenta enviar una conversación sobre ella, **entonces** la API responde `CONSENTIMIENTO_PENDIENTE`, el borrador se conserva y el cliente muestra «Elena aún no autoriza que compartamos su información.»
- **RF-05-AC-3:** **Dado que** Elena abre un enlace vigente y acepta, **cuando** se procesa, **entonces** el perfil queda activo, se guarda la fecha y la versión del aviso aceptado y el cuidador recibe un aviso.
- **RF-05-AC-4:** **Dado que** Elena había dado su consentimiento, **cuando** abre el enlace de revocación y confirma, **entonces** su perfil, sus conversaciones y sus fotos se borran (RF-21), y el cuidador y los médicos que atendían sus conversaciones reciben un aviso.

#### RF-06: Cocuidador

El cuidador principal invita por correo a un segundo adulto. Al aceptar, esa persona crea su cuenta con las mismas declaraciones de RF-01 y queda como cocuidador. Una familia tiene como máximo un cocuidador.

- **RF-06-AC-1:** **Dado que** un cuidador captura un correo en «Invitar a otro adulto», **cuando** envía la invitación, **entonces** el sistema envía a ese correo un enlace válido por `DIAS_INVITACION` días.
- **RF-06-AC-2:** **Dado que** la persona invitada abre un enlace vigente y completa el registro con las tres declaraciones, **cuando** confirma, **entonces** su cuenta queda con rol cocuidador y ve los perfiles de menores y los perfiles de adulto compartidos con ella, con sus conversaciones.
- **RF-06-AC-3:** **Dado que** la familia ya tiene un cocuidador, **cuando** el cuidador intenta enviar otra invitación, **entonces** la API responde `LIMITE_ALCANZADO` y el cliente muestra «Esta familia ya tiene otro adulto registrado.»
- **RF-06-AC-4:** **Dado que** el cuidador quita al cocuidador, **cuando** confirma, **entonces** el cocuidador pierde acceso de inmediato y las conversaciones y fotos que registró se conservan en la familia.
- **RF-06-AC-5:** **Dado que** un cocuidador pulsa «Salir de la familia» y confirma, **cuando** se procesa, **entonces** pierde el acceso, su cuenta se borra, las conversaciones que registró se conservan y el cuidador recibe un aviso.

#### RF-07: Invitación de médicos al círculo

El cuidador principal invita a un médico por correo. Si el correo no tiene cuenta de médico, la invitación incluye el registro: nombre, contraseña, especialidad (texto libre, opcional) y la aceptación de los términos de uso para médicos (sus indicaciones son responsabilidad profesional suya; DAFI no verifica credenciales, no es expediente clínico ni garantiza tiempos de respuesta). Un médico puede pertenecer al círculo de varias familias. En todas las pantallas de la familia, el nombre del médico aparece con la leyenda «Contacto agregado por usted» (RD-03).

- **RF-07-AC-1:** **Dado que** un cuidador captura el correo de una persona sin cuenta, **cuando** envía la invitación, **entonces** el sistema envía un enlace de registro válido por `DIAS_INVITACION` días y el círculo muestra «Esperando respuesta».
- **RF-07-AC-2:** **Dado que** la persona invitada completa el registro sin marcar la aceptación de los términos, **cuando** lo envía, **entonces** la API responde `DATOS_INVALIDOS` y la cuenta no se crea.
- **RF-07-AC-3:** **Dado que** un médico con cuenta recibe la invitación de otra familia, **cuando** la acepta, **entonces** esa familia aparece en su lista y el médico aparece en el círculo de la familia con la leyenda «Contacto agregado por usted».
- **RF-07-AC-4:** **Dado que** el médico rechaza la invitación, **cuando** se procesa, **entonces** el cuidador ve «El médico no aceptó la invitación» y el médico no queda en el círculo.
- **RF-07-AC-5:** **Dado que** una cuenta tiene rol médico, **cuando** intenta crear perfiles o conversaciones, **entonces** la API responde `SIN_PERMISOS`.

#### RF-08: Gestión del círculo y permisos de historial

El cuidador principal puede quitar a un médico y el médico puede retirarse de una familia. Por cada perfil y cada médico, el cuidador decide si activa «Compartir historial», que le permite a ese médico ver las conversaciones del perfil dirigidas a otros médicos.

- **RF-08-AC-1:** **Dado que** el perfil «Mateo» tiene una conversación con la Dra. A y otra con el Dr. B, y «Compartir historial» está apagado para el Dr. B, **cuando** el Dr. B solicita la conversación de la Dra. A por su identificador, **entonces** la API responde `NO_ENCONTRADO`.
- **RF-08-AC-2:** **Dado que** el cuidador activa «Compartir historial» de «Mateo» con el Dr. B, **cuando** el Dr. B abre el historial de Mateo, **entonces** ve también la conversación con la Dra. A, en solo lectura.
- **RF-08-AC-3:** **Dado que** el Dr. B tiene una conversación `EN_REVISION`, **cuando** el cuidador lo quita del círculo o el Dr. B se retira, **entonces** el Dr. B deja de ver todas las conversaciones de la familia en su siguiente petición, la conversación pasa a `SIN_MEDICO` y la familia ve «Este médico ya no atiende la conversación. Puede dirigirla a otro médico de su círculo.»
- **RF-08-AC-4:** **Dado que** una conversación está `SIN_MEDICO`, **cuando** la familia la dirige a la Dra. A, **entonces** pasa a `ENVIADA` y llega a la bandeja de la Dra. A con todos sus eventos.

#### Épica E2: Conversaciones de salud

#### RF-09: Apertura de una conversación

La familia abre una conversación eligiendo el perfil, de una a tres etiquetas del catálogo (3.0), un médico del círculo y un título breve. Opcionalmente marca «Necesito respuesta pronto». Antes de la primera pregunta se muestra el aviso de emergencias (RF-13).

- **RF-09-AC-1:** **Dado que** el círculo de la familia tiene a la Dra. A, **cuando** el cuidador abre una conversación para «Mateo» con la etiqueta «Fiebre», la Dra. A y el título «Fiebre desde anoche», **entonces** se crea en `BORRADOR` con esos datos y se muestran las preguntas de contexto de RF-10 para la etiqueta.
- **RF-09-AC-2:** **Dado que** una conversación ya tiene tres etiquetas, **cuando** la familia intenta agregar una cuarta, **entonces** la API responde `LIMITE_ALCANZADO`.
- **RF-09-AC-3:** **Dado que** el círculo de la familia está vacío, **cuando** el cuidador pulsa «Nueva conversación», **entonces** el cliente muestra «Agregue primero a un médico de su confianza» con un acceso a RF-07.
- **RF-09-AC-4:** **Dado que** la familia marcó «Necesito respuesta pronto», **cuando** envía la conversación, **entonces** la conversación llega con la marca «Prioridad indicada por la familia» y la familia no recibe ningún mensaje adicional del sistema sobre su salud.

#### RF-10: Preguntas de contexto

Cada conversación incluye las preguntas generales y las de sus etiquetas. Si dos etiquetas comparten una pregunta, se hace una sola vez. Las obligatorias deben responderse para enviar.

| # | Etiqueta | Pregunta | Respuesta | Obligatoria |
|---|---|---|---|---|
| G1 | Todas | ¿Desde cuándo? | Hoy / ayer / hace 2 a 7 días / hace más de una semana | Sí |
| G2 | Todas | ¿Qué le preocupa? | Texto libre | Sí |
| G3 | Todas | ¿Tomó algún medicamento en los últimos 3 días? | Sí (texto) / No / No sé | Sí |
| G4 | Todas | ¿Algo más que quiera contarle a su médico? | Texto libre | No |
| P1 | Piel | ¿En qué parte del cuerpo? | Catálogo de zonas (3.0) | Sí |
| P2 | Piel | ¿Pica o duele? | Pica / duele / ambas / ninguna | Sí |
| P3 | Piel | ¿Ha crecido o se ha extendido? | Sí / No / No sé | Sí |
| F1 | Fiebre | Temperatura más alta que midió | Número en °C / no la he medido | Sí |
| F2 | Fiebre | ¿Dónde la midió? | Axila / boca / oído / frente / recto | No |
| E1 | Estómago | ¿Ha vomitado o tenido diarrea en las últimas 24 horas? | Vómito / diarrea / ambas / ninguna | Sí |
| E2 | Estómago | ¿Qué comió en las últimas 24 horas que fuera distinto? | Texto libre | No |
| R1 | Respiratorio | ¿Tiene tos? | Seca / con flemas / no | Sí |
| R2 | Respiratorio | ¿Tiene escurrimiento nasal? | Sí / No | No |

- **RF-10-AC-1:** **Dado que** una familia respondió G1 a G3 en una conversación con la etiqueta «Otro», **cuando** guarda, **entonces** las respuestas quedan como eventos con fecha y autor.
- **RF-10-AC-2:** **Dado que** una conversación tiene las etiquetas «Fiebre» y «Respiratorio», **cuando** la familia abre el cuestionario, **entonces** ve G1 a G4, F1, F2, R1 y R2, cada pregunta una sola vez.
- **RF-10-AC-3:** **Dado que** una familia respondió G3 con «Sí» sin escribir el medicamento, **cuando** guarda, **entonces** el sistema marca G3 como incompleta con «Cuéntenos qué medicamento tomó.»
- **RF-10-AC-4:** **Dado que** una familia captura 39.5 en F1, **cuando** guarda, **entonces** el sistema registra el valor sin mostrar ninguna interpretación ni mensaje adicional.
- **RF-10-AC-5:** **Dado que** el perfil tiene alergias o medicamentos registrados, **cuando** la familia abre el cuestionario, **entonces** los ve como referencia sobre G3.

#### RF-11: Fotos

Las fotos son opcionales en todas las etiquetas. La familia puede agregar hasta `MAX_FOTOS` por conversación, desde la cámara o la galería (incluidas las recibidas por WhatsApp), en JPEG, PNG o HEIC, de hasta `MB_MAX_ORIGINAL` megabytes. El cliente convierte cada foto a JPEG, reduce su lado mayor a `LADO_MAX_PX` y elimina los metadatos EXIF antes de subirla. La API rechaza con `FOTO_RECHAZADA` las fotos borrosas u oscuras. La nitidez es la varianza de la convolución de la imagen en escala de grises con el kernel laplaciano [[0, 1, 0], [1, −4, 1], [0, 1, 0]]; el brillo es el promedio de la luminancia Y = 0.299 R + 0.587 G + 0.114 B, de 0 a 255. Si la etiqueta es «Piel», antes de la primera foto se muestra una guía (una foto de cerca, una a media distancia donde se vea la parte del cuerpo y una desde otro ángulo, con luz natural). Si P1 es «zona del pañal o genital», aplican las protecciones de RNF-06.

- **RF-11-AC-1:** (Prueba de extremo a extremo en Chrome para Android y Safari para iOS.) **Dado que** una madre elige una foto HEIC de 4032 × 3024 píxeles, **cuando** la agrega, **entonces** el archivo que recibe la API es JPEG, su lado mayor mide como máximo `LADO_MAX_PX` píxeles y no contiene EXIF.
- **RF-11-AC-2:** **Dado que** con `UMBRAL_NITIDEZ` = 100 una foto tiene nitidez de 40, **cuando** se valida, **entonces** el sistema no la agrega y muestra «La foto salió borrosa. Acérquese y mantenga el teléfono quieto.»
- **RF-11-AC-3:** **Dado que** con `UMBRAL_BRILLO_MIN` = 50 una foto nítida tiene brillo promedio de 30, **cuando** se valida, **entonces** el sistema no la agrega y muestra «La foto está muy oscura. Busque luz natural.»
- **RF-11-AC-4:** **Dado que** con `MAX_FOTOS` = 6 una conversación ya tiene 6 fotos, **cuando** la familia intenta agregar otra, **entonces** la API responde `LIMITE_ALCANZADO` y el cliente muestra «Una conversación admite hasta 6 fotos.»
- **RF-11-AC-5:** **Dado que** la API recibe directamente un archivo que no es JPEG, o un JPEG de más de 1 048 576 bytes, **cuando** lo procesa, **entonces** responde `ARCHIVO_INVALIDO` sin guardarlo.
- **RF-11-AC-6:** **Dado que** la familia respondió P1 con «zona del pañal o genital», **cuando** pulsa «Tomar foto», **entonces** el sistema muestra antes de abrir la cámara «Las fotos de esta zona solo las verá su médico y no se podrán descargar.»
- **RF-11-AC-7:** **Dado que** con `MB_MAX_ORIGINAL` = 10 la familia elige de la galería un archivo de 12 MB, o un archivo que no es JPEG, PNG ni HEIC, **cuando** el cliente lo revisa, **entonces** no lo sube y muestra la causa específica («La foto pesa más de 10 MB.» o «Este formato no se admite. Use JPEG, PNG o HEIC.»), y la familia puede elegir otra.

#### RF-12: Revisión y envío

Antes de enviar, el sistema muestra una lista con tres puntos: preguntas obligatorias respondidas, médico del círculo elegido y perfil con consentimiento vigente (para adultos representados). El botón «Enviar a mi médico» solo se habilita con los tres completos.

- **RF-12-AC-1:** **Dado que** un borrador tiene médico elegido y le falta responder G2, **cuando** la familia lo revisa, **entonces** la lista muestra «Falta: ¿Qué le preocupa?» y el botón está deshabilitado.
- **RF-12-AC-2:** **Dado que** un borrador tiene los tres puntos completos, **cuando** la familia pulsa «Enviar a mi médico», **entonces** la conversación pasa a `ENVIADA`, las respuestas y fotos enviadas quedan de solo lectura, el médico la recibe en su bandeja y la familia ve «Enviamos la conversación a su médico.»
- **RF-12-AC-3:** **Dado que** la API recibe una petición de envío de un borrador sin G1 (por ejemplo, saltándose el cliente), **cuando** la procesa, **entonces** responde `CONVERSACION_INCOMPLETA`, el borrador sigue en `BORRADOR` y la respuesta lista los puntos faltantes.

#### RF-13: Aviso fijo de emergencias

DAFI no evalúa la urgencia de ninguna conversación. En su lugar, muestra siempre el mismo aviso, tomado del catálogo aprobado (RD-05): «DAFI no atiende emergencias. Si la persona tiene dificultad para respirar, pierde el conocimiento o la situación le preocupa, llame al 911 o acuda a urgencias.», con un botón para llamar al 911. Aparece al abrir una conversación y queda fijo en la parte superior de toda conversación abierta, del lado de la familia.

- **RF-13-AC-1:** **Dado que** una familia abre una conversación con cualquier etiqueta, **cuando** se muestra la primera pantalla, **entonces** aparece el aviso con el texto del catálogo y el botón «Llamar al 911».
- **RF-13-AC-2:** **Dado que** dos conversaciones tienen respuestas distintas (F1 = 36.8 en una y F1 = 40.2 en otra), **cuando** la familia las consulta, **entonces** el aviso es idéntico en ambas y no aparece ningún otro mensaje del sistema sobre la salud del paciente.
- **RF-13-AC-3:** **Dado que** una conversación está `CERRADA`, **cuando** la familia la consulta, **entonces** el aviso no aparece fijo, pero sí al abrir una conversación nueva.

#### RF-14: Mensajes y solicitud de información

Médico y familia intercambian mensajes de texto dentro de la conversación. El médico puede además pedir información: más fotos, respuesta a una pregunta o ambas. La familia responde con fotos o texto como eventos nuevos, sin alterar lo ya enviado.

- **RF-14-AC-1:** **Dado que** una conversación está `EN_REVISION`, **cuando** el médico pulsa «Pedir información» y escribe «Mándeme una foto con una moneda al lado», **entonces** la conversación pasa a `INFO_SOLICITADA` y la familia recibe una notificación (RF-19) con ese texto.
- **RF-14-AC-2:** **Dado que** una conversación está en `INFO_SOLICITADA`, **cuando** la familia agrega una foto válida o un mensaje y pulsa «Responder», **entonces** la conversación vuelve a `EN_REVISION` y la respuesta aparece en el historial con fecha y autor.
- **RF-14-AC-3:** **Dado que** una conversación está `CERRADA`, **cuando** cualquiera intenta enviar un mensaje, **entonces** la API responde `TRANSICION_INVALIDA` y el cliente muestra «Esta conversación está cerrada. Abra una nueva si algo cambió.»
- **RF-14-AC-4:** **Dado que** el cocuidador envía un mensaje, **cuando** el médico abre la conversación, **entonces** ve el mensaje con el nombre del cocuidador como autor.

#### RF-15: Indicaciones del médico y cierre

El médico registra sus indicaciones como texto libre y, opcionalmente, marca una de tres decisiones (cuidado en casa, consulta presencial con un plazo en días, acudir a urgencias). La conversación pasa a `CON_INDICACIONES`. La familia puede cerrarla en cualquier momento después de enviarla; si no lo hace, se cierra sola tras `DIAS_CIERRE_AUTOMATICO` días sin eventos.

- **RF-15-AC-1:** **Dado que** una conversación está `EN_REVISION`, **cuando** el médico registra «Paracetamol según su peso cada 6 horas; si sigue igual mañana, me escribe.» sin marcar decisión, **entonces** la conversación pasa a `CON_INDICACIONES` y la familia ve el texto, el nombre del médico con la leyenda «Contacto agregado por usted» y la fecha.
- **RF-15-AC-2:** **Dado que** el médico marca «Consulta presencial», **cuando** intenta guardar sin indicar el plazo en días, **entonces** la API responde `DATOS_INVALIDOS` y el cliente pide el plazo.
- **RF-15-AC-3:** **Dado que** con `DIAS_CIERRE_AUTOMATICO` = 14 el último evento de una conversación `CON_INDICACIONES` tiene 14 días y 1 minuto, **cuando** corre el proceso programado, **entonces** pasa a `CERRADA`. Si el último evento tiene 13 días, sigue `CON_INDICACIONES`.
- **RF-15-AC-4:** **Dado que** una conversación tiene indicaciones, **cuando** el médico registra unas nuevas, **entonces** las nuevas quedan como vigentes, las anteriores siguen visibles en el historial y la familia recibe la notificación de RF-19.
- **RF-15-AC-5:** **Dado que** una conversación está `CERRADA`, **cuando** el médico intenta registrar indicaciones, **entonces** la API responde `TRANSICION_INVALIDA`.

#### Épica E3: Contexto para el médico

#### RF-16: Bandeja y detalle para el médico

La bandeja muestra solo conversaciones dirigidas al médico, en tres secciones:

| Sección | Incluye | Orden |
|---|---|---|
| Prioridad indicada por la familia | Conversaciones abiertas con la marca de RF-09-AC-4 cuyo último evento es de la familia | Del evento sin atender más antiguo al más reciente |
| Esperan su respuesta | Conversaciones `ENVIADA`, `EN_REVISION` y `CON_INDICACIONES` cuyo último evento es de la familia | Igual |
| Esperando a la familia | Conversaciones `INFO_SOLICITADA` | Por fecha de la solicitud |

Al abrir una conversación, el médico ve el perfil (nombre, edad, alergias, medicamentos), las etiquetas, las respuestas, las fotos, los mensajes y el resumen de contexto (RF-17).

- **RF-16-AC-1:** **Dado que** un médico tiene tres conversaciones `ENVIADA`, una con prioridad indicada por la familia, **cuando** abre su bandeja, **entonces** esa aparece en «Prioridad indicada por la familia» y las otras dos en «Esperan su respuesta», de la enviada hace más tiempo a la más reciente.
- **RF-16-AC-2:** **Dado que** un médico abre una conversación `ENVIADA` por primera vez, **cuando** se carga el detalle, **entonces** pasa a `EN_REVISION` y la familia ve «Su médico está revisando la conversación.»
- **RF-16-AC-3:** **Dado que** una conversación está en `INFO_SOLICITADA`, **cuando** el médico abre su bandeja, **entonces** aparece en «Esperando a la familia»; cuando la familia responde, pasa a «Esperan su respuesta».
- **RF-16-AC-4:** **Dado que** un médico pertenece al círculo de dos familias, **cuando** abre su bandeja, **entonces** ve las conversaciones de ambas con el nombre de la familia y del paciente, y puede filtrar por familia.

#### RF-17: Resumen de contexto

Al abrir una conversación, el médico ve arriba un resumen con el título «Resumen automático del historial. Verifique en los mensajes originales.» El resumen tiene tres grupos: **Alergias y medicamentos**, **Episodios anteriores con la misma etiqueta** e **Indicaciones previas de un médico**. Los datos del perfil (alergias y medicamentos) se muestran directo, con la fuente «Perfil», sin pasar por el modelo. El resto lo selecciona el módulo de resumen entre los eventos que el médico puede ver (3.0) y sigue estas reglas:

- Cada elemento es una **cita textual** de un mensaje o respuesta, con autor, fecha y enlace al evento de origen.
- La API verifica cada cita antes de mostrarla: el evento citado debe existir, el médico debe poder verlo y el texto debe aparecer tal cual en ese evento. Lo que no cumpla se descarta y no se muestra.
- El resumen no agrega texto propio aparte de los títulos fijos de los grupos.
- Se genera al abrir la conversación y se regenera si hay eventos nuevos desde la última vez.
- Cada resumen registra el proveedor y la versión del modelo de lenguaje que lo generó, para que un cambio de versión se pueda rastrear y, si empeora RNF-09, revertir a la anterior.

La familia puede desactivar el resumen por perfil en «Privacidad».

- **RF-17-AC-1:** **Dado que** el perfil «Mateo» tiene la alergia «penicilina» y una conversación anterior con la etiqueta «Piel» dirigida a la misma médica, en la que ella escribió el 12/08 «Use crema de óxido de zinc dos veces al día», **cuando** la médica abre una conversación nueva de Mateo con la etiqueta «Piel», **entonces** el resumen muestra «penicilina» en «Alergias y medicamentos» con la fuente «Perfil», y en «Indicaciones previas» la cita «Use crema de óxido de zinc dos veces al día» con autor, fecha 12/08 y enlace.
- **RF-17-AC-2:** **Dado que** el módulo de resumen devuelve (con un módulo simulado en la prueba) una cita cuyo texto no aparece en el evento que dice citar, **cuando** la API prepara el resumen, **entonces** descarta esa cita y muestra las demás.
- **RF-17-AC-3:** **Dado que** el perfil tiene una conversación con el Dr. B y «Compartir historial» está apagado para la Dra. A, **cuando** la Dra. A abre una conversación del perfil, **entonces** el resumen no contiene citas de la conversación con el Dr. B y la petición al módulo de resumen no incluye sus eventos.
- **RF-17-AC-4:** **Dado que** el perfil no tiene conversaciones anteriores visibles para el médico, **cuando** abre la conversación, **entonces** el resumen muestra solo los datos del perfil y el texto «No hay conversaciones anteriores que pueda ver.»
- **RF-17-AC-5:** **Dado que** la familia desactivó el resumen para el perfil «Mateo», **cuando** el médico abre una conversación de Mateo, **entonces** ve «La familia desactivó el resumen automático» y no se envía ninguna petición al módulo de resumen.
- **RF-17-AC-6:** **Dado que** el médico considera que una cita no es relevante o está fuera de contexto, **cuando** pulsa «No es correcto» en ella, **entonces** la cita deja de mostrarse en esa conversación y se registra un evento con la marca, visible para el equipo en las métricas de RNF-09.

#### RF-18: Historial del paciente

Cada perfil tiene un historial con todas sus conversaciones, de la más reciente a la más antigua, con estado, etiquetas, médico, fecha e indicaciones vigentes. Dentro de cada conversación se ven todos sus eventos en orden cronológico. El historial se puede filtrar por etiqueta y por médico. La familia ve el historial completo; el médico, solo lo que puede ver según 3.0.

- **RF-18-AC-1:** **Dado que** el perfil «Mateo» tiene conversaciones del 1 y del 20 de septiembre, **cuando** el cuidador abre su historial, **entonces** ve primero la del 20 y luego la del 1, cada una con estado, etiquetas, médico, fecha e indicaciones.
- **RF-18-AC-2:** **Dado que** el cuidador filtra el historial por «Piel», **cuando** se aplica el filtro, **entonces** solo aparecen conversaciones con esa etiqueta.
- **RF-18-AC-3:** **Dado que** una conversación tiene respuestas iniciales, un mensaje del médico, una foto agregada después e indicaciones, **cuando** la familia la abre, **entonces** ve esos eventos en orden cronológico, cada uno con fecha, hora y autor.
- **RF-18-AC-4:** **Dado que** el perfil «Mateo» no tiene conversaciones, **cuando** el cuidador abre su historial, **entonces** ve «Aún no hay conversaciones de Mateo» con un acceso a «Nueva conversación», y no un mensaje de error.

#### Épica E4: Privacidad y confianza

#### RF-19: Notificaciones

El sistema avisa dentro de la app y por correo cuando algo requiere acción del otro lado. El correo no incluye fotos, nombres de pacientes ni contenido de la conversación, solo un enlace a la app.

| Evento | A quién se notifica |
|---|---|
| Conversación enviada | Médico al que va dirigida |
| Médico solicita información | Cuidador y cocuidador con acceso al perfil |
| Familia responde una solicitud o escribe un mensaje | Médico |
| Médico escribe un mensaje o registra indicaciones | Cuidador y cocuidador con acceso al perfil |
| El médico no abre la conversación a tiempo (RF-20) | Cuidador y cocuidador con acceso al perfil |
| La familia borra una conversación enviada (RF-21) | Médico |
| Un adulto representado da o revoca su consentimiento (RF-05) | Cuidador principal |

- **RF-19-AC-1:** **Dado que** el médico registra indicaciones, **cuando** se guardan, **entonces** el cuidador y el cocuidador reciben un correo con el asunto «Su médico respondió en DAFI» y un enlace, sin nombre del paciente ni texto de las indicaciones.
- **RF-19-AC-2:** **Dado que** se envía una conversación con prioridad indicada por la familia, **cuando** se guarda el envío, **entonces** el médico recibe un correo con el asunto «Una familia le pidió respuesta pronto en DAFI», sin datos del paciente.

#### RF-20: Aviso por falta de respuesta

DAFI no controla cuándo responde el médico. Si una conversación enviada sigue sin que el médico la abra, el sistema avisa a la familia por la app y por correo. El plazo es `HORAS_SIN_RESPUESTA` en general y `MINUTOS_SIN_RESPUESTA_PRIORIDAD` si la familia marcó prioridad. Cada conversación recibe este aviso una sola vez. El texto es fijo y no depende de las respuestas.

- **RF-20-AC-1:** **Dado que** con `HORAS_SIN_RESPUESTA` = 4 una conversación sin prioridad lleva 4 horas y 1 minuto en `ENVIADA`, **cuando** corre el proceso programado, **entonces** la familia recibe «Su médico aún no ha abierto la conversación. Puede llamarle directamente o dirigirla a otro médico de su círculo. Si hay una emergencia, llame al 911.»
- **RF-20-AC-2:** **Dado que** el médico abrió la conversación a las 3 horas de enviada, **cuando** corre el proceso programado a las 4 horas y 1 minuto, **entonces** no se envía el aviso.
- **RF-20-AC-3:** **Dado que** con `MINUTOS_SIN_RESPUESTA_PRIORIDAD` = 30 una conversación con prioridad lleva 31 minutos en `ENVIADA`, **cuando** corre el proceso programado, **entonces** la familia recibe el mismo texto de RF-20-AC-1.

#### RF-21: Eliminación de datos

Cuidador y cocuidador pueden borrar una foto de una conversación en `BORRADOR` o una conversación completa. Solo el cuidador principal puede borrar un perfil o la cuenta familiar. El borrado es físico (RNF-07) y el médico pierde el acceso en su siguiente petición. Si la conversación ya se había enviado, el médico recibe un aviso y queda un registro mínimo sin contenido de salud (identificador, fecha de envío y fecha de borrado), declarado en el aviso de privacidad.

- **RF-21-AC-1:** **Dado que** una conversación está en `BORRADOR`, **cuando** la familia borra una de sus fotos, **entonces** la foto desaparece de la conversación y del almacenamiento.
- **RF-21-AC-2:** **Dado que** una conversación fue enviada, **cuando** la familia intenta borrar solo una foto, **entonces** el sistema lo impide y ofrece borrar la conversación completa.
- **RF-21-AC-3:** **Dado que** el cocuidador confirma el borrado de una conversación `CON_INDICACIONES`, **cuando** se procesa, **entonces** la conversación, sus fotos y sus eventos se borran, deja de aparecer en historiales y resúmenes, el médico recibe «La familia eliminó una conversación enviada el 20/09» y queda el registro mínimo.
- **RF-21-AC-4:** **Dado que** el cuidador escribe «ELIMINAR» y confirma el borrado de la cuenta familiar, **cuando** se procesa, **entonces** se borran la familia, sus perfiles, conversaciones, fotos y la cuenta del cocuidador, y se cierran todas sus sesiones. Las cuentas de los médicos se conservan.
- **RF-21-AC-5:** **Dado que** el cuidador confirmó el borrado de la cuenta familiar, **cuando** termina la operación, **entonces** el sistema le muestra y le envía por correo qué se borró, qué se conserva (el registro mínimo de conversaciones enviadas) y por cuánto tiempo permanece en los respaldos (`DIAS_RETENCION_RESPALDO` días).
- **RF-21-AC-6:** **Dado que** un cuidador abre la sección «Privacidad», **cuando** se carga, **entonces** ve qué datos guarda DAFI de cada perfil, qué médicos pueden ver cada perfil (y si tienen «Compartir historial»), el estado del resumen automático, cuánto tiempo se conservan los respaldos y el enlace al aviso de privacidad vigente.

#### RF-22: Reportes y administración

Cualquier usuario puede reportar a otro desde su perfil o desde una conversación (por ejemplo, una persona que se hace pasar por médico o un mensaje ofensivo), o reportar un problema técnico desde «Ayuda». El administrador ve los reportes con el motivo y los identificadores de las cuentas, pero no el contenido de las conversaciones. Puede desactivar una cuenta.

- **RF-22-AC-1:** **Dado que** un cuidador reporta a un médico con el motivo «No es médico», **cuando** se guarda, **entonces** el administrador ve el reporte con el motivo, la fecha y las cuentas involucradas, sin mensajes ni fotos.
- **RF-22-AC-2:** **Dado que** el administrador tiene sesión abierta, **cuando** solicita cualquier conversación, foto o perfil, **entonces** la API responde `SIN_PERMISOS`.
- **RF-22-AC-3:** **Dado que** el administrador desactiva la cuenta de un médico, **cuando** ese médico intenta iniciar sesión o usar una sesión abierta, **entonces** la API lo rechaza, sus conversaciones abiertas pasan a `SIN_MEDICO` y las familias ven el aviso de RF-08-AC-3.
- **RF-22-AC-4:** **Dado que** un usuario describe un problema técnico en «Ayuda» y lo envía, **cuando** se guarda, **entonces** el usuario ve «Recibimos su reporte» y el administrador lo ve con la fecha, el rol de quien reporta, la pantalla en la que estaba y el identificador de correlación del último error, sin datos de pacientes. Si el envío falla, el usuario ve «No pudimos enviar su reporte. Intente de nuevo.» y el texto se conserva.

#### RF-23: Fallas de red y del módulo de resumen

- **RF-23-AC-1:** **Dado que** con `TIMEOUT_RESUMEN_S` = 20 el módulo de resumen no responde en 20 s o responde con error, **cuando** el médico abre la conversación, **entonces** ve la conversación completa y, en lugar del resumen, «Resumen no disponible. Puede consultar el historial completo.»
- **RF-23-AC-2:** **Dado que** la conexión se pierde mientras se sube una foto o un mensaje, **cuando** el cliente detecta el fallo, **entonces** muestra «Se perdió la conexión.» con el botón «Reintentar», que reenvía el mismo contenido; el borrador conserva todo lo anterior.
- **RF-23-AC-3:** **Dado que** la API ya procesó una foto, un mensaje o un envío con cierta clave de solicitud, **cuando** recibe otra petición con la misma clave, **entonces** no lo duplica y devuelve el resultado del primero.

### 3.2 Requerimientos no funcionales

- **RNF-01:** La validación de una foto (RF-11) responde en 5 s o menos en el p95. El detalle de una conversación se muestra en 2 s o menos en el p95 sin esperar al resumen, y el resumen (RF-17) aparece en 15 s o menos en el p95 para historiales de hasta 20 conversaciones. Se mide con 30 aperturas en 10 minutos. | Categoría: rendimiento
- **RNF-02:** Cada foto que el cliente sube a la API pesa 1 MB o menos. | Categoría: rendimiento (eficiencia de red)
- **RNF-03:** Las pantallas de cuidador y cocuidador funcionan sin desplazamiento horizontal en pantallas de 360 px de ancho, en Chrome para Android 10 o superior y Safari para iOS 16 o superior. Las del médico funcionan además en las dos versiones más recientes de Chrome, Edge, Firefox y Safari de escritorio, de 1280 a 1920 px. | Categoría: usabilidad y portabilidad
- **RNF-04:** Se verifica antes de la entrega con al menos 5 personas que nunca han usado DAFI: al menos 4 de 5 abren y envían una conversación completa (etiqueta, médico, preguntas obligatorias y una foto) sin ayuda, y la mediana de tiempo es de 3 minutos o menos. | Categoría: usabilidad
- **RNF-05:** Toda comunicación usa TLS 1.2 o superior. Las fotos y los datos de salud se cifran en reposo. Las contraseñas se guardan con Argon2id o bcrypt con sal individual, y los enlaces de restablecimiento e invitación se guardan de forma no reversible. Las sesiones expiran tras `MINUTOS_SESION` minutos sin peticiones y se revocan al cerrar sesión, al restablecer la contraseña o al borrar la cuenta. | Categoría: seguridad
- **RNF-06:** Ninguna foto guardada ni entregada por la API contiene metadatos EXIF; la API los vuelve a eliminar al recibirla. Las fotos solo se entregan a través de la API a quien puede ver la conversación, sin URL públicas ni permanentes. Las fotos de la zona del pañal o genital se muestran solo en un visor sin opción de descarga y nunca se envían al módulo de resumen. Una app web no puede impedir capturas de pantalla; el aviso de RF-11-AC-6 no promete más. | Categoría: privacidad
- **RNF-07:** Al borrar una foto, una conversación, un perfil o una cuenta (RF-21), los documentos y archivos se borran físicamente en el momento. Los respaldos se conservan como máximo `DIAS_RETENCION_RESPALDO` días, plazo que se declara en el aviso de privacidad. | Categoría: privacidad
- **RNF-08:** Cada vez que un médico abre una conversación o una foto, el sistema registra quién, qué y cuándo. La familia ve ese registro en la conversación («Visto por Dra. … el 27/09 a las 18:40»). | Categoría: seguridad (trazabilidad)
- **RNF-09:** Antes de la entrega, el resumen se evalúa con al menos 20 historiales de prueba sintéticos, cada uno con los hechos relevantes marcados a mano por el equipo. El informe registra, por separado para cada grupo del resumen (alergias y medicamentos, episodios anteriores, indicaciones previas) y no solo como un total, el porcentaje de hechos relevantes que el resumen incluyó (meta: 80 % o más en cada grupo) y el número de citas que, aunque textuales, sacadas de contexto sugieren un diagnóstico (meta: 0, revisado por dos integrantes). En producción se reporta cada semana la tasa de citas marcadas «No es correcto» (RF-17-AC-6). | Categoría: confiabilidad del resumen
- **RNF-10:** El sistema está disponible el 99 % del tiempo medido por mes. Si la infraestructura gratuita suspende servicios por inactividad, la primera petición tras la suspensión debe cumplir igual RNF-01. | Categoría: disponibilidad
- **RNF-11:** Agregar una etiqueta nueva requiere solo cargarla en el catálogo con sus preguntas. No requiere cambiar el esquema de la base de datos ni los endpoints de conversaciones. Se verifica en S09 cargando una etiqueta de prueba. | Categoría: mantenibilidad (extensibilidad)
- **RNF-12:** Las peticiones al módulo de resumen no incluyen nombre, fecha de nacimiento, correo ni nombre de familiares del paciente: el nombre se sustituye por «el paciente» y la edad se envía en años. Se verifica inspeccionando las peticiones en las pruebas de RF-17. | Categoría: privacidad
- **RNF-13:** Los registros (logs) no contienen contraseñas, tokens, fotos, texto de mensajes ni correos en texto claro. Los eventos de seguridad (inicio y cierre de sesión, bloqueos, restablecimientos, cambios de permisos, desactivaciones) se registran con fecha UTC, actor, acción, recurso, resultado e identificador de correlación. | Categoría: privacidad y auditoría
- **RNF-14:** El flujo de la familia (abrir, responder y enviar una conversación) y la bandeja del médico se pueden usar solo con teclado, con foco visible, y ningún estado (por ejemplo, la prioridad o un punto pendiente de RF-12) se comunica solo con color. | Categoría: accesibilidad

### 3.3 Requerimientos de dominio

- **RD-01:** DAFI no diagnostica, no evalúa la urgencia y no recomienda tratamientos. Ningún texto generado por el sistema afirma o sugiere que el paciente tiene una condición. Los únicos textos sobre salud que muestra el sistema por su cuenta son el aviso fijo de RF-13 y el de RF-20; todo lo demás lo escribe la familia o el médico.
- **RD-02:** Las fotos y los datos de salud son datos personales sensibles conforme a la LFPDPPP. Su tratamiento, incluida su comunicación al médico, requiere aviso de privacidad y consentimiento expreso. Los datos de un menor los consiente quien ejerce la patria potestad o la tutela; los de un adulto, el propio adulto (RF-05).
- **RD-03:** DAFI no verifica las credenciales de los médicos. La familia elige a quién agrega y la interfaz lo dice siempre («Contacto agregado por usted»). Los términos de uso para médicos establecen que sus indicaciones son su responsabilidad profesional.
- **RD-04:** DAFI no es un expediente clínico ni emite recetas. El médico registra en su propio expediente, conforme a la NOM-004-SSA3-2012, lo que considere necesario.
- **RD-05:** Las preguntas de contexto y los textos de los avisos de RF-13 y RF-20 los revisa un médico antes de la primera versión. La revisión queda registrada con nombre y fecha. Quién será ese médico está pendiente de definir por el equipo.
- **RD-06:** El proveedor del modelo de lenguaje actúa como encargado del tratamiento. El aviso de privacidad lo declara, y el contrato o los términos del servicio deben garantizar que los datos no se usan para entrenar sus modelos ni se conservan más allá de lo necesario para responder.
- **RD-07:** La versión 1 usa el catálogo de etiquetas de 3.0. Etiquetas nuevas se agregan sobre el mismo catálogo (RNF-11).

### 3.4 Parámetros configurables

| Parámetro | Valor inicial | Usado en |
|---|---|---|
| `MAX_FOTOS` | 6 | RF-11 |
| `MB_MAX_ORIGINAL` | 10 MB | RF-11 |
| `LADO_MAX_PX` | 1024 px | RF-11, RNF-02 |
| `UMBRAL_NITIDEZ` | 100 (varianza del laplaciano) | RF-11 |
| `UMBRAL_BRILLO_MIN` | 50 (de 0 a 255) | RF-11 |
| `TIMEOUT_RESUMEN_S` | 20 s | RF-23, RNF-01 |
| `HORAS_SIN_RESPUESTA` | 4 h | RF-20 |
| `MINUTOS_SIN_RESPUESTA_PRIORIDAD` | 30 | RF-20 |
| `HORAS_IDEMPOTENCIA` | 24 | 3.0 |
| `DIAS_CIERRE_AUTOMATICO` | 14 | RF-15 |
| `DIAS_INVITACION` | 7 | RF-05, RF-06, RF-07 |
| `MAX_INTENTOS_LOGIN` | 5 | RF-02 |
| `MINUTOS_BLOQUEO` | 15 | RF-02 |
| `MINUTOS_ENLACE_RESTABLECER` | 30 | RF-03 |
| `MINUTOS_SESION` | 30 | RNF-05 |
| `DIAS_RETENCION_RESPALDO` | 7 | RNF-07 |

### 3.5 Matriz de trazabilidad

La matriz traza cada requerimiento hacia atrás, a la elicitación de donde salió; los identificadores `RF-XX-AC-Y` permiten trazarlo hacia adelante, a la API y a las pruebas, que son los dos usos de la trazabilidad que describe el SWEBOK (IEEE Computer Society, 2024, pp. 1-18–1-19).

«E» es la entrevista con la cliente real de S02-A1 (`transcript_entrevista.md`, sesión B); «V» es la visión de producto acordada por el equipo en S03 (`vision_producto.md`); «D» es el SRS individual de Daniel Ruán (versión 1.2) e «I» el de Isaac González. Las aportaciones de cada SRS individual están en `diferencias_SRS.md`.

| Requerimiento | Origen |
|---|---|
| RF-01 a RF-04, RD-02 | E: P1, P2 (los pacientes son sus hijos) |
| RF-05 | V: perfiles de seres queridos adultos; RD-02 |
| RF-06 | E: P2, P3 (el padre también manda fotos) |
| RF-07, RF-08, RD-03 | E: P2 (su médica de confianza); V: varios médicos sin verificación |
| RF-09, RF-10, RF-12 | E: P1 (preguntas de contexto), P4 («corroborar que he dado toda la información»); V: etiquetas |
| RF-11 | E: P3 (varias fotos, ubicación visible) |
| RF-13, RD-01 | E: P4 (no exagerar la urgencia); V: intermediario, no experto |
| RF-14, RF-15, RF-16 | E: P1 (la doctora pide más fotos y pregunta), P2 (canal fuera de WhatsApp) |
| RF-17, RNF-09, RNF-12, RD-06 | V: resumen del historial para el médico |
| RF-18 | E: P2 (seguir la evolución) |
| RF-20 | E: P4, P6 (espera de minutos) |
| RF-21, RNF-06 a RNF-08 | E: P5 (solo su doctora ve las fotos; ella elige qué borrar) |
| RF-22 | Derivado de RD-03 |
| RF-23 | Riesgo de conectividad y de dependencia de un servicio externo |
| RNF-03, RNF-04 | E: P6 (solo celular), P4 (desinstalaría la app si no le sirve) |
| RNF-11, RD-07 | Decisión de alcance (etiquetas por catálogo) |
| RF-01-AC-5, RF-02-AC-5, RF-03-AC-4, RF-11-AC-7, RF-18-AC-4, RF-21-AC-5 | D: RF-03, RF-17, RF-19, RF-06, RF-11, RF-13 |
| RNF-05 (TLS, cifrado en reposo, revocación de sesiones), RNF-13, RNF-14, contrato de errores con correlación | D: RNF-04, RNF-05, RNF-08, RNF-10 a RNF-13 |
| Versión del modelo registrada en cada resumen (RF-17) | D: RF-16 (gestión de versiones del modelo) |
| RF-01-AC-6, RF-03-AC-5, RF-03-AC-6, RF-21-AC-6, RF-22-AC-4, RNF-09 (evaluación por grupo) | I: RF-01, RF-13, RF-14, RF-15, RNF-07 |

---

## Referencias

IEEE Computer Society. (2024). *Guide to the software engineering body of knowledge (SWEBOK Guide)* (Versión 4.0a; H. Washizaki, Ed.). IEEE Computer Society.
