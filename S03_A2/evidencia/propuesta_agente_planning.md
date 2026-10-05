# Sprint Planning, Sprint 1: DAFI

**Equipo 4:** Armando Arredondo Valle, Isaac González Trejo, Francisco Martínez Álvarez y Daniel Ruán Aguilar
**Product Owner:** Francisco Martínez · **Scrum Master (Sprint 1):** Daniel Ruán · **Developers:** los cuatro
**Duración del sprint:** 2 semanas
**Fuentes:** `backlog_completo.md` (97 SP, 18 historias) y `SRS_equipo.md` 3.0

La Guía de Scrum 2020 organiza el Sprint Planning en tres preguntas: por qué es valioso este sprint (Sprint Goal), qué se puede terminar (selección) y cómo se hará (plan). La guía no prescribe story points ni cálculo de capacidad; los usamos como práctica complementaria para que el pronóstico tenga un sustento, sabiendo que en el Sprint 1 es una estimación sin datos históricos. El compromiso del equipo es con el Sprint Goal; la lista de historias es un pronóstico.

---

## 1. Capacidad del equipo

### 1.1 Horas disponibles

| Concepto | Cálculo | Horas |
|---|---|---|
| Horas brutas | 4 personas × 8.5 h/semana × 2 semanas | **68** |
| Eventos de Scrum | 6 h por persona × 4 (ver 1.2) | −24 |
| Trabajo adicional del Product Owner | Francisco: refinamiento para el Sprint 2, aceptar historias, texto del aviso de privacidad, buscar al médico de RD-05 | −3 |
| Trabajo adicional del Scrum Master | Daniel: preparar eventos, tablero, seguimiento de impedimentos | −1.5 |
| Horas para desarrollo | | **39.5** |
| Factor de enfoque | 0.70 (ver 1.3) | × 0.70 |
| Horas productivas | | **≈ 27** |
| Configuración inicial (arranque técnico, sección 4) | | −11 |
| Horas productivas para historias del backlog | | **≈ 16** |

El rango real es de 64 a 72 horas brutas (8 o 9 horas por persona). Tomamos el punto medio.

### 1.2 Eventos de Scrum (por persona)

| Evento | Supuesto | Horas |
|---|---|---|
| Sprint Planning | Una sesión; la guía da hasta 8 h para un sprint de un mes, y la escalamos a un equipo de medio tiempo | 2 |
| Daily Scrum | 8 sesiones de 15 min (en días hábiles; si un día nadie trabajó en el proyecto, se reporta por escrito en el canal del equipo) | 2 |
| Sprint Review | Demostración del incremento y actualización del backlog | 1 |
| Sprint Retrospective | Incluye recalibrar la equivalencia horas↔SP con lo que realmente pasó | 1 |
| **Total** | | **6** |

El refinamiento del backlog para el Sprint 2 no es un evento; lo absorbe el factor de enfoque para los Developers y la línea del Product Owner para Francisco.

### 1.3 Factor de enfoque

Usamos 0.70 porque es el primer sprint: el equipo aprende a trabajar junto con un stack que no ha integrado antes, la coordinación es casi toda asíncrona (cada quien trabaja en horarios distintos después de su empleo), hay revisiones de código cruzadas y es probable que alguna semana se pierdan horas por carga laboral o de otras materias. Como los eventos ya se restaron por separado, el factor no los vuelve a contar.

### 1.4 Equivalencia horas↔story points

Sin velocidad histórica, la equivalencia sale de la historia de referencia del backlog, **HU-15 = 3 SP** (una consulta con filtros sobre datos existentes y una pantalla). Estimamos que un integrante del equipo la termina en unas 6 horas productivas, contando lo que exige la Definition of Done: una prueba automatizada por criterio de aceptación, pantalla funcional en 360 px, uso con teclado y despliegue. Eso da **2 horas productivas por SP**.

| Concepto | Horas | SP |
|---|---|---|
| Capacidad productiva total | 27 | **≈ 13** |
| Configuración inicial (no está en el backlog) | 11 | ≈ 5 |
| **Capacidad para historias del backlog** | **16** | **8** |

La equivalencia es la parte más frágil del cálculo. Con 2.5 h/SP la capacidad para historias baja a 6 SP; con 1.5 h/SP sube a 10 SP. Por eso el plan pone primero lo indispensable para el goal y deja claro qué se toma si sobra tiempo (sección 3.4). En la retrospectiva se registran las horas reales y se calcula la velocidad del Sprint 1, que sustituye a esta equivalencia desde el Sprint 2.

---

## 2. Sprint Goal

> **Una madre puede, desde el navegador de su celular y en el ambiente desplegado del curso, crear su cuenta familiar dando los consentimientos de RD-02, iniciar y cerrar sesión, y registrar a sus hijos con sus alergias y medicamentos.**

El valor está en que queda resuelto el primer paso del flujo mínimo (sin cuenta ni perfiles no hay a quién asociar una conversación) y en que el consentimiento que exige la LFPDPPP se recoge desde el primer día. Además obliga a construir una rebanada vertical completa (pantalla en Next.js, API en Express, MongoDB, autorización por rol, contrato de errores y despliegue), que es lo que más riesgo tiene en un equipo que todavía no tiene código.

**Cómo se verifica en la Sprint Review:**

- Una persona que no programó la funcionalidad (el Product Owner o alguien ajeno al equipo) abre la URL pública del ambiente del curso en un celular y, sin ayuda, se registra marcando las tres declaraciones, crea dos perfiles de hijos (uno con una alergia), cierra sesión, vuelve a entrar y encuentra los dos perfiles con la edad calculada.
- En el pipeline de integración continua pasan las pruebas automatizadas con estos identificadores: `RF-01-AC-1`, `RF-01-AC-2`, `RF-01-AC-3`, `RF-02-AC-1`, `RF-02-AC-2`, `RF-02-AC-4`, `RF-02-AC-5`, `RF-04-AC-1`, `RF-04-AC-2`, `RF-04-AC-3` y `RF-04-AC-5` (11 pruebas).
- En la base de datos, la cuenta creada tiene guardadas la fecha y la versión del aviso de privacidad aceptado, y la contraseña está con bcrypt o Argon2id.

Si las tres condiciones se cumplen, el goal se cumplió.

---

## 3. Selección de historias

### 3.1 Historias seleccionadas

| Orden | ID | Historia | SP | Prioridad | Estado |
|---|---|---|---|---|---|
| 1 | **HU-01a** | Registro con consentimiento, inicio y cierre de sesión (parte de HU-01) | 5 | Alta | Comprometida para el goal |
| 2 | **HU-02** | Perfiles de los hijos y del propio cuidador | 3 | Alta | Comprometida para el goal |
| | | **Total** | **8** | | |

**HU-01a (parte de HU-01).** Es la primera del orden del backlog, de prioridad Alta, y no depende de ninguna otra. Todo lo demás depende de ella: sin cuenta no hay familia, y el registro es donde se recoge el consentimiento de RD-02. HU-01 completa (8 SP) no cabe junto con HU-02 en 8 SP, y sola dejaría un sprint sin nada que la familia pueda hacer después de entrar. Por eso se divide (ver 3.2).

**HU-02.** Es la segunda del orden, de prioridad Alta, y solo depende de HU-01a. Le da contenido al goal: después de entrar, la familia ya registra a las personas que cuida, y cada conversación futura (HU-06) se asocia a uno de estos perfiles. También es la primera historia que usa la matriz de roles de la sección 3.0 del SRS (`SIN_PERMISOS` para el cocuidador), así que deja probado el mecanismo de autorización que reutilizan casi todas las demás.

Un detalle de HU-02: el criterio RF-04-AC-3 habla del cocuidador, pero ese rol no se puede crear hasta HU-04. La prueba usa un usuario cocuidador cargado como dato de prueba (fixture); la historia queda terminada sin esperar a HU-04.

### 3.2 División de HU-01

HU-01 junta tres flujos (registro, sesión con bloqueo y restablecimiento) y depende de un proveedor de correo para la verificación y el restablecimiento. Se divide por flujo, de modo que cada parte entregue algo usable:

| Nueva historia | Criterios que cubre | SP (re-estimado) | Sprint |
|---|---|---|---|
| **HU-01a: Registro con consentimiento, inicio y cierre de sesión** | RF-01-AC-1, RF-01-AC-2, RF-01-AC-3, RF-02-AC-1, RF-02-AC-2, RF-02-AC-4, RF-02-AC-5; contraseñas con bcrypt o Argon2id y expiración de sesión por `MINUTOS_SESION` (RNF-05) | 5 | 1 |
| **HU-01b: Verificación de correo, bloqueo por intentos y recuperación de acceso** | RF-01-AC-4, RF-02-AC-3, RF-03-AC-1 a RF-03-AC-5 | 5 | 2 |

Las dos partes suman 10 SP en lugar de 8. Es normal que al dividir aparezca trabajo que la estimación original absorbía (sobre todo la integración con el proveedor de correo, que ahora queda entera en HU-01b). Los Developers confirman la re-estimación en la sesión; el Product Owner actualiza el backlog.

Dejar la verificación de correo para el Sprint 2 no rompe nada en el Sprint 1: según RF-01-AC-4, una cuenta sin verificar sí puede crear perfiles y borradores, y lo único que bloquea (enviar conversaciones e invitaciones) todavía no existe. HU-01b debe quedar terminada antes de que cualquier persona ajena al equipo use DAFI con datos reales.

Quedan sin asignar RF-01-AC-5 (nueva versión del aviso de privacidad), RF-01-AC-6 (pantalla «Qué es DAFI») y RF-03-AC-6 (nombre del médico), que están en el SRS pero no en los criterios de HU-01 del backlog. El Product Owner decide en el refinamiento si se agregan a HU-01b o forman una historia aparte.

### 3.3 Historias que quedan fuera

| ID | SP | Prioridad | Motivo |
|---|---|---|---|
| HU-01b | 5 | Alta | Parte de HU-01 que no cabe; es la primera del Sprint 2 y la siguiente si sobra capacidad. |
| HU-05 | 8 | Alta | Tercera del orden, pero no cabe (8 SP solos igualan la capacidad) y necesita el envío de correos de invitación, que llega con HU-01b. |
| HU-06 | 8 | Alta | Necesita perfiles (HU-02) y un médico en el círculo (HU-05). Su liberación además espera la revisión médica de RD-05. |
| HU-09, HU-12, HU-10, HU-11 | 5 c/u | Alta | Todas suponen que ya existe una conversación (HU-06). |
| HU-16 | 5 | Alta | Notifica eventos de conversaciones que aún no existen y requiere el proveedor de correo. |
| HU-07 | 8 | Alta | Las fotos se agregan a una conversación (HU-06); además conviene probar la conversión HEIC en un sprint con más margen. |
| HU-13 | 3 | Alta | Muestra datos del perfil dentro de una conversación; sin HU-06 no hay dónde mostrarlo. |
| HU-14 | 8 | Alta | Bloqueada: el proveedor del modelo de lenguaje se decide en S04 y antes hace falta la prueba técnica de verificación de citas. |
| HU-15 | 3 | Media | Consulta conversaciones que todavía no existen. |
| HU-04 | 5 | Media | Reutiliza el registro de HU-01 y necesita invitación por correo (HU-01b). |
| HU-03 | 5 | Media | Flujo de consentimiento por correo y borrado en cascada (HU-17). |
| HU-17 | 5 | Media | Borra datos que aún no existen en su mayoría (fotos, conversaciones); debe estar lista antes de usuarios reales, no en este sprint. |
| HU-18 | 3 | Media | Primera en salir si el calendario aprieta, según el propio backlog. |
| HU-08 | 5 | Baja | Prioridad baja y depende de HU-07. |

### 3.4 Si sobra capacidad

Si HU-01a y HU-02 quedan terminadas (con la Definition of Done completa) antes del final, el equipo toma **HU-01b** empezando por el bloqueo por intentos (RF-02-AC-3), que no necesita proveedor de correo para la parte de la API. No se toma HU-05 a medias: es mejor llegar a la Review con dos historias terminadas que con tres en curso.

---

## 4. Trabajo técnico de arranque

Ninguna historia del backlog incluye la configuración del proyecto, pero sin ella no se puede cumplir la Definition of Done (pruebas automatizadas, TLS, despliegue en el ambiente del curso). No es un incremento de valor por sí mismo, así que no lo convertimos en historias con story points para el Product Owner; entra al **Sprint Backlog como parte del plan** para alcanzar el goal (la guía 2020 define el Sprint Backlog como el goal, los elementos seleccionados y el plan para entregarlos). Se estima en horas y se resta de la capacidad, como se hizo en 1.1, y se registra en el tablero con la etiqueta `tipo:habilitador` para que sea visible.

| Tarea | Qué incluye | Horas |
|---|---|---|
| Repositorio y tablero | Repositorio en GitHub con carpetas `web/` y `api/`, rama `main` protegida, plantilla de pull request, labels del backlog, tablero en GitHub Projects con las historias del sprint | 1 |
| Integración continua | GitHub Actions con lint y pruebas en cada pull request; Jest o Vitest con Supertest y MongoDB en memoria; convención de nombres `RF-XX-AC-Y` en las pruebas | 2 |
| Esqueleto del cliente (Next.js) | Proyecto con diseño base para 360 px, cliente HTTP que envía el identificador de correlación y muestra los textos del contrato de errores | 1.5 |
| Esqueleto de la API (Express) | Parámetros de la tabla 3.4 por variables de entorno, reloj inyectable, middleware de errores con el contrato de la sección 3.0 e identificador de correlación, logs sin datos sensibles (RNF-13), middleware de autorización con la matriz de roles | 3 |
| Base de datos | MongoDB Atlas (nivel gratuito), Mongoose, usuarios separados por ambiente, datos de prueba sintéticos | 1.5 |
| Despliegue | Cliente en Vercel y API en Render (o equivalentes gratuitos) con HTTPS, variables de entorno, despliegue automático al fusionar a `main` y un endpoint de salud | 2 |
| **Total** | | **11** |

**Cómo se trata dentro del sprint.** Se hace primero y en paralelo, repartido entre dos parejas (una en cliente y despliegue, otra en API y base de datos; los Developers deciden quién va en cada una). La meta intermedia es un «esqueleto andante» al final del tercer día del sprint: una pantalla de Next.js desplegada que llama al endpoint de salud de la API desplegada, con la integración continua en verde. A partir de ahí se empieza HU-01a sobre esa base y HU-02 en cuanto existe el modelo de familia. Si el esqueleto no está listo al tercer día, el Scrum Master lo levanta como impedimento en el Daily Scrum, porque pone en riesgo el goal completo.

Una decisión técnica que conviene tomar el primer día: cómo se maneja la sesión. Si el cliente y la API quedan en dominios distintos, las cookies de sesión pueden fallar en Safari para iOS (bloquea cookies de terceros). Lo más simple es que Next.js reenvíe las llamadas a la API (rewrites) para que todo salga del mismo dominio.

---

## 5. Plan general del sprint

| Momento | Trabajo |
|---|---|
| Días 1 a 3 | Arranque técnico (sección 4) en dos parejas; Francisco redacta la versión 0 del aviso de privacidad y las tres declaraciones |
| Días 3 a 7 | HU-01a (API de registro, sesión y cierre; pantallas de registro e inicio de sesión) |
| Días 5 a 9 | HU-02 (modelo de perfil, validaciones, pantalla de lista y alta) |
| Días 9 y 10 | Revisión contra la Definition of Done en el celular, ensayo de la demostración, Sprint Review y Retrospective |

---

## 6. Riesgos principales

| Riesgo | Efecto | Qué hacemos |
|---|---|---|
| La equivalencia de 2 h/SP está calculada sin datos | El pronóstico de 8 SP puede estar inflado | HU-01a va primero porque sola ya cumple buena parte del goal; se registran horas reales para recalibrar en la Retrospective |
| El arranque técnico toma más de 11 horas (despliegue, CORS, cookies, variables de entorno) | Se come las horas de HU-02 | Esqueleto andante al día 3 como punto de control; si no está, el Product Owner y el equipo renegocian el alcance de HU-02 sin cambiar el goal |
| Disponibilidad irregular: con 8 a 9 horas por semana, que una persona pierda una semana es perder 1/8 de la capacidad | Integración al último día y pull requests grandes | Pull requests pequeños, máximo una historia en curso por pareja, Daily Scrum escrito los días sin reunión |
| La Definition of Done pide cumplir RNF-10 (99 % mensual), que no se puede medir en dos semanas, y la infraestructura gratuita suspende servicios por inactividad | Ninguna historia podría declararse terminada | Acordar en la Planning que para el Sprint 1 basta con estar desplegado, con endpoint de salud y un monitor de disponibilidad configurado; la medición mensual empieza desde ahí |
| El aviso de privacidad no tiene texto definitivo, y RF-01-AC-1 exige guardar su versión | HU-01a queda bloqueada si nadie lo escribe | El Product Owner entrega una versión 0 al día 3; lo que se guarda es la versión, y el texto se puede cambiar después con RF-01-AC-5 |
| Francisco es Product Owner y Developer a la vez | Dudas sin resolver mientras él programa, o su parte de desarrollo se retrasa | Sus horas de Product Owner ya están reservadas; las dudas sobre criterios se resuelven en el canal del equipo dentro de las 24 horas |
| División de HU-01 | La verificación de correo y la recuperación de acceso quedan para el Sprint 2 | Nadie ajeno al equipo usa DAFI hasta terminar HU-01b; en el Sprint 1 solo hay datos sintéticos |
| Primer manejo de datos personales (correos, contraseñas, nombres y alergias de menores) | Incumplir RD-02, RNF-05 o RNF-13 desde el inicio | Datos sintéticos únicamente; revisión explícita de logs y respuestas de error en la revisión de cada pull request |
