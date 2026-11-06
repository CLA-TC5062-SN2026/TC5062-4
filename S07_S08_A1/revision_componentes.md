# Revisión de los componentes generados por el agente: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4** · **Actividad:** S07-S08-A1, Parte 2
**Fecha:** 5 de noviembre de 2026

Este documento registra **qué cambiamos de lo que propuso el agente y por qué**. No es un resumen de lo que hace cada componente; eso está en los comentarios del código.

---

## 1. Qué se generó y qué se revisó

| Componente | Archivos | Parámetros de configuración |
|---|---|---|
| Botón | `src/components/ui/Button.tsx` + `.module.css` | `variant` (4), `size` (3), `loading`, `loadingText`, `fullWidth`, `startIcon`, más todos los atributos nativos de `<button>` |
| Campo de entrada | `src/components/ui/Input.tsx` + `.module.css` | `label` (obligatorio), `hint`, `error`, `startIcon`, `fullWidth`, más los atributos nativos de `<input>` |
| Tarjeta | `src/components/ui/Card.tsx` + `.module.css` | `title`, `subtitle`, `headingLevel`, `actions`, `footer`, `padding` (4), `as`, `interactive` |
| Barra de navegación | `src/components/ui/Navbar.tsx` + `.module.css` | `user` (null = sin sesión), `items`, `activeHref`, `onLogout`, `onLogin`, `onRegister`, `appName` |

Todos tienen media queries propias: los botones reducen relleno lateral por debajo de 480 px, el campo crece a 48 px de alto en móvil, el encabezado de la tarjeta se apila y la barra colapsa en menú plegable por debajo de 768 px.

## 2. Cambios al código del agente

### C1 — Quitar Tailwind, que el scaffold instaló y que habría roto los CSS Modules

**Lo que propuso el agente.** Ejecutar `create-next-app` con `--tailwind`, que es la opción habitual, y escribir los componentes con clases de utilidad.

**Qué encontramos.** El scaffold dejó esto en `next.config.ts`:

```ts
turbopack: { rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } } }
```

Esa regla pasa **todos** los `*.css` por el loader de Tailwind, incluidos los `*.module.css`. Si se hubieran añadido CSS Modules sin tocar la configuración, el resultado habría sido estilos que no aplican y un fallo difícil de diagnosticar, porque no produce ningún error: simplemente no se genera el ámbito local.

**Qué hicimos.** `npm uninstall tailwindcss @tailwindcss/turbopack`, eliminamos la regla de Turbopack y reescribimos `globals.css` como CSS plano: tokens en `:root`, un reset mínimo y dos utilidades globales (`.sr-only` y `.salto-contenido`). Todo lo demás vive en el `*.module.css` del componente.

**Por qué.** Es consecuencia directa de la decisión de estilos (`decision_stack_frontend.md`, §3.2). Lo registramos porque es el tipo de configuración heredada que sobrevive porque nadie la lee.

### C2 — `type="button"` por omisión

**Lo que propuso el agente.** `<button className={...} {...props}>`, sin fijar `type`.

**Qué hicimos.** `type = 'button'` como valor por omisión del prop.

**Por qué.** El valor por omisión de HTML es `type="submit"`. Un botón de «Cancelar» o «Descartar borrador» colocado dentro de un `<form>` envía el formulario. En DAFI eso significaría disparar `POST /conversaciones/{id}/envios` al pulsar un botón secundario. Quien quiera enviar pasa `type="submit"` explícitamente, como hace la pantalla de login.

### C3 — El botón en carga se deshabilita, y el estado se expone en el árbol de accesibilidad

**Lo que propuso el agente.** Mostrar un spinner cuando `loading` es `true`.

**Qué hicimos.** `disabled={disabled || loading}` y `aria-busy={loading || undefined}`; el spinner lleva `aria-hidden="true"`.

**Por qué.** Dos motivos distintos. El funcional: sin `disabled`, un doble clic en «Enviar» lanza dos peticiones; el backend exige `Idempotency-Key` precisamente porque esto pasa, pero no hay razón para apoyarse en esa red cuando el cliente puede evitarlo. El de accesibilidad: un spinner es información puramente visual; `aria-busy` es lo que un lector de pantalla puede anunciar (WCAG 4.1.2).

### C4 — `useId()` en lugar de un identificador aleatorio en el campo

**Lo que propuso el agente.** Generar el `id` del input con `Math.random()` cuando no se pasa uno, para poder enlazar el `<label>`.

**Qué hicimos.** `const generado = useId()`.

**Por qué.** Next renderiza en el servidor. Un identificador aleatorio produce un valor en el HTML del servidor y otro distinto al hidratar, lo que rompe la hidratación y desvincula el `<label>` del `<input>`. `useId` existe exactamente para esto: es estable entre servidor y cliente.

### C5 — `headingLevel` obligatorio en la tarjeta, y el tipo prohíbe `h1`

**Lo que propuso el agente.** Renderizar el título de la tarjeta como `<h3>` fijo.

**Qué hicimos.** `headingLevel?: 2 | 3 | 4 | 5 | 6`, con 3 por omisión. El `1` está deliberadamente fuera del tipo.

**Por qué.** El nivel correcto depende de dónde se coloque la tarjeta, y saltarse niveles rompe la navegación por encabezados del lector de pantalla (WCAG 1.3.1). Que `h1` no sea representable fuerza la regla «la página es dueña de su `h1`, no un componente reutilizable».

**Esto encontró un error real.** La primera versión de la pantalla de login escribía `<Card title="Sesión iniciada" headingLevel={1}>`. `tsc` lo rechazó:

```
src/app/login/page.tsx(53,43): error TS2322:
Type '1' is not assignable to type '2 | 3 | 4 | 5 | 6 | undefined'.
```

La corrección no fue ampliar el tipo, sino sacar el `<h1>` de la tarjeta y ponerlo en la página, que es donde pertenece.

### C6 — El error del campo se anuncia solo

**Lo que propuso el agente.** Pintar el mensaje de error en rojo debajo del input.

**Qué hicimos.** El mensaje tiene `id`, el input lo referencia con `aria-describedby`, el input lleva `aria-invalid` y el mensaje lleva `role="alert"`. El asterisco de obligatorio es `aria-hidden` y va acompañado de un `<span class="sr-only"> (obligatorio)</span>`.

**Por qué.** Colocar el texto cerca visualmente no lo conecta con el campo: sin `aria-describedby`, un lector de pantalla enfoca el input y no menciona el error (WCAG 3.3.1). Y un asterisco rojo solo es información por color y forma (WCAG 1.4.1).

### C7 — El botón hamburguesa es un control con nombre y estado

**Lo que propuso el agente.** Un `<button>` con el icono de tres rayas y `onClick`.

**Qué hicimos.** `aria-label` que cambia entre «Abrir» y «Cerrar el menú de navegación», `aria-expanded` ligado al estado y `aria-controls` apuntando al panel por un `useId`. El `<nav>` lleva `aria-label="Principal"`, los enlaces activos `aria-current="page"`, y añadimos un enlace «Saltar al contenido».

**Por qué.** Un botón cuyo contenido es sólo un SVG no tiene nombre accesible: se anuncia como «botón» (WCAG 4.1.2). Y sin `aria-expanded`, quien no ve la pantalla no sabe si el menú está abierto.

### C8 — La rehidratación de sesión no descarta el token ante un fallo de red

**Lo que propuso el agente.** En el efecto de montaje, llamar a `/auth/me` y, en el `catch`, borrar el token.

**Qué hicimos.** Sólo se borra si el error es un `ApiError` con estado 401:

```ts
if (error instanceof ApiError && error.esSesionInvalida) {
  window.sessionStorage.removeItem(CLAVE_TOKEN);
}
```

**Por qué.** `fetch` también falla cuando no hay red o el backend está caído. Con el `catch` genérico, un usuario en el metro con mala cobertura perdía la sesión y tenía que volver a escribir su contraseña. Sólo el servidor puede decidir que un token dejó de valer.

### C9 — El efecto de rehidratación se reescribió como función asíncrona

**Qué pasó.** `npm run lint` falló:

```
src/context/AuthContext.tsx:48:7  error
Calling setState synchronously within an effect can trigger cascading renders
react-hooks/set-state-in-effect
```

El código original hacía `if (!guardado) { setCargando(false); return; }` en el cuerpo del efecto.

**Qué hicimos.** Toda la rehidratación pasó a una función `async rehidratar()` que el efecto invoca, con un único `setCargando(false)` al final.

**Por qué, y qué descartamos.** La alternativa «correcta» aparente —leer `sessionStorage` en el inicializador de `useState`— es peor en Next: el inicializador también corre en el servidor, donde no existe `sessionStorage`, así que el HTML del servidor y el del cliente discreparían. Agrupar la lógica en una función asíncrona resuelve el aviso y, de paso, deja el efecto más legible. No se silenció la regla.

### C10 — `fetch` no lanza excepción con 4xx ni 5xx

**Lo que propuso el agente.** Un envoltorio con `try { const r = await fetch(...); return r.json(); } catch { ... }`.

**Qué hicimos.** `src/services/api.ts` comprueba `respuesta.ok` explícitamente, traduce el cuerpo `{ codigo, mensaje, correlacionId }` del contrato del equipo a una clase `ApiError`, trata el `204` sin cuerpo, deja pasar `AbortError` sin convertirlo en error de red y reserva el `catch` del `fetch` para fallos de red y CORS.

**Por qué.** Es el malentendido más común de `fetch`: sólo rechaza la promesa si la petición no llegó a completarse. Un 403 `SIN_PERMISOS` resuelve con normalidad, así que el código original habría intentado interpretar el cuerpo de error como si fuera un resultado válido.

### C11 — El cliente deja de hablar con otro origen

**Lo que propuso el agente.** `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`, es decir, el navegador llamando directo a Express.

**Qué hicimos.** `next.config.ts` reescribe `/api/v1/*` hacia `BACKEND_URL`, y `NEXT_PUBLIC_API_URL` pasa a ser la ruta relativa `/api/v1`.

**Por qué.** Lo pedía el propio registro de riesgos del Sprint 1: *«Cookies de sesión bloqueadas en Safari para iOS si cliente y API quedan en dominios distintos → Next.js reenvía `/api` a Express para que todo salga del mismo dominio»*. Además, el frontend deja de depender del `cors()` sin restricción del backend, que ya estaba anotado como deuda en `S05_S06_A2/revision_seguridad.md`.

**Verificado.** Con un backend de prueba en el puerto 4000, `GET http://localhost:3005/api/v1/salud` devolvió 200, con la ruta `/api/v1/salud` intacta y la cabecera `X-Correlation-Id` propagada hasta el cliente.

### C12 — `.gitignore` habría excluido un entregable

**Qué encontramos.** El `.gitignore` del scaffold trae `.env*`. Eso ignora también `.env.example`, que es un archivo exigido por la actividad y la única documentación de qué variables necesita el proyecto.

```
$ git check-ignore -v .env.example
frontend/.gitignore:34:.env*	.env.example
```

**Qué hicimos.** Añadimos `!.env.example` después del patrón, y lo comprobamos otra vez.

### C13 — Dos defectos que sólo aparecieron al abrir la página

Verificar con `tsc` y `eslint` no bastó; estos salieron al cargar la aplicación en el navegador:

| Defecto | Señal | Corrección |
|---|---|---|
| Campo de contraseña fuera de un `<form>` | Aviso del DOM en consola: *«Password field is not contained in a form»* | Se envolvieron los campos de muestra en un `<form>` y se añadió `autoComplete` a los tres campos. Sin esto, los gestores de contraseñas no funcionan. |
| El menú móvil se dibujaba al lado de la marca, no debajo | Revisión visual a 390 px de ancho | La regla base `.enlaces { flex: 1 }` impone `flex-basis: 0%`, que gana sobre el `width: 100%` del panel abierto. Se corrigió con `flex: 0 0 100%` y `order` explícito. |

También se cambió un `<button>` que estaba envuelto en un `<p>` por un `<div>`.

## 2bis. Ampliación: el sistema de diseño completo y las 12 pantallas

La actividad pedía cuatro componentes. Después se implementó el archivo de
Figma completo, así que el frontend entregado contiene bastante más:

| Capa | Qué hay |
|---|---|
| Átomos | `Chips.tsx`: chip de estado (7 valores del enum), chip de etiqueta (5 del catálogo), marca de prioridad y chip seleccionable |
| Piezas | `Piezas.tsx`: avatar, aviso de emergencias, casilla, fila de dato y fila de selección de médico |
| Bloques | `Bloques.tsx`: tarjeta de conversación, tarjeta de perfil, pregunta de contexto, los cuatro tipos de evento de la bitácora, resumen de contexto, estado vacío y compositor |
| Armazón | `Shell.tsx`: encabezado móvil, barra inferior, navegación lateral de escritorio y encabezado de escritorio, con el corte en 1024 px |

Las 12 pantallas del diseño están en `src/app/` (la tabla completa está en
`frontend/README.md`). Son responsivas: una sola implementación cubre la
composición móvil y la de escritorio del archivo de Figma.

**Dos divergencias deliberadas respecto a Figma**, ambas por accesibilidad:

1. Los colores corregidos de la sección 2 de `accesibilidad.md` (texto
   secundario, bordes de control y dos chips de estado) se aplican en el
   código. El archivo de Figma conserva los valores originales, así que esos
   cinco usos no coinciden píxel a píxel a propósito.
2. En la pantalla 8 el botón «Enviar» aparece deshabilitado mientras quede una
   pregunta obligatoria sin responder. En el mockup se ve activo, pero pulsarlo
   produciría un 422 `CONVERSACION_INCOMPLETA` garantizado; el banner contiguo
   explica por qué no se puede enviar todavía.

**Un cambio de configuración que hubo que hacer.** `cacheComponents` (el
prerenderizado parcial que activa el scaffold) aborta la compilación en cuanto
un componente de cliente llama a `usePathname()` sin un `<Suspense>` encima. La
navegación marca la pestaña activa con esa función y casi todas las pantallas
son interactivas, así que se desactivó en `next.config.ts` en lugar de envolver
cada pantalla en un `Suspense` para ganar un prerender que aquí no aporta nada.
(`partialPrefetching` depende de él, así que también se quitó.)

## 3. Deuda consciente

1. **El JWT vive en `sessionStorage`, no en una cookie `httpOnly`.** El backend entrega el token en el cuerpo de la respuesta y no emite cookies, así que cerrar el círculo exige un Route Handler de Next que haga de BFF. El proxy de mismo origen (C11) ya deja el camino hecho.
2. **`salir()` sólo limpia el cliente.** El contrato define `DELETE /sesiones/actual` para revocar el `jti` en el servidor, pero esa ruta aún no existe en `backend/`. Hasta entonces, la sesión caduca por inactividad.
3. **No hay pruebas automatizadas de los componentes.** La verificación de esta entrega fue `tsc`, `eslint`, `next build` y revisión manual en navegador a 1200 px y 390 px. Las pruebas corresponden a S09.

## 4. Cómo se verificó

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | Sin errores |
| `npm run lint` | Sin errores ni avisos |
| `npm run build` | Compila; 3 rutas prerenderizadas (`/`, `/login`, `/_not-found`) |
| Consola del navegador en `/` | 0 errores y 0 avisos (sólo los mensajes informativos de React DevTools y HMR, propios del modo desarrollo) |
| Responsivo | Revisado a 1200 px y a 390 px; el menú plegable abre y cierra correctamente (capturas en `evidencia/`) |
| Proxy del API | `GET /api/v1/salud` a través de Next devuelve 200 con la ruta y la cabecera de correlación intactas |
