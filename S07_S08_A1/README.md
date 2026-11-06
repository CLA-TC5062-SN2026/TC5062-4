# S07-S08-A1 — Generación de Componentes Frontend

**Equipo 4 · DAFI** · Trimestral Sep–Dic 2026

## Contenido de esta carpeta

| Archivo | Qué es |
|---|---|
| `decision_stack_frontend.md` | Parte 0. Stack elegido, alternativas descartadas y justificación |
| `scaffolding.mp4` | Parte 1. Grabación de pantalla de 18.8 s: arranque del proyecto y app cargando con la consola limpia |
| `revision_componentes.md` | Parte 2. Qué se cambió del código del agente y por qué |
| `accesibilidad.md` | Parte 3. Auditoría WCAG 2.1 AA y correcciones |
| `evidencia/contraste.mjs` | Auditoría de contraste ejecutable, sin dependencias |
| `evidencia/contraste_salida.txt` | Salida de la auditoría: 7 incumplimientos → 0 |
| `evidencia/componentes_escritorio.png` | Catálogo de componentes a 1200 px |
| `evidencia/componentes_movil.png` | El mismo catálogo a 390 px |
| `evidencia/componentes_movil_menu.png` | Menú plegable abierto en móvil |
| `evidencia/componentes_tableta.png` | Pantalla de perfiles a 834 px, tras corregir el comportamiento responsivo |
| `evidencia/componentes_movil_seccion.png` | Sección aún sin construir, con la barra inferior anclada al borde |
| `evidencia/consola_capturada.json` | Mensajes de consola capturados durante la grabación del vídeo |

El código del frontend está en `frontend/`, fuera de esta carpeta, como pide la actividad.

## Sobre `scaffolding.mp4`

**Grabación de pantalla real.** Duración 19.5 s (el límite son 20 s) · 1600 × 1000 · H.264 · 297 KB.

| Tramo | Qué se ve |
|---|---|
| 0–6 s | Ventana de Terminal: `cd .../frontend && npm run dev` y la salida de Next.js 16.4.5 (Turbopack), `Local: http://localhost:3000`, `✓ Ready in 318 ms` |
| 6–13 s | Chrome a **1600 px** en `localhost:3000/perfiles`: composición de escritorio (navegación lateral, rejilla de perfiles, círculo médico) con las DevTools acopladas abajo en **Console** — dos mensajes informativos y los indicadores **«No issues»** y 0 errores |
| 13–19 s | Chrome a **400 px** en la misma ruta: composición móvil (encabezado, tarjetas apiladas, acción a todo lo ancho y barra inferior de pestañas) |

El tercer tramo no es una emulación de dispositivo: es una ventana de Chrome realmente estrecha, así que el corte de 1024 px del CSS se dispara de verdad. Al fondo queda la ventana de Terminal con el registro del servidor, que sigue respondiendo `GET /perfiles 200` mientras tanto.

Se grabó con `screencapture` sobre una región fija de 1600 × 1000 px que contiene sólo las ventanas de Terminal y de Chrome, para no capturar el resto del escritorio. Chrome se lanzó con un perfil temporal y aislado (`--user-data-dir`), sin extensiones ni sesión personal.

En la franja superior de las DevTools aparece un aviso de Chrome ofreciendo traducirlas al español. Es una notificación del navegador, ajena al proyecto, y no tapa la consola.

### Comprobaciones que acompañan al vídeo

Antes de grabar se verificó, de forma automatizada y sobre el servidor de desarrollo real:

- **Consola, sobre el build de producción:** 20 rutas × 2 anchos = 40 cargas, **0 errores y 0 avisos**. Se mide en producción y esperando al prefetch a propósito: en desarrollo Next no precarga los enlaces, y eso ocultaba cinco pestañas que apuntaban a rutas inexistentes y devolvían 404.
- **Panel «Issues» de Chrome:** 14 rutas, **0 incidencias**. La primera pasada encontró una (`FormEmptyIdAndNameAttributesForInputError`: el buscador del encabezado de escritorio era un `<input>` sin `id` ni `name`) y se corrigió antes de grabar.
- **Comportamiento responsivo:** 14 rutas × 8 anchos (320, 390, 540, 768, 834, 1024, 1180 y 1440 px) = 112 cargas, **sin desbordes horizontales y sin líneas de texto por encima de 95 caracteres**. La primera pasada encontró 27 líneas largas en la franja de tableta y un desborde de 5 px a 320 px (WCAG 1.4.10).

## Verificaciones hechas sobre el código entregado

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | Sin errores |
| `npm run lint` | Sin errores ni avisos |
| `npm run build` | Compila; 17 rutas |
| Consola del navegador | 30 cargas (15 rutas × 2 anchos): 0 errores, 0 avisos |
| Panel «Issues» de Chrome | 14 rutas: 0 incidencias |
| Responsivo | Revisado a 390 px y 1440 px contra las composiciones de Figma |
| Proxy del API | `/api/v1/salud` a través de Next devuelve 200 con la ruta y `X-Correlation-Id` intactos |
| `node evidencia/contraste.mjs` | 24 pares, 0 incumplimientos (código de salida 0) |
