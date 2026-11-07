# Capa de servicios de API: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S07-S08-A2, Parte 1
**Fecha:** 7 de noviembre de 2026

---

## 1. Qué hay y dónde

```
frontend/src/services/
├── clienteHttp.ts          # cliente y sus interceptores; único sitio que habla con fetch
├── interceptores.ts        # los dos interceptores concretos: JWT y 401
├── almacenToken.ts         # único sitio que sabe dónde vive el token
├── errores.ts              # ApiError + traducción de códigos a texto para el usuario
├── alertas.ts              # presentación del error con SweetAlert2
├── authService.ts          # /auth/login, /auth/register, /auth/me
├── perfilesService.ts      # perfiles de paciente
├── familiasService.ts      # familias y su círculo médico
├── conversacionesService.ts# conversaciones, eventos y envíos
└── catalogosService.ts     # /salud, /etiquetas, /avisos (rutas públicas)
```

La regla que ordena todo: **un servicio por recurso, y ningún componente llama a `fetch`**. Una pantalla importa `listarPerfiles` y no sabe si por debajo hay cabeceras, token o reintentos.

## 2. Cliente HTTP: por qué `fetch` y no axios

La actividad admite cualquiera. Elegimos **`fetch`** por dos razones concretas, no por preferencia:

1. **Cero dependencias.** El cliente completo son 120 líneas. Añadir axios (unos 450 KB en `node_modules`, ~13 KB en el bundle) para envolver algo que ya está en el navegador no se paga con nada que necesitemos.
2. **Next.js lo extiende.** El `fetch` de Next admite opciones de cacheo y revalidación que axios no puede usar. Si mañana movemos lecturas a Server Components, el cliente ya está donde debe.

**Lo que cuesta:** `fetch` no trae interceptores. Hubo que escribirlos, y ese es el grueso de `clienteHttp.ts`. Si el equipo creciera y la capa se volviera más compleja, axios sería defendible.

**Una trampa de `fetch` que el código resuelve de forma explícita:** `fetch` sólo rechaza la promesa si la petición **no llegó a completarse**. Un 403 o un 500 resuelven con normalidad. Por eso el cliente comprueba `respuesta.ok` a mano; si no, el código trataría un cuerpo de error como si fuera un resultado válido.

## 3. Interceptores: cómo se implementaron

`fetch` no los tiene, así que son dos listas de funciones que el cliente recorre:

```ts
registrarInterceptorPeticion((config) => { … })   // antes de cada petición
registrarInterceptorError((error, config) => { … }) // ante cualquier error
```

Se registran **una sola vez**, al montar `AuthProvider`, en `interceptores.ts`.

### Interceptor de petición: el JWT

Adjunta `Authorization: Bearer <token>` leyendo el token del almacén, salvo que la petición se declare `publica` (login, registro y catálogos). Ninguna pantalla ni servicio pasa el token a mano: un servicio nuevo lo hereda sin escribir una línea.

### Interceptor de respuesta: el 401

Un 401 significa que **el servidor** decidió que la sesión ya no vale: caducó por inactividad (`MINUTOS_SESION`), se revocó el `jti` o el token dejó de ser válido. El interceptor borra el token y avisa al contexto, que lleva a `/sesion-expirada`.

Está centralizado a propósito. Si cada pantalla tuviera que acordarse de comprobar el 401, bastaría con olvidarlo en una para que el usuario se quedara mirando una lista vacía sin saber por qué.

## 4. Manejo de errores: un solo camino, dos presentaciones

Todo error acaba siendo un `ApiError` con el código del contrato del equipo (`DATOS_INVALIDOS`, `SIN_PERMISOS`, `NO_ENCONTRADO`…), el mensaje y el `correlacionId`. Un fallo de red, que no tiene respuesta HTTP, se normaliza como `SIN_CONEXION` para que el resto del código no distinga casos.

`mensajeParaUsuario()` traduce cada código a una frase accionable. El `mensaje` del API está escrito para quien depura; el usuario necesita otra cosa:

| Código | Lo que dice el API | Lo que lee el usuario |
|---|---|---|
| `SIN_CONEXION` | *(no hay respuesta)* | No pudimos contactar con DAFI. Revise su conexión e inténtelo de nuevo. |
| `NO_AUTENTICADO` | Token ausente, inválido o expirado | Su sesión se cerró por inactividad. Vuelva a entrar para continuar. |
| `CORREO_REGISTRADO` | Ya existe una cuenta con este correo | Ya existe una cuenta con este correo. |
| `CONVERSACION_INCOMPLETA` | Faltan respuestas obligatorias | Faltan respuestas obligatorias para poder enviar la conversación. |

Para 422 se conserva el mensaje del servidor a propósito: es el único que nombra el campo concreto que falló, y eso es más útil que cualquier texto genérico.

### Dónde se muestra cada error

La decisión importante de esta capa, y la que más cambia la experiencia:

- **Error de campo** (correo mal escrito, contraseña corta): **no abre diálogo**. Se muestra junto al campo, enlazado con `aria-describedby` y con `role="alert"`, como exige WCAG 3.3.1. Interrumpir con un modal para decir «el correo no es válido» obliga a cerrarlo para volver a ver el campo que hay que corregir.
- **Error de API o de red**: **sí abre diálogo**, con **SweetAlert2**. Ocurre lejos de donde la persona estaba mirando y tiene que interrumpir.

El diálogo lleva título específico por tipo de fallo («Sin conexión con DAFI», «No tiene permiso»), el texto traducido, y el `correlacionId` al pie: es lo que permite al equipo encontrar esa petición exacta en los registros cuando alguien reporta un problema.

Cuando el fallo es recuperable, el diálogo ofrece **Reintentar**, que es la acción que de verdad lo resuelve. El vídeo `flujo_e2e.mp4` muestra ese ciclo completo con la red caída de verdad.

**SweetAlert2 está personalizado** con los tokens de DAFI (`globals.css`), para que un error no parezca venir de otra aplicación. Los botones respetan el mínimo de 44 px de alto del resto de la interfaz.

## 5. Dónde vive el token, y qué estamos aceptando

En **`sessionStorage`**, detrás de `almacenToken.ts`. Ningún otro archivo lo toca.

| Opción | Por qué no / por qué sí |
|---|---|
| `localStorage` | Sobrevive al cierre del navegador. En un equipo compartido —una familia, justo nuestro caso— deja la sesión abierta a quien use el ordenador después. |
| **`sessionStorage`** | **Elegida.** Muere al cerrar la pestaña y no se comparte entre pestañas. |
| Cookie `httpOnly` | **Es lo correcto**, porque JavaScript no puede leerla y un XSS no roba el token. No se puede hoy: el backend de S05-S06-A2 devuelve el JWT en el cuerpo de la respuesta y no emite cookies. |

**Lo que estamos aceptando:** con `sessionStorage` un XSS puede leer el token. Tres cosas acotan el daño: muere al cerrar la pestaña, el servidor lo revoca a los 30 minutos sin actividad, y `/auth/me` vuelve a consultar la base en cada arranque, así que un token revocado se detecta enseguida.

**El camino para cerrarlo ya está hecho.** `next.config.ts` reescribe `/api/v1/*` hacia Express, de modo que cliente y API comparten origen. Falta un Route Handler de Next que reciba el token del login y lo reemita como cookie `httpOnly`; cuando exista, se cambia `almacenToken.ts` y **ningún servicio ni pantalla se entera**. Esa es la razón de que el almacén sea un módulo propio y no cuatro llamadas a `sessionStorage` repartidas.

## 6. URL base y mismo origen

`NEXT_PUBLIC_API_URL` vale **`/api/v1`**: una ruta relativa, a propósito. `next.config.ts` reescribe esa ruta hacia `BACKEND_URL`, así que el navegador sólo habla con su propio origen.

Viene del registro de riesgos del Sprint 1: *«Cookies de sesión bloqueadas en Safari para iOS si cliente y API quedan en dominios distintos → Next.js reenvía `/api` a Express»*. Dos efectos inmediatos: el frontend deja de depender del `cors()` abierto del backend, y la cookie `httpOnly` del punto anterior sería de primera parte.

`BACKEND_URL` **no** lleva el prefijo `NEXT_PUBLIC_`: sólo la usa el servidor de Next al reescribir, y el navegador nunca necesita saber dónde está Express de verdad. Todo lo que lleva ese prefijo acaba dentro del bundle que se descarga el usuario.

## 7. Estados de carga

`listarPerfiles` se consume con tres estados explícitos: cargando, error y datos. Mientras carga se muestra un **esqueleto con la forma de la lista**, no una rueda: comunica qué va a aparecer y evita que la página salte cuando llegan los datos.

Lleva `role="status"` y `aria-live="polite"` porque quien no ve el esqueleto también necesita saber que algo está en marcha (WCAG 4.1.3).

## 8. Cómo levantarlo para probarlo

El backend necesita PostgreSQL. Si no lo tienes instalado, con Docker:

```bash
docker run -d --name dafi-postgres \
  -e POSTGRES_USER=dafi -e POSTGRES_PASSWORD=dafi_local_dev -e POSTGRES_DB=dafi \
  -p 5434:5432 postgres:16

docker exec -i dafi-postgres psql -U dafi -d dafi -v ON_ERROR_STOP=1 < S05_S06_A1/esquema_bd.sql
docker exec -i dafi-postgres psql -U dafi -d dafi -v ON_ERROR_STOP=1 < backend/scripts/seed_demo.sql
docker exec -i dafi-postgres psql -U dafi -d dafi -v ON_ERROR_STOP=1 < backend/scripts/seed_auth_demo.sql
```

Copia `backend/.env.example` a `backend/.env`, pon `DB_PORT=5434` y genera el secreto con `openssl rand -hex 32`. Luego:

```bash
cd backend  && npm ci && npm run dev          # API en :4000
node scripts/seed_integracion_demo.mjs        # familia y perfiles de prueba
cd ../frontend && npm ci && npm run dev       # cliente en :3000
```

`seed_integracion_demo.mjs` crea los datos **a través de la propia API**, no por SQL: así quedan sujetos a las mismas validaciones y reglas de negocio que cualquier petición real. Es idempotente.

Credenciales de prueba: `maria.ruan@correo.com` / `DafiDemo2026!` (sólo local, datos ficticios).

## 9. Lo que falta

1. **La cookie `httpOnly`** de la sección 5. Es la deuda principal.
2. **`cerrarSesion()` sólo limpia el cliente.** El contrato define `DELETE /sesiones/actual` para revocar el `jti` en el servidor, pero esa ruta todavía no existe en `backend/`.
3. **Sin reintento automático.** Un fallo de red se le ofrece al usuario como botón «Reintentar»; no hay reintentos con espera creciente. Para las operaciones con efectos (`POST /envios`, `POST /mensajes`) sería arriesgado reintentar solos, aunque el backend exija `Idempotency-Key` justamente para eso.
4. **Sin caché de estado de servidor.** Cada pantalla pide sus datos al montarse. Con más pantallas compartiendo datos convendría TanStack Query, como ya se anotó en `decision_stack_frontend.md`.
5. **Sólo `/perfiles` consume datos reales.** El resto de pantallas sigue con los datos de demostración de `src/lib/datos-demo.ts`; los servicios de conversaciones y familias están escritos y tipados, pero aún no conectados a sus vistas.
