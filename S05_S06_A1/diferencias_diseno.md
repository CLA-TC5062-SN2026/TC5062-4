# Diferencias de diseño y resolución de conflictos: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S05-S06-A1, Parte 0

> **Estado:** se compararon los tres artefactos de Francisco, Isaac y Daniel. Armando no entregó artefactos de S04 para comparar.

Los artefactos individuales están en `evidencia/individuales/`. Para la especificación usamos un análisis automático (rutas, métodos, códigos de respuesta, schemas y cobertura de `x-acceptance-criteria` contra los 103 criterios del SRS) y después discutimos cada conflicto.

## 1. Especificación OpenAPI

### 1.1 Lo que aportó cada quien

| Integrante | Especificación | Operaciones | Criterios del SRS cubiertos | Aporte principal al consolidado |
|---|---|---|---|---|
| Francisco | `openapi_francisco.yaml` (S04-A2 1.1.0) | 63 | 100 de 103 + 6 declarados fuera de la API | Base del consolidado: transiciones de la conversación como recursos, códigos de error específicos (409, 412, 413, 415, 429), idempotencia, catálogos públicos y `GET /salud`. |
| Isaac | `openapi_isaac.yaml` (1.0.0) | 61 | 101 de 103; los 2 restantes, declarados fuera de la API en `x-non-http-acceptance-criteria` | Las rutas de autenticación que después fijó la actividad S05-S06-A2 (`/auth/register`, `/auth/login` con 200) y la confirmación `X-Delete-Confirmation: ELIMINAR` que la API vuelve a comprobar al borrar la cuenta familiar. |
| Daniel | `openapi_daniel.yaml` (1.0.0) | 47 | 95 de 103 | Identificadores UUID desde el diseño y el rechazo de una invitación médica sin tener cuenta. |
| Armando | No entregó especificación para comparar. | | | |

### 1.2 Consenso

Las tres especificaciones cubren, con el mismo propósito, registro e inicio y cierre de sesión, restablecimiento de contraseña, verificación de correo, aceptación del aviso de privacidad, CRUD de perfiles, consentimiento y revocación del adulto representado, invitación y salida del cocuidador, invitación, aceptación y salida de médicos, CRUD de conversaciones y su envío, fotos, resumen de contexto y marca de cita incorrecta, notificaciones, reportes, desactivación de cuentas por el administrador y la sección de privacidad. Las tres usan Bearer JWT, un esquema de error con código, mensaje e identificador de correlación, y declaran `x-acceptance-criteria`. Isaac y Francisco, por separado, llegaron a la misma forma de declarar los criterios que no dependen de una petición (`x-non-http-acceptance-criteria` y `x-criterios-fuera-de-api`).

### 1.3 Gaps

| Solo en | Operación o elemento | Decisión |
|---|---|---|
| Daniel | Rechazar la invitación médica desde el enlace, sin cuenta | **Se adopta** como `POST /invitaciones/rechazos` (Isaac también lo tenía: `POST /doctor-invitations/reject`). RF-07-AC-4 aplica a quien todavía no se registra. |
| Isaac | `X-Delete-Confirmation: ELIMINAR` al borrar la cuenta familiar | **Se adopta** en `DELETE /familias/{familiaId}`. RF-21-AC-4 pide escribir «ELIMINAR»; si solo lo comprueba el cliente, una petición directa a la API borra la familia sin esa confirmación. |
| Isaac | Paginación por cursor (`cursor`, `limit`) en la bandeja | **No se adopta**: el orden de la bandeja lo fija el SRS (RF-16) y con los volúmenes del curso la paginación por página es suficiente (ver arquitectura_equipo.md). |
| Daniel | `DELETE /users/me` para borrar la cuenta propia | **No se adopta**: RF-21 borra la cuenta *familiar*, ya cubierta por `DELETE /familias/{familiaId}`. |
| Francisco | Avisos y etiquetas públicos | **Se conserva.** Isaac los tiene con otro nombre (`/public/info`, `/catalog/tags`, `/catalog/emergency-notice`); en la de Daniel faltan, y con ellos RF-01-AC-6 y RF-13. |
| Francisco | Historial por perfil, permisos de historial, accesos (RNF-08), `GET /salud` | **Se conserva.** Isaac cubre casi todo lo anterior con otras rutas; `GET /salud` solo está en la de Francisco. |

### 1.4 Conflictos y resolución

| # | Conflicto | Daniel | Isaac | Francisco | Resolución y argumento |
|---|---|---|---|---|---|
| C1 | Idioma | Rutas y campos en inglés | Rutas en inglés, campos en español | Rutas y campos en español | **Español**, salvo las tres rutas de autenticación (C11). Dos de tres escribieron los campos en español; el SRS, los códigos de error y las rutas acordadas en el Sprint 1 (T-10 y T-11) también lo están. |
| C2 | Identificadores | UUID | UUID | ObjectId | **UUID** (consenso de Daniel e Isaac). Con PostgreSQL (ADR-002) el ObjectId deja de tener sentido. |
| C3 | Familia en la ruta | Implícita (`/families/current`) | Implícita (`/families/me`) | Explícita (`/familias/{familiaId}`) | **Explícita**, aunque fue la opción minoritaria. Un médico pertenece al círculo de varias familias (RF-16-AC-4), así que para él «la familia actual» no existe; con `/me` habría que crear rutas paralelas para el médico. Con el id en la ruta, la regla «recurso de otra familia → 404» se aplica igual en todos los endpoints. |
| C4 | Estados de la conversación | 6 estados, con `ANSWERED` y sin `EN_REVISION` | Los 7 del SRS | Los 7 del SRS | **Los 7 del SRS** (Isaac y Francisco). De `EN_REVISION` dependen RF-16-AC-2 y la bandeja. |
| C5 | Transiciones y entradas de la conversación | `PATCH /state` genérico y `POST /events` con `type` | Un recurso por acción (`send`, `redirect`, `close`, `messages`, `information-requests`, `indications`, `openings`) | Un recurso por acción | **Un recurso por acción** (Isaac y Francisco). Cada transición tiene su actor, sus precondiciones y sus errores, y la `Idempotency-Key` del envío solo puede declararse obligatoria en un recurso propio (revisión REST de S04-A2, OBS-01). |
| C6 | Borrado | 202 y `DELETION_PENDING` | 204 y 200 con informe | 204, borrado físico inmediato | **Borrado físico inmediato** (Isaac y Francisco). RNF-07 pide borrar «en el momento». |
| C7 | Tokens de los enlaces | En la ruta | En el cuerpo | En el cuerpo | **En el cuerpo** (Isaac y Francisco). Un token en la ruta queda en los logs, y RNF-13 lo prohíbe. |
| C8 | Médico de la conversación | `doctorMembershipId` | `medicoId` | `medicoId` | **`medicoId` en la API y pertenencia garantizada en la base.** El argumento de Daniel es correcto: el médico tiene que ser del círculo. La API conserva `medicoId` y `esquema_bd.sql` lo garantiza con un trigger (`verificar_medico_en_circulo`). |
| C9 | Códigos de respuesta | La misma lista en todas, sin 409 ni 429 | Específicos, con 409, 415 y 429 | Específicos, con 409, 412, 413, 415 y 429 | **Específicos** (Isaac y Francisco). El SRS define `TRANSICION_INVALIDA` y `LIMITE_ALCANZADO` como 409 y `BLOQUEADO` como 429. Se conservan 412 y 413 de Francisco para concurrencia y tamaño de foto. |
| C10 | Código del inicio de sesión | 200 | 200 | 201 | **200** (Daniel, Isaac y la actividad S05-S06-A2). |
| C11 | Rutas de autenticación | `/users`, `/sessions` | `/auth/register`, `/auth/login`, `/me` | `/registros`, `/sesiones`, `/cuenta` | **`POST /auth/register` (201, sin contraseña), `POST /auth/login` (200) y `GET /auth/me`**, que son las de Isaac y las que fija la actividad S05-S06-A2. Son las únicas rutas en inglés de la API. Como el registro ya no devuelve la sesión, el cliente llama a `/auth/login` después de registrarse. |
| C12 | Nombre del campo de correlación en `Error` | `correlationId` | `correlationId` | `correlacionId` | **`correlacionId`**, por C1. Es el único campo en inglés que tenían dos especificaciones, y el código del contrato ya lo usa en español. |

## 2. Diagrama de clases

### 2.1 Lo que aportó cada quien

| Integrante | Diagrama | Aporte principal al consolidado |
|---|---|---|
| Francisco | `diagrama_clases_francisco.puml` (S04-A1) | Base del consolidado: 30 clases en cinco paquetes, composición siguiendo la cascada de borrado, `Respuesta` y `Foto` fuera de la jerarquía de eventos, resumen por médico, cita con identidad estable, invitaciones, avisos, registro de accesos, notificaciones y reportes. |
| Daniel | `diagrama_clases_daniel.puml` (S04-A1) | El permiso de historial ligado a la pertenencia del médico al círculo y la multiplicidad `1..*` de eventos por conversación. |
| Isaac | `diagrama_clases_isaac.puml` (S04-A1) | Coincidió con Daniel en ligar el permiso de historial al círculo (su «Decisión 1») y en `Etiqueta.activa`, lo que convirtió las dos ideas en mayoría. |
| Armando | No entregó artefactos de S04 para comparar. | |

### 2.2 Consenso

Los tres diagramas tienen `Familia` compuesta por sus perfiles; `PerfilPaciente` como una sola clase con un atributo de tipo (no como jerarquía) y su consentimiento como clase aparte; `Conversacion` con 1 a 3 etiquetas y los 7 estados del SRS; `Evento` abstracto con `Mensaje` e `Indicacion` como subclases; el permiso de historial como clase propia; y un resumen cuyas citas apuntan a un evento de origen. Los tres usan UUID como identificador.

### 2.3 Gaps

| Solo en | Elemento | Decisión |
|---|---|---|
| Daniel e Isaac | `Etiqueta.activa` | **Se adopta.** Permite retirar una etiqueta del catálogo sin borrarla, para no romper las conversaciones que ya la usan (RNF-11). En la base es `etiqueta.activa`, y la API solo ofrece y acepta etiquetas activas. |
| Isaac | `Conversacion.fechaCierre` | **No se adopta.** La fecha de cierre ya queda en el evento `CambioEstado` a `CERRADA`; guardarla también en la conversación duplicaría el dato. |
| Daniel | `Consentimiento` genérico con `tipo` | **No se adopta.** El único consentimiento que necesita una entidad propia es el del adulto representado (RF-05); Isaac y Francisco lo modelan así. |
| Francisco | `Invitacion`, `Aviso`, `AceptacionAviso`, `RegistroAcceso`, `Notificacion`, `Reporte`, `RegistroBorrado` y el paquete técnico | **Se conservan.** Cada una tiene criterios del SRS que dependen de ella (RF-01-AC-5, RF-06, RF-07, RF-19, RF-21, RF-22, RNF-08) o la necesita la API (`sesion`, `clave_idempotencia`). |
| Francisco | `Familia.nombre` | **Se conserva** (Daniel también lo tiene). El médico que atiende a varias familias filtra la bandeja por familia (RF-16-AC-4). |

### 2.4 Conflictos y resolución

| # | Conflicto | Daniel | Isaac | Francisco | Resolución y argumento |
|---|---|---|---|---|---|
| K1 | Roles de usuario | Herencia: `CuidadorPrincipal`, `Cocuidador`, `Medico`, `Administrador` | Una clase `Usuario` con `rol` (enum) | Herencia: `Cuidador` (con `tipo`), `Medico`, `Administrador` | **Herencia con un solo `Cuidador`.** Médico y cuidador tienen datos propios (términos y especialidad; declaraciones de RF-01), que en una sola clase quedarían nulos para la mitad de los usuarios. Las subclases `CuidadorPrincipal` y `Cocuidador` de Daniel no tienen atributos propios: lo que las distingue son permisos de la matriz 3.0, así que basta un `tipo`. |
| K2 | Fotos y respuestas de contexto | Subclases de `Evento` | Subclases de `Evento` | Entidades propias; el evento (`FotoAgregada`, `RespuestaRegistrada`) deja constancia | **Entidades propias**, aunque fue la opción minoritaria. Un evento es historial que no cambia, pero en `BORRADOR` una foto se puede borrar (RF-21-AC-1) y una respuesta se corrige (el `PUT` idempotente del contrato). Con fotos y respuestas como eventos, corregir el borrador obligaría a borrar historial o dejaría dos respuestas vigentes a la misma pregunta. |
| K3 | Médico de la conversación | La conversación se asigna a una `MembresiaMedica` | La conversación apunta al `Usuario` médico | Apunta al `Medico`, con la restricción de que sea del círculo | **Al médico, con la restricción en la base** (Isaac y Francisco; igual que C8). El trigger `verificar_medico_en_circulo` garantiza lo que Daniel buscaba sin cambiar la API. |
| K4 | Permiso de historial | Entre `PerfilPaciente` y `MembresiaMedica` | Entre `PerfilPaciente` y `CirculoMedico` | Entre `PerfilPaciente` y `Medico` | **La regla de Daniel e Isaac.** Con el modelo de Francisco, un médico que salía del círculo y volvía a entrar recuperaba el permiso anterior sin que la familia lo decidiera otra vez (RF-08). La asociación se conserva entre perfil y médico, porque así se consulta en cada lectura del historial, y el trigger `borrar_permisos_al_salir_del_circulo` de `esquema_bd.sql` borra el permiso cuando el médico sale (probado en la prueba de humo). |
| K5 | Eventos por conversación | `1..*` | `0..*` | `0..*` | **`1..*`** (Daniel). Al crear la conversación ya se registra el cambio de estado a `BORRADOR`, así que nunca existe sin eventos. |
| K6 | Identidad de la cita del resumen | `textoExacto` y `marcadaIncorrecta` | `textoLiteral` y `marcadaIncorrecta` | Id estable (SHA-256 de evento + posición) y la marca como evento `CitaMarcada` | **Id estable**, aunque fue la opción minoritaria. El resumen se regenera cuando hay eventos nuevos; una marca guardada en la cita se pierde en la siguiente regeneración. Además, el texto no sirve como identidad porque el modelo recibe el texto seudonimizado (RNF-12, ADR-001 de Francisco). |
| K7 | Relación entre familia y cuidadores | Composición con el principal y agregación con el cocuidador | Asociaciones de `Usuario` con `Familia` | Composición `1..2` | **Composición.** Borrar la cuenta familiar borra también la cuenta del cocuidador (RF-21-AC-4), así que su vida depende de la familia. |

## 3. Arquitectura

### 3.1 Lo que aportó cada quien

| Integrante | Arquitectura | Aporte principal |
|---|---|---|
| Francisco | ADR-001 y diagramas C4 de S04-A1 (`decision_arquitectonica_francisco.md`) | Monolito modular, cuatro puertos hacia dependencias externas, procesos programados dentro del proceso, comparación de cinco estilos. |
| Daniel | ADR-001 de S04-A1 (`decision_arquitectonica_daniel.md`) | Criterios explícitos para reconsiderar la decisión (cuándo extraer un módulo) y la regla de que el administrador no tiene rutas para leer datos clínicos. |
| Isaac | ADR-001 de S04-A1 (`decision_arquitectonica_isaac.md`) | La API como único punto que aplica la autorización antes de tocar la base, las fotos o el módulo de resumen. |
| Armando | No entregó artefactos de S04 para comparar. | |

### 3.2 Consenso

Los tres ADR eligen, por separado, **cliente-servidor con la API como monolito modular organizado en capas**: Next.js como cliente y una sola API Express dividida en módulos de dominio. Los tres descartan los microservicios y la arquitectura orientada a eventos como estilo principal por su costo para el equipo y el calendario, y aíslan el proveedor del modelo de lenguaje detrás de una interfaz para poder cambiarlo. Los tres listan prácticamente los mismos módulos (autenticación, familias y perfiles, círculo médico, conversaciones, fotos, notificaciones, resumen, privacidad y administración), que son los que usa `backend/src/modulos/`.

### 3.3 Conflictos y resolución

| # | Conflicto | Daniel | Isaac | Francisco | Resolución y argumento |
|---|---|---|---|---|---|
| A1 | Base de datos | MongoDB | MongoDB | MongoDB | **PostgreSQL** (ADR-002 en `arquitectura_equipo.md`). Los tres seguían el SRS 2.4; el cambio es una decisión de equipo para esta actividad. |
| A2 | Procesos en segundo plano | Proceso *worker* separado con el mismo código | No lo define | Planificador dentro del proceso de la API (`node-cron`) con candado en la base | **Dentro del proceso.** La capa gratuita de Render alcanza para un solo servicio encendido todo el mes; un *worker* aparte duplicaría el consumo y su arranque en frío. El criterio de Daniel (escala independiente sostenida) queda como condición para separarlo. |
| A3 | Generación del resumen | Asíncrona, por un trabajador | Detrás de una interfaz, sin definir el momento | Síncrona al consultar `GET /resumen`, con tiempo límite | **Síncrona con tiempo límite.** RF-17 dice que el resumen «se genera al abrir la conversación», y el detalle ya no depende de él porque es otra petición (RNF-01). El *circuit breaker* que propone Daniel se adopta dentro del adaptador del proveedor. |
| A4 | Tamaño del equipo | «Un solo desarrollador» | «Un equipo pequeño» | Cuatro integrantes con unas 29 horas productivas por sprint | **Cuatro integrantes**, el dato real del Sprint 1. No cambia la elección: las tres lecturas llegan al monolito modular. |
