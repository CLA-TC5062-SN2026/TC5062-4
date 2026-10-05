# Sprint Planning del Sprint 1: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A2, Parte 1
**Sprint 1:** del lunes 5 al domingo 18 de octubre de 2026 (2 semanas)
**Fuentes:** `S03_A1/backlog_completo.md` (18 historias, 97 SP) y `S03_A1/SRS_equipo.md`

Le dimos a una sesión de agente el backlog, el SRS y el contexto del equipo, y le pedimos que facilitara el Sprint Planning: capacidad, Sprint Goal, selección de historias y trabajo técnico de arranque. Su propuesta completa está en `evidencia/propuesta_agente_planning.md`. Este documento registra lo que acordamos después de revisarla.

---

## 1. Roles en este sprint

| Rol de Scrum | Quién | Qué hizo o hará en este sprint |
|---|---|---|
| **Product Owner** | Francisco Martínez | Propuso el objetivo de negocio del sprint (que una familia pueda entrar y registrar a sus hijos), aceptó dividir HU-01, agregó la pantalla «Qué es DAFI» a HU-01a, redacta la versión 0 del aviso de privacidad y acepta cada historia contra sus criterios. Es responsable del orden del Product Backlog y actualiza HU-01b para el Sprint 2. |
| **Scrum Master** (rota cada sprint) | Daniel Ruán | Facilita los eventos y cuida sus tiempos, lleva el tablero y los impedimentos, revisa la DoD de incremento antes de la Sprint Review y modera si hay desacuerdo sobre si algo está terminado. En el Sprint 2 el rol pasa a Isaac González. |
| **Developers** | Armando Arredondo, Isaac González, Daniel Ruán y Francisco Martínez | Estimaron, eligieron cuánto trabajo cabe y se descompusieron el Sprint Backlog en tareas (`tareas_tecnicas.md`). Son dueños del plan y de cumplir la Definition of Done. |

Francisco y Daniel cumplen dos roles cada uno. Sus horas de PO y de SM se reservan aparte (sección 2) y sus decisiones se registran según el rol desde el que las tomaron: el PO decide qué se construye y en qué orden, y los Developers deciden cómo se construye y cuánto cabe. La Guía de Scrum le da al equipo completo la definición del Sprint Goal (Sutherland y Schwaber, 2020), y el SWEBOK resume la división así: el Product Owner decide qué entra al Product Backlog y el Scrum Master gestiona las actividades dentro del sprint (IEEE Computer Society, 2024, p. 11-10); aquí el PO trajo el objetivo de negocio y los Developers lo ajustaron a lo que podían terminar.

---

## 2. Capacidad del equipo

El SWEBOK advierte que estimar esfuerzo en software es propenso a error porque depende de la experiencia de las personas, de su interacción y del entorno, y recomienda usar más de un enfoque y conciliarlos, con estimaciones de abajo hacia arriba hechas por quienes harán el trabajo (IEEE Computer Society, 2024, pp. 9-8–9-9). Por eso la capacidad se calcula aquí de arriba hacia abajo (horas disponibles) y se contrasta en `tareas_tecnicas.md` con la suma de abajo hacia arriba de las tareas (29.25 horas planeadas contra unas 29 disponibles).

| Concepto | Cálculo | Horas |
|---|---|---|
| Horas brutas | 4 personas × 8.5 h/semana × 2 semanas | **68** |
| Eventos de Scrum | 5.5 h por persona × 4 (ver tabla siguiente) | −22 |
| Trabajo de Product Owner | Francisco: aviso de privacidad v0, aceptación de historias, refinamiento de HU-01b | −3 |
| Trabajo de Scrum Master | Daniel: preparar eventos, tablero, impedimentos | −1.5 |
| Horas para desarrollo | | **41.5** |
| Factor de enfoque | 0.70: primer sprint, stack sin integrar, coordinación asíncrona | **≈ 29** |
| Arranque técnico (HAB-01) | Sección 5 | −11 |
| **Horas para historias del backlog** | | **≈ 18** |

| Evento (por persona) | Supuesto | Horas |
|---|---|---|
| Sprint Planning | Una sesión en línea | 2 |
| Daily Scrum | Reporte escrito en el canal del equipo los días en que se trabajó (qué avancé, qué sigue, qué me bloquea) y dos llamadas de 15 minutos por semana | 1.5 |
| Sprint Review | Demostración con el PO | 1 |
| Sprint Retrospective | Incluye calcular la velocidad real | 1 |
| **Total** | | **5.5** |

**Equivalencia horas a story points.** Sin velocidad histórica, partimos de la historia de referencia del backlog: HU-15 (3 SP) le tomaría a un integrante unas 6 horas productivas cumpliendo la Definition of Done, es decir, 2 horas por SP. Con 18 horas, la capacidad para historias es de 9 SP. Es la parte más frágil del cálculo, porque con 2.5 h/SP bajaría a 7 SP. En la Retrospective registramos las horas reales y desde el Sprint 2 usamos la velocidad medida, que es la base de la planeación de sprint que describe el SWEBOK: solo entra al sprint el trabajo que razonablemente se puede terminar en él (IEEE Computer Society, 2024, p. 1-17).

---

## 3. Sprint Goal

> **Al cierre del Sprint 1, una madre puede, desde el navegador de su celular y en la URL pública de DAFI, conocer qué es y qué no es DAFI, crear su cuenta familiar dando los consentimientos de RD-02, iniciar y cerrar sesión, y registrar a sus hijos con sus alergias y medicamentos.**

Es el primer paso del flujo mínimo: sin cuenta y sin perfiles no hay a quién asociar una conversación, y el consentimiento que exige la LFPDPPP queda resuelto desde el primer día. También obliga a construir una rebanada vertical completa (Next.js, Express, MongoDB, autorización por rol, contrato de errores y despliegue), que es el mayor riesgo técnico de un equipo que todavía no tiene código.

**Cómo verificamos en la Sprint Review que se cumplió:**

1. Una persona que no programó la funcionalidad (el PO u otra persona ajena al equipo) abre la URL pública en un celular y, sin ayuda, lee «Qué es DAFI», se registra marcando las tres declaraciones, crea dos perfiles de hijos (uno con una alergia), cierra sesión, vuelve a entrar y encuentra los dos perfiles con la edad calculada.
2. En GitHub Actions pasan las pruebas automatizadas con estos 12 identificadores: `RF-01-AC-1`, `RF-01-AC-2`, `RF-01-AC-3`, `RF-01-AC-6`, `RF-02-AC-1`, `RF-02-AC-2`, `RF-02-AC-4`, `RF-02-AC-5`, `RF-04-AC-1`, `RF-04-AC-2`, `RF-04-AC-3` y `RF-04-AC-5`.
3. En la base de datos, la cuenta creada tiene la fecha y la versión del aviso aceptado, y la contraseña está guardada con bcrypt o Argon2id.

---

## 4. Historias seleccionadas

Seguimos el orden del Product Backlog: en un ciclo ágil, solo los requerimientos de mayor prioridad entran a un sprint (IEEE Computer Society, 2024, pp. 1-16–1-17), y el ajuste de alcance se hace quitando los de menor prioridad cuando no caben en la capacidad (p. 1-17).

| Orden | ID | Historia | SP | Prioridad | Compromiso |
|---|---|---|---|---|---|
| 0 | **HAB-01** | Arranque técnico (habilitador, sin SP) | 11 h | — | Necesario para el goal |
| 1 | **HU-01a** | Registro con consentimiento, «Qué es DAFI», inicio y cierre de sesión | 5 | Alta | Comprometida |
| 2 | **HU-02** | Perfiles de los hijos y del propio cuidador | 3 | Alta | Comprometida |
| | | **Total comprometido** | **8 de 9 SP** | | |
| — | HU-01b (solo RF-02-AC-3) | Bloqueo por intentos fallidos | — | Alta | Solo si sobra capacidad |

**HU-01a.** Es la primera del orden del backlog, no depende de ninguna otra y todo lo demás depende de ella. HU-01 completa (8 SP) más HU-02 no cabían en 9 SP, y HU-01 sola dejaba un sprint sin nada que la familia pudiera hacer después de entrar. Por eso la dividimos (sección 4.1).

**HU-02.** Es la segunda del orden y solo depende de HU-01a. Le da contenido al goal y es la primera historia que usa la matriz de roles del SRS (`SIN_PERMISOS` para el cocuidador), así que deja probado el mecanismo de autorización que reutilizan casi todas las demás. El cocuidador no se puede crear hasta HU-04; la prueba de RF-04-AC-3 usa un cocuidador cargado como dato de prueba. RF-04-AC-4 (alergias visibles para el médico en el resumen) se queda para HU-13.

### 4.1 División de HU-01

| Nueva historia | Criterios | SP | Sprint |
|---|---|---|---|
| **HU-01a** | RF-01-AC-1 a AC-3, RF-01-AC-6, RF-02-AC-1, AC-2, AC-4 y AC-5; hash de contraseñas y expiración de sesión (RNF-05) | 5 | 1 |
| **HU-01b** | RF-01-AC-4 (verificación de correo), RF-01-AC-5 (nueva versión del aviso), RF-02-AC-3 (bloqueo), RF-03-AC-1 a AC-6 (recuperación y gestión de la cuenta) | 5 | 2 |

Las dos partes suman 10 SP en lugar de 8: al separarlas apareció trabajo que la estimación original absorbía, sobre todo la integración con el proveedor de correo, que ahora queda completa en HU-01b. Dejar la verificación de correo para el Sprint 2 no rompe nada: según RF-01-AC-4, una cuenta sin verificar sí puede crear perfiles, y lo único que bloquea (enviar conversaciones e invitaciones) todavía no existe. Nadie ajeno al equipo usa DAFI con datos reales hasta que HU-01b esté terminada.

### 4.2 Historias que quedan fuera

| ID | Motivo |
|---|---|
| HU-01b | Parte de HU-01 que no cabe; es la primera del Sprint 2. |
| HU-05 (8 SP) | Tercera del orden, pero sola iguala la capacidad y necesita correos de invitación, que llegan con HU-01b. |
| HU-06, HU-09 a HU-13, HU-16, HU-07 | Todas necesitan que existan conversaciones (HU-06), que a su vez necesita un médico en el círculo (HU-05). |
| HU-14 | Bloqueada hasta que se elija el proveedor del modelo de lenguaje en S04 y pase la prueba técnica acordada en S03-A1. |
| HU-15, HU-17 | Consultan o borran datos que todavía no existen. |
| HU-03, HU-04 | Necesitan envío de correos (HU-01b). |
| HU-18, HU-08 | Prioridad Media y Baja; dependen de historias posteriores. |

---

## 5. Trabajo técnico de arranque (HAB-01)

Ninguna historia del backlog incluye la configuración del proyecto, pero sin ella no se puede cumplir la Definition of Done. No es un incremento de valor por sí mismo, así que no le damos story points: entra al Sprint Backlog como parte del plan, se estima en horas y se resta de la capacidad. En GitHub es el issue «HAB-01» con la etiqueta `tipo:habilitador`.

| Parte | Qué incluye | Horas |
|---|---|---|
| Repositorio | Carpetas `web/` y `api/`, `main` protegida, plantilla de pull request con la DoD | 1 |
| Integración continua | GitHub Actions con lint y pruebas en cada pull request; Jest con Supertest y MongoDB en memoria | 2 |
| Esqueleto del cliente | Next.js con diseño base para 360 px y cliente HTTP con identificador de correlación | 1.5 |
| Esqueleto de la API | Parámetros por variables de entorno, reloj inyectable, middleware de errores y de autorización, logs sin datos sensibles | 3 |
| Base de datos | MongoDB Atlas gratuito, Mongoose, datos de prueba sintéticos | 1.5 |
| Despliegue | Cliente y API con HTTPS en servicios gratuitos (por ejemplo, Vercel y Render), despliegue al fusionar en `main`, endpoint de salud | 2 |

La meta intermedia es un «esqueleto andante» al final del tercer día: una pantalla de Next.js desplegada que llama al endpoint de salud de la API desplegada, con GitHub Actions en verde. Si no está listo ese día, el Scrum Master lo levanta como impedimento, porque pone en riesgo el goal completo.

---

## 6. Plan del sprint

| Días | Trabajo |
|---|---|
| 1 a 3 | HAB-01 en dos parejas (cliente y despliegue; API y base de datos). El PO redacta el aviso de privacidad v0 y las tres declaraciones. |
| 3 a 7 | HU-01a: API de registro y sesión, pantallas de «Qué es DAFI», registro e inicio de sesión. |
| 5 a 9 | HU-02: modelo de perfil, validaciones, pantallas de lista y alta. |
| 9 y 10 | Verificación contra la DoD en celular, aceptación del PO, Sprint Review y Retrospective. |

El detalle por tarea, con responsable, horas y criterio de terminado, está en `tareas_tecnicas.md`.

---

## 7. Evaluación de la propuesta del agente

La propuesta fue realista y estuvo enfocada en valor: eligió la primera rebanada vertical del flujo mínimo en lugar de repartir trabajo entre varias historias a medias, y sacó el arranque técnico del cálculo de story points en lugar de esconderlo dentro de una historia. Adoptamos su Sprint Goal, su división de HU-01 y su plan. Estos son los cambios que hicimos:

| # | Propuesta del agente | Ajuste | Por qué |
|---|---|---|---|
| P-01 | Daily Scrum síncrono de 15 minutos todos los días hábiles (2 h por persona) | Reporte escrito diario y dos llamadas de 15 minutos por semana (1.5 h) | Con 8 a 9 horas por semana repartidas en horarios distintos, una llamada diaria se volvería un trámite que nadie sostiene; el reporte escrito cumple el propósito del Daily (revisar el avance hacia el goal y detectar impedimentos) sin coincidir en horario. Con el ajuste la capacidad sube de 8 a 9 SP. |
| P-02 | RF-01-AC-6 («Qué es DAFI») sin historia asignada | El PO la agrega a HU-01a sin cambiar su estimación | Es la página donde empieza el registro y explica lo que DAFI no hace (RD-01) antes de pedir datos de salud. Es estática y cabe en el SP de holgura. |
| P-03 | RF-01-AC-5 y RF-03-AC-6 sin historia asignada | El PO los agrega a HU-01b | Son parte de la gestión de la cuenta y del aviso, y no hacen falta para el goal del Sprint 1. |
| P-04 | Trabajo de arranque registrado solo con una etiqueta en el tablero | Un issue HAB-01 con sus tareas como sub-issues | Así el tablero muestra todo el Sprint Backlog, no solo las historias, y el SM puede seguir el avance del esqueleto andante. |
| P-05 | Si sobra capacidad, tomar HU-01b completa empezando por el bloqueo | Solo el bloqueo por intentos (RF-02-AC-3) | Con 1 SP de holgura no cabe más; el resto de HU-01b depende del proveedor de correo. |

## 8. Riesgos

Esta tabla funciona como registro de riesgos del sprint; el SWEBOK pide identificarlos, priorizarlos, definir su mitigación y revisarlos periódicamente, no solo al inicio (IEEE Computer Society, 2024, p. 9-9). El Scrum Master la revisa en cada Daily.

| Riesgo | Qué hacemos |
|---|---|
| La equivalencia de 2 h/SP no tiene datos detrás | HU-01a va primero porque sola cumple buena parte del goal; registramos horas reales para la Retrospective. |
| El arranque toma más de 11 horas (despliegue, cookies, CORS) | Punto de control del esqueleto andante al día 3; si falla, el PO y los Developers renegocian el alcance de HU-02 sin cambiar el goal. |
| Una persona pierde una semana por trabajo u otras materias (1/8 de la capacidad) | Pull requests pequeños, una sola historia en curso por pareja y Daily escrito. |
| El aviso de privacidad no tiene texto final | El PO entrega la versión 0 el día 3; lo que se guarda es la versión y el texto se puede actualizar con RF-01-AC-5 en el Sprint 2. |
| Francisco es PO y Developer | Sus horas de PO están reservadas y las dudas sobre criterios se resuelven en el canal del equipo en menos de 24 horas. |
| Cookies de sesión bloqueadas en Safari para iOS si cliente y API quedan en dominios distintos | Next.js reenvía `/api` a Express para que todo salga del mismo dominio; se decide el día 1. |

---

## Referencias

IEEE Computer Society. (2024). *Guide to the software engineering body of knowledge (SWEBOK Guide)* (Versión 4.0a; H. Washizaki, Ed.). IEEE Computer Society.

Sutherland, J., & Schwaber, K. (2020). *The Scrum guide*. Scrum.org.
