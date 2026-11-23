# Plan: DAFI demoable para S11-A1

**Equipo 4:** Armando Arredondo Valle, Isaac González Trejo, Francisco Martínez Álvarez y Daniel Ruán Aguilar
**Desarrollo de esta semana:** Francisco (PO) con el agente Claude Code
**Entrega:** jueves 26 de noviembre de 2026, 23:59 (Canvas y carpeta `S11_A1/` del repo)
**Estado de partida:** `main` en `0c5d696` (PR #61 con README, matriz y retrospectiva ya fusionado)

Este documento dice qué vamos a construir y en qué orden. La lista de trabajo con sus pruebas está en [TASKS.md](TASKS.md) y los errores y particularidades que encontremos se anotan en [LESSONS.md](LESSONS.md).

## 1. Objetivo

Grabar un video continuo de 5 minutos como máximo, con la app corriendo **en local** en la máquina de Francisco, que muestre:

1. Login con datos reales.
2. El CRUD completo del recurso principal (perfiles de paciente).
3. El flujo de conversación de punta a punta: la familia abre una conversación, responde el contexto y la envía; la médica la ve en su bandeja, la abre y responde; la familia ve la respuesta.
4. Al menos un error del backend manejado y visible para el usuario (contraseña incorrecta en el login; si sobra tiempo, correo ya registrado en crear cuenta).

Todo con datos ficticios pero completos (nada de listas vacías).

## 2. Stack: el que hay, no el que preferíamos

| Capa | Preferencia original de Francisco | Lo que está construido | Decisión |
|---|---|---|---|
| Frontend | Next.js + Tailwind | Next.js 16 (App Router) + TypeScript + **CSS Modules** | Se queda. Tailwind se descartó en S07-S08-A1 (`S07_S08_A1/decision_stack_frontend.md`); migrar 22 pantallas ahora no aporta nada a la demo. |
| Backend | FastAPI (Python) | **Node.js + Express 5** con `pg` y JWT | Se queda. El SRS v3.0 (sección 2.4) fijó Express y todo el backend, sus pruebas y la auditoría S09 están escritos sobre él. Reescribirlo en 4 días no es viable. |
| Base de datos | PostgreSQL | **PostgreSQL 16** | Coincide. El SRS menciona MongoDB por error histórico; la matriz ya lo declara como inconsistencia. |

Si alguien pregunta en la presentación, la respuesta honesta es que el stack lo fijó el SRS de equipo y no se cambió a mitad de proyecto.

## 3. Guion de la demo (lo que tiene que funcionar)

Se usan dos ventanas: una normal con la cuidadora y una de incógnito con la médica, para no cerrar sesión a cada rato.

| # | Quién | Pantalla | Acción | Endpoint |
|---|---|---|---|---|
| 1 | María (cuidadora) | `/entrar` | Escribe mal la contraseña: **el 401 del backend se muestra como mensaje**; luego entra | `POST /auth/login` |
| 2 | María | `/perfiles` | Ve sus 3 perfiles reales | `GET /familias/{id}/perfiles` |
| 3 | María | `/perfiles/nuevo` | Crea un perfil nuevo | `POST /familias/{id}/perfiles` |
| 4 | María | `/perfiles` | Lo ve en la lista | `GET /familias/{id}/perfiles` |
| 5 | María | `/perfiles/{id}` | Edita alergias y guarda | `PATCH /perfiles/{id}` |
| 6 | María | `/perfiles/{id}` | Borra el perfil recién creado, con confirmación | `DELETE /perfiles/{id}` |
| 7 | María | `/perfiles/{id}/conversaciones/nueva` | Abre conversación para Mateo: etiqueta «Fiebre», médica, prioridad | `GET /etiquetas`, `GET /familias/{id}/miembros?rol=medico`, `POST /perfiles/{id}/conversaciones` |
| 8 | María | `/conversaciones/borrador` | Responde las preguntas de contexto y envía | `PUT .../preguntas/{preguntaId}/respuesta`, `POST /conversaciones/{id}/envios` |
| 9 | Dra. (médica) | `/medico/bandeja` | Ve la conversación nueva en «Enviadas» | `GET /conversaciones` |
| 10 | Dra. | `/medico/conversaciones/{id}` | La abre (pasa a `EN_REVISION`) y registra una indicación | `GET /conversaciones/{id}`, `POST /conversaciones/{id}/indicaciones` |
| 11 | María | `/conversaciones/{id}` | Ve la indicación en el hilo y contesta con un mensaje | `GET /conversaciones/{id}/eventos`, `POST /conversaciones/{id}/mensajes` |

El paso 10 es lo que diferencia a DAFI: la conclusión la escribe la médica, DAFI solo ordena la información.

**Mínimo aceptable si el tiempo se acaba:** pasos 1 a 9 más un mensaje de la médica (`POST /mensajes`, que ya existe) en lugar de la indicación.

## 4. Qué falta construir

**Backend** (todo lo demás ya existe y tiene autorización por rol):

- `GET /familias/{familiaId}/miembros` para elegir médico.
- `PUT /conversaciones/{id}/preguntas/{preguntaId}/respuesta` para guardar respuestas.
- Transición `ENVIADA → EN_REVISION` cuando la médica abre el detalle por primera vez.
- `POST /conversaciones/{id}/indicaciones` con transición a `CON_INDICACIONES`.
- Seed de demo: familia de María, 3 perfiles, médica activa en su círculo, etiquetas, preguntas de contexto y una conversación histórica.

**Frontend** (los servicios existen; faltan las pantallas conectadas):

- Crear cuenta, crear perfil, detalle con editar y borrar.
- Nueva conversación, borrador con preguntas y envío.
- Lista de conversaciones e hilo de la cuidadora.
- Bandeja, detalle e indicaciones de la médica.
- Errores del backend visibles en todos los formularios.

**Pruebas y documentación:** arnés de integración con PostgreSQL, Playwright para e2e, matriz y README actualizados, guion del video.

## 5. Fuera de alcance

Fotos, notificaciones por correo, invitaciones y consentimientos completos, recuperación de contraseña, resumen de contexto, reportes de abuso, despliegue en producción. La matriz y el README ya los declaran como no implementados; el video no los toca.

## 6. Quién hace qué

Todo el trabajo lo hacemos Francisco y el agente (Claude Code); no se reparten tareas al resto del equipo.

| Quién | Qué hace |
|---|---|
| Agente | Escribe el código de backend y frontend, las pruebas (unit, integration y e2e), el seed y los borradores de documentación. Una rama y un PR por tarea, con las pruebas corridas antes de pedir revisión. |
| Francisco (PO) | Mantiene el entorno local de la demo, decide cuando algo del contrato o del alcance no está claro, revisa y fusiona cada PR, hace la prueba de humo tras cada merge, escribe el guion y graba. |

La actividad pide que el video se grabe en equipo (uno maneja el teclado y los demás pueden narrar o salir en cámara); eso es lo único en que participan los demás integrantes.

## 7. Calendario

Las tareas se hacen en el orden de TASKS.md, una a la vez, porque las de frontend dependen de los endpoints y del seed.

| Día | Meta | Tareas |
|---|---|---|
| Dom 22 | Docs de plan en `main`. Entorno local de Francisco funcionando con `main` actual. Arnés de pruebas y seed de demo. | E0, Q1, Q2, Q3, B5 |
| Lun 23 | Endpoints de miembros y respuestas. Crear cuenta y CRUD de perfiles en frontend con sus e2e. | B1, B2, F1, F2, F3 |
| Mar 24 | Transición a revisión e indicaciones. Pantallas de conversación de la familia y de la médica. e2e del guion completo. | B3, B4, F4, F5, F6, F7, F8, Q4 |
| Mié 25, 14:00 | **Congelamiento de código.** Solo se corrigen errores que rompan el guion. Q4 pasa 3 veces seguidas. | Q4 |
| Mié 25, tarde | Matriz, README con capturas nuevas, retrospectiva con ejemplos concretos, guion y ensayo cronometrado. | D1, D2, D3, D4 |
| Mié 25, noche | Grabación en una sola toma. | D5 |
| Jue 26 | Subir `demo_proyecto.mp4` (o `demo_link.txt` si pasa de 100 MB) y el zip a Canvas. Margen para imprevistos. | D5 |

## 8. Forma de trabajo

- Una rama por tarea desde `main` (`feat/b2-respuestas`, `feat/f3-detalle-perfil`…) y un PR por rama. PRs pequeños: se revisan y fusionan el mismo día.
- El agente abre el PR solo si pasa en local:
  - `npm --prefix backend test` y `npm --prefix backend run lint`
  - `npm --prefix backend run test:integration` (si toca backend)
  - `npm --prefix frontend run lint` y `npm --prefix frontend run build`
  - `npm --prefix frontend run test` (si toca lógica del frontend) y el e2e que corresponda
- En la descripción del PR: qué tarea de TASKS.md cierra, qué pruebas se agregaron y una captura si cambia una pantalla.
- Después de cada merge, Francisco hace `git pull`, reinicia y recorre el guion de la sección 3 en su máquina. Si algo se rompe, se anota en LESSONS.md.
- Cualquier error raro, configuración que costó trabajo o comportamiento inesperado va a LESSONS.md el mismo día.
- No se cambia el contrato (`S05_S06_A1/openapi_equipo.yaml`) sin que Francisco lo apruebe; si un endpoint nuevo se aparta del contrato, se anota por qué en el PR.

## 9. Entorno local de la demo

La guía completa está en el README raíz. Resumen para la máquina de Francisco (Docker con PostgreSQL 16 en el puerto 5434):

```bash
docker run -d --name dafi-postgres -e POSTGRES_USER=dafi -e POSTGRES_PASSWORD=dafi_local_dev -e POSTGRES_DB=dafi -p 5434:5432 postgres:16
```

```bash
npm --prefix backend run demo:reset
```

```bash
npm --prefix backend run dev
```

```bash
npm --prefix frontend run dev
```

`demo:reset` no existe todavía: es la tarea B5 de TASKS.md (recrea el esquema y carga el seed de demo). Mientras tanto vale el procedimiento de la sección 8 de `S07_S08_A2/capa_servicios.md`.

## 10. Riesgos

| Riesgo | Señal | Respuesta |
|---|---|---|
| Las pantallas de conversación no llegan conectadas el martes | F5 a F7 sin fusionar el martes en la noche | Se graba el mínimo aceptable de la sección 3 |
| `main` se rompe cerca del congelamiento | La prueba de humo de Francisco falla | Se revierte el PR, no se arregla encima |
| Datos de demo inconsistentes entre ensayos | Perfiles o conversaciones duplicados | `demo:reset` antes de cada ensayo y antes de grabar |
| Video de más de 5 minutos | Ensayo cronometrado pasa de 4:45 | Se recorta el paso 5 (editar) o el 11 (respuesta de la familia) |
| Francisco no puede revisar un PR el mismo día | PRs acumulados | El agente sigue con la siguiente tarea en otra rama; nada se fusiona sin su revisión |
| Video de más de 100 MB | Archivo exportado | YouTube no listado y `S11_A1/demo_link.txt` |
