# ADR-001: Selección del estilo arquitectónico

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Alumno:** Francisco Martínez Álvarez (A01840483)
**Actividad:** S04-A1, Parte 1

**Fecha:** 2026-10-10
**Estado:** Aceptado
**Requerimientos de referencia:** SRS de equipo v3.0 (`S03_A1/SRS_equipo.md`) y contrato de API (`S04_A2/openapi.yaml` 1.1.0)

## Contexto

DAFI es una aplicación web para celular donde una familia conversa sobre la salud de sus hijos con los médicos que ya conoce, fuera de WhatsApp. La única función con IA es un resumen del historial hecho de citas textuales verificables. La construye un equipo de cuatro en 12 semanas, con unas 29 horas productivas por sprint entre todos (`S03_A2/sprint1_planning.md`). Aunque esta actividad es individual, la decisión tiene que servirle a ese equipo y no a una sola persona.

Hay cosas que ya no están en discusión y que esta decisión toma como restricciones:

- **El stack.** Next.js en el cliente, Node.js con Express en la API y MongoDB como base de datos (SRS 2.4). Es un acuerdo de equipo desde `S02_A1/proyecto_base.md` y sustituyó el stack individual que yo había elegido en S01-A2 (React, FastAPI y PostgreSQL).
- **El hosting.** Capas gratuitas de Vercel para el cliente, Render para la API y MongoDB Atlas M0 (tareas T-06 y T-07 del Sprint 1).
- **El contrato.** 63 operaciones REST con JWT, idempotencia y dos procesos programados que no se exponen como endpoints (`S04_A2`).

Le pedí a una sesión de agente que analizara el SRS y recomendara un estilo con al menos tres alternativas (su propuesta íntegra está en `evidencia/propuesta_agente_arquitectura.md`). De su análisis tomé estos requerimientos como los que más pesan en la arquitectura:

| Requerimiento | Qué le exige a la arquitectura |
|---|---|
| **RNF-10** (99 % de disponibilidad; la primera petición tras una suspensión cumple RNF-01) | Render gratuito suspende un servicio tras 15 minutos sin tráfico y da 750 horas de instancia al mes por cuenta (Render, s. f.). Alcanza para **un** servicio encendido todo el mes, no para varios, y cada servicio suspendido suma su propio arranque en frío. |
| **Regla 3.0 «Qué puede ver un médico»** (RF-08, RF-17-AC-3, RF-18) | La misma regla filtra conversaciones, historial, fotos y lo que se envía al resumen. Si vive en más de un lugar, es la fuga de datos más probable. |
| **Regla 3.0 de estados y de errores** («una falla a mitad de una operación no deja datos a medias») | Once transiciones con un solo dueño en el código, y transacciones que abarcan varias colecciones (registro, envío, borrado de la familia). |
| **RNF-12, RD-06 y RF-23-AC-1** | El modelo de lenguaje es un servicio externo, de un proveedor todavía sin elegir, que no puede recibir datos que identifiquen al paciente y que puede fallar sin tirar la conversación. |
| **RF-15-AC-3 y RF-20** | Dos procesos que corren cada 15 minutos con un reloj inyectable. En Vercel Hobby un cron corre como máximo una vez al día (Vercel, s. f.-b), así que no pueden vivir ahí. |
| **RNF-06 y RNF-07** | Las fotos solo salen por la API y se borran físicamente. Atlas M0 tiene 512 MB y el disco de Render es efímero, así que hace falta un almacén de archivos aparte. |

## Decisión

Adopto un estilo **cliente-servidor con la API como monolito modular**. El cliente Next.js (en Vercel) reenvía `/api/*` a una sola API Express (en Render) que se despliega como un proceso, con una base MongoDB. Por dentro, la API se divide en módulos verticales que siguen las épicas del SRS y las etiquetas del contrato:

| Módulo | Responsabilidad | Contrato (`openapi.yaml`) |
|---|---|---|
| `identidad` | Registro, sesiones con `jti`, verificación, restablecimiento | Autenticación y cuenta |
| `familias` | Familia, miembros, invitaciones, privacidad, borrado | Familias, Invitaciones |
| `perfiles` | Perfiles, consentimiento, permisos de historial, **política de visibilidad** | Perfiles |
| `conversaciones` | Ciclo de vida, **máquina de estados**, preguntas, fotos, mensajes, indicaciones, eventos | Conversaciones, Contenido de conversación |
| `contexto` | Resumen: seudonimización, llamada al modelo y verificación de citas | Resumen de contexto |
| `notificaciones` | Notificaciones en la app y bandeja de salida de correos | Notificaciones |
| `administracion` | Reportes y desactivación de cuentas | Reportes y administración |
| `catalogos` | Etiquetas, preguntas y avisos como datos | Catálogos |

Cada módulo usa capas internas (controlador → caso de uso → dominio → repositorio), y solo expone hacia los demás su interfaz pública. Los patrones que adopto dentro del estilo son los siguientes:

- **Cadena de middleware de Express** para lo transversal, en este orden: identificador de correlación, logs enmascarados (RNF-13), autenticación, autorización contra la matriz de roles antes de buscar el recurso, validación contra `openapi.yaml`, idempotencia y manejador de errores.
- **Puertos y adaptadores solo para las cuatro dependencias externas:** `Reloj`, `ProveedorResumen`, `EnvioCorreo` y `AlmacenFotos`. Cada puerto tiene un adaptador real y uno falso para las pruebas. No los extiendo al resto del dominio, porque sería trabajo sin beneficio para un equipo de 29 horas por sprint.
- **Repositorio por agregado y una sola política de visibilidad** que consumen historial, fotos, eventos y resumen.
- **Máquina de estados como tabla de datos** `(estado, acción, rol) → estado`, que usan tanto los controladores como los procesos programados.
- **Bandeja de salida (outbox) para el correo:** la notificación se escribe en la misma transacción que la acción, y un ciclo con reintentos envía el correo después. Una caída del proveedor de correo no revierte el envío de una conversación.
- **Procesos programados dentro del proceso**, con `node-cron` cada 15 minutos, un candado en Mongo para que no corran dos veces durante un despliegue y una ejecución al arrancar para ponerse al día si Render suspendió la API. Las pruebas los llaman directamente con el reloj inyectado.

## Alternativas consideradas

| Alternativa | Escalabilidad | Mantenibilidad | Complejidad de implementación | Adecuación al equipo | Por qué no la elegí |
|---|---|---|---|---|---|
| **A. API monolítica en capas técnicas** (`routes/`, `controllers/`, `services/`, `models/`) | Media | Media | Baja | Alta | Cuesta lo mismo que la elegida, pero con 63 operaciones la regla de visibilidad termina copiada en los servicios de historial, fotos y resumen, y RF-17-AC-3 se rompe el día que alguien la reimplementa distinto. |
| **B. API como monolito modular** (elegida) | Media | Alta | Baja a media | Alta | — |
| **C. Microservicios** (identidad, familias, conversaciones, resumen, notificaciones) | Alta en teoría | Baja | Alta | Baja | Cada lectura del médico necesita datos de cuatro servicios. Borrar una familia (RF-21-AC-4) o pasar conversaciones a `SIN_MEDICO` (RF-08-AC-3) exigiría sagas. Y cinco servicios no caben en las 750 horas gratuitas de Render, así que rompen RNF-10. |
| **D. Full-stack Next.js sin servidor** (Route Handlers en Vercel, sin Express) | Alta | Media | Media | Baja | Contradice el SRS 2.4 y el contrato. El cron de Vercel Hobby no baja de una vez al día, y RF-20-AC-3 necesita revisar cada 15 minutos. Además desecharía el trabajo de T-04 a T-07. |
| **E. Orientada a eventos con broker de mensajes** | Alta | Media a baja | Alta | Baja | Los criterios esperan efectos visibles en la misma petición (RF-12-AC-2: el médico la recibe en su bandeja), y el resumen se genera al abrir la conversación, no en segundo plano. El broker sería un servicio más, sin capa gratuita confiable. Rescaté su idea en pequeño, con la bandeja de salida del correo. |

Descarté también el MVC renderizado en el servidor, porque el contrato REST y el SRS 2.1 ya separan cliente y API.

La diferencia entre A y B es la que más me costó decidir, porque el despliegue es idéntico. Me quedé con B porque el riesgo principal de DAFI no es de carga sino de privacidad: los tres criterios que podrían exponer datos de un paciente a quien no debe verlos (RF-08-AC-1, RF-17-AC-3 y RF-22-AC-2) dependen de que la regla de visibilidad viva en un solo lugar. Con A eso depende de la disciplina de cada quien; con B, de la estructura del código.

## Consecuencias

**Positivas**

- Un solo servicio en Render: cabe en la capa gratuita, hay un solo arranque en frío que el monitor de T-07 mantiene despierto, y un solo pipeline de CI y de despliegue.
- Una sola base permite transacciones de MongoDB (Atlas corre como *replica set*) para cumplir «no dejar datos a medias» y guardar las claves de idempotencia con un índice TTL de `HORAS_IDEMPOTENCIA`.
- El módulo de resumen queda aislado tras su puerto. Se puede probar con un modelo falso (RF-17-AC-2), cambiar de proveedor sin tocar el dominio (RD-06) y correr fuera de HTTP para la evaluación de RNF-09. Si algún día hiciera falta escalarlo aparte, es el primer candidato a separarse, sin reescribirlo.
- Los módulos coinciden con las épicas del backlog, así que dos parejas pueden trabajar en paralelo, como en el Sprint 1, sin tocar los mismos archivos.

**Negativas y cómo las mitigo**

| Consecuencia | Mitigación |
|---|---|
| Los límites entre módulos se erosionan: Mongoose deja importar cualquier modelo desde cualquier archivo. | Una regla de imports en CI (`dependency-cruiser` o `no-restricted-imports`): cada módulo solo se usa a través de su `index`. |
| Punto único de falla, y Render gratuito suspende la API. | El monitor de disponibilidad de T-07 hace ping antes de los 15 minutos; medir la primera petición en frío contra RNF-01 desde el Sprint 2. |
| La validación de fotos (laplaciano y brillo) usa CPU en el mismo proceso que atiende todo lo demás. | Procesarla con `sharp`, que trabaja en hilos nativos, sobre imágenes de 1024 px como máximo, y medir el p95 de RNF-01 temprano. Si no alcanza, pasarla a `worker_threads` antes que a otro servicio. |
| El borrado físico (RNF-07) abarca dos almacenes, la base y los archivos, sin una transacción común. | Primero se borran los documentos dentro de una transacción, que deja marcados los archivos por borrar; después se borran los archivos y el proceso programado reintenta los pendientes. |
| Atlas M0 no tiene respaldos automáticos (MongoDB, s. f.), y el SRS promete `DIAS_RETENCION_RESPALDO`. | Un `mongodump` programado con retención de 7 días, o declararlo en el aviso de privacidad del ambiente del curso. Hay que decidirlo en el equipo antes de HU-17. |
| Con revisiones cada 15 minutos, el aviso de RF-20-AC-3 (30 minutos con prioridad) puede llegar hasta unos 45 minutos después del envío. | Cumple el criterio, que se evalúa «cuando corre el proceso programado», pero conviene que el equipo lo sepa al refinar HU-16. |

## Diferencias con la propuesta del agente

Adopté la recomendación del agente (alternativa B), pero cambié tres cosas de su propuesta:

- **El tiempo límite del proxy de Vercel no es un riesgo.** El agente lo dejó abierto: temía que el resumen, que puede tardar hasta 20 segundos, recibiera un 504 al pasar por el `rewrite` de Next.js, y proponía llamar a Render directo con CORS. Lo verifiqué: Vercel espera hasta 120 segundos a que el backend empiece a responder, en todos los planes (Vercel, s. f.-a). Mantengo un solo origen para el cliente y no abro CORS.
- **La validación del contrato no da el 422 «gratis».** El agente afirmó que `express-openapi-validator` responde 400 y 422 por sí solo. En realidad responde 400 a cualquier violación del esquema, así que el manejador de errores tiene que convertir las del cuerpo en 422 `DATOS_INVALIDOS`, como fijé en el contrato de S04-A2.
- **Resolví la tensión entre la seudonimización y la verificación de citas.** El agente encontró una contradicción real en el SRS. Si el texto que recibe el modelo ya no dice «Mateo» sino «el paciente» (RNF-12), la cita que devuelve no aparece tal cual en el evento original y RF-17-AC-2 la descartaría siempre. El agente dejó dos opciones abiertas; elegí una. El modelo devuelve solo el `eventoId` y los límites del fragmento dentro del texto seudonimizado, el verificador compara contra esa misma versión seudonimizada del evento, y al médico se le muestra el fragmento original. Hay que acordarlo con el equipo antes de HU-14, porque cambia la redacción de RF-17.

Quedan dos pendientes que no son de estilo arquitectónico y que llevo al equipo: el cambio de cookie a JWT que propuse en S04-A2 y el proveedor del almacén de fotos, que defino en el diagrama de despliegue.

## Referencias

MongoDB. (s. f.). *Back up your cluster*. MongoDB Atlas Documentation. Recuperado el 10 de octubre de 2026, de https://www.mongodb.com/docs/atlas/backup-cluster/

Render. (s. f.). *Deploy for free*. Render Documentation. Recuperado el 10 de octubre de 2026, de https://render.com/docs/free

Vercel. (s. f.-a). *CDN origin timeout increased to two minutes*. Vercel Changelog. Recuperado el 10 de octubre de 2026, de https://vercel.com/changelog/cdn-origin-timeout-increased-to-two-minutes

Vercel. (s. f.-b). *Cron jobs: Usage and pricing*. Vercel Documentation. Recuperado el 10 de octubre de 2026, de https://vercel.com/docs/cron-jobs/usage-and-pricing
