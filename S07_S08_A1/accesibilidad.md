# Evaluación de accesibilidad: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4** · **Actividad:** S07-S08-A1, Parte 3
**Referencia:** W3C, *Web Content Accessibility Guidelines (WCAG) 2.1*, nivel AA
**Fecha:** 5 de noviembre de 2026

---

## 1. Alcance y método

Se evaluaron los cuatro componentes de la Parte 2 (botón, campo de entrada, tarjeta y barra de navegación) y las dos pantallas que los usan (`/` y `/login`).

El contraste **no se estimó a ojo**. Se escribió `evidencia/contraste.mjs`, que implementa la fórmula de luminancia relativa y razón de contraste de WCAG 2.1 y evalúa los 24 pares color-sobre-color que los componentes usan realmente. Se ejecuta con:

```bash
node S07_S08_A1/evidencia/contraste.mjs
```

El script imprime dos pasadas (antes y después de las correcciones) y devuelve código de salida distinto de cero si queda algún incumplimiento. La salida completa está en `evidencia/contraste_salida.txt`.

El resto de los criterios se revisó leyendo el árbol de accesibilidad generado y navegando con teclado.

## 2. Resultado de la auditoría de contraste

**7 de 24 pares incumplían.** Umbrales de WCAG 2.1 AA: **4.5:1** para texto normal (1.4.3) y **3.0:1** para texto grande y para los límites de componentes de interfaz (1.4.11).

| Par | Token sobre fondo | Medido | Mínimo | Criterio |
|---|---|---:|---:|---|
| Campo · marcador de posición | `ink/500` sobre `ink/0` | 3.57:1 | 4.5:1 | 1.4.3 |
| Tarjeta · texto secundario | `ink/500` sobre `ink/0` | 3.57:1 | 4.5:1 | 1.4.3 |
| Campo · borde en reposo | `ink/300` sobre `ink/0` | 1.59:1 | 3.0:1 | 1.4.11 |
| Botón secundario · borde | `ink/300` sobre `ink/0` | 1.59:1 | 3.0:1 | 1.4.11 |
| Navbar · borde del botón de menú | `ink/300` sobre `ink/0` | 1.59:1 | 3.0:1 | 1.4.11 |
| Chip `INFO_SOLICITADA` | `#B45309` sobre `#FDF0DC` | 4.47:1 | 4.5:1 | 1.4.3 |
| Chip `CON_INDICACIONES` | `#15803D` sobre `#E2F5E9` | 4.41:1 | 4.5:1 | 1.4.3 |

Los dos últimos merecen una nota: fallan **por tres y nueve centésimas**. Es justo el tipo de incumplimiento que una revisión visual nunca detecta y que sólo aparece al medir.

## 3. Correcciones aplicadas

Las tres primeras son las más críticas, porque afectan a texto que el usuario necesita leer y a los límites de los controles de formulario.

### Corrección 1 — Texto secundario: `ink/500` → `ink/600` (WCAG 1.4.3)

**Problema.** `ink/500` (`#7B8A91`) daba **3.57:1** sobre blanco, por debajo del 4.5:1 exigido. Afectaba al marcador de posición de todos los campos y al texto secundario de las tarjetas: con fondo blanco, el texto que explica qué escribir era el menos legible de la pantalla.

**Corrección.** `ink/600` (`#5C6B73`), que da **5.52:1**. En `Input.module.css`:

```css
.input::placeholder {
  color: var(--color-ink-600);
  opacity: 1; /* Firefox le baja la opacidad por defecto y arruina el contraste */
}
```

La declaración `opacity: 1` es parte de la corrección: Firefox aplica una opacidad reducida al marcador de posición, lo que degradaría el contraste incluso con el color correcto.

`ink/500` no se eliminó del sistema de tokens, pero queda marcado en `globals.css` con un comentario que restringe su uso a bordes e iconos, **nunca a texto**.

### Corrección 2 — Bordes de controles: `ink/300` → `ink/500` (WCAG 1.4.11)

**Problema.** `ink/300` (`#C3CFD4`) daba **1.59:1** sobre blanco. El criterio 1.4.11 (*Non-text Contrast*) exige 3:1 para «la información visual necesaria para identificar componentes de interfaz». En un campo de texto sin relleno de color, **el borde es lo único que indica dónde se puede escribir**; a 1.59:1 el campo es prácticamente invisible con poca luz o en una pantalla con brillo bajo.

**Corrección.** `ink/500` (`#7B8A91`), que da **3.57:1**. Aplicado al borde del campo, al del botón secundario y al del botón de menú.

Es el mismo token que se acaba de prohibir para texto. No es contradicción: el umbral de un borde es 3:1 y el de un texto 4.5:1, y `ink/500` cumple uno y no el otro. Está anotado así en `globals.css`.

### Corrección 3 — Chips de estado: oscurecer el primer plano (WCAG 1.4.3)

**Problema.** Dos de los siete chips de estado de conversación se quedaban a centésimas del umbral.

**Corrección.** Se oscureció sólo el color de texto, conservando el fondo para no alterar la identidad visual de cada estado:

| Token | Antes | Después | Contraste |
|---|---|---|---|
| `estado/info-fg` | `#B45309` | `#92400E` | 4.47:1 → **6.30:1** |
| `estado/indicaciones-fg` | `#15803D` | `#166534` | 4.41:1 → **6.27:1** |

### Resultado

```
RESULTADO: 7 incumplimientos antes -> 0 despues.
```

Los 24 pares pasan. El script devuelve 0, así que puede usarse como comprobación en integración continua.

## 4. Problemas de accesibilidad no relacionados con el color

Se encontraron y corrigieron durante la construcción de los componentes.

| # | Problema | Criterio WCAG 2.1 | Corrección |
|---|---|---|---|
| A1 | El scaffold generaba `<html lang="en">` con todo el contenido en español. El lector de pantalla pronunciaría el texto con reglas del inglés. | 3.1.1 Idioma de la página (A) | `lang="es"` en `layout.tsx`. |
| A2 | No existía ninguna regla de foco visible. | 2.4.7 Foco visible (AA) | Anillo único en `globals.css` con `:focus-visible` (`brand/500`, 5.00:1 sobre blanco, por encima del 3:1 de 1.4.11). Se usa `:focus-visible` y no `:focus` para no mostrarlo en clics de ratón. |
| A3 | El botón hamburguesa sólo contenía un SVG: sin nombre accesible, y sin forma de saber si el menú estaba abierto. | 4.1.2 Nombre, función, valor (A) | `aria-label` que alterna entre «Abrir» y «Cerrar el menú de navegación», más `aria-expanded` y `aria-controls`. |
| A4 | El mensaje de error del campo estaba cerca del input, pero no asociado a él. | 3.3.1 Identificación de errores (A) · 1.3.1 Información y relaciones (A) | `aria-describedby` del input hacia el mensaje, `aria-invalid` en el input y `role="alert"` en el mensaje. |
| A5 | El campo obligatorio se indicaba sólo con un asterisco rojo. | 1.4.1 Uso del color (A) | El asterisco pasa a `aria-hidden` y se añade `<span class="sr-only"> (obligatorio)</span>`, además del atributo `required`. |
| A6 | El estado de carga del botón era sólo un spinner girando. | 4.1.2 Nombre, función, valor (A) | `aria-busy` en el botón, `aria-hidden` en el spinner y sustitución del texto visible por `loadingText`. |
| A7 | La navegación se repite en todas las páginas, sin forma de saltarla con teclado. | 2.4.1 Evitar bloques (A) | Enlace «Saltar al contenido» que sólo se hace visible al recibir foco, apuntando a `#contenido`. |
| A8 | Nada distinguía el enlace de la página actual salvo el color de fondo. | 1.4.1 Uso del color (A) | `aria-current="page"` en el enlace activo. |
| A9 | El título de la tarjeta era un `<h3>` fijo, lo que podía saltarse niveles de encabezado. | 1.3.1 Información y relaciones (A) | Prop `headingLevel` (2–6). Detalle en `revision_componentes.md`, cambio C5. |
| A10 | Objetivos táctiles pequeños. | 2.5.5 Tamaño del objetivo (AAA) | Altura mínima de 44 px en botones medianos, campos y enlaces del menú móvil. Supera el 24 px que pide 2.5.8 de WCAG 2.2. |
| A11 | Animaciones sin considerar a quien pide reducirlas. | 2.3.3 Animación por interacciones (AAA) | Bloque `@media (prefers-reduced-motion: reduce)` en `globals.css`. |

## 5. Hallazgo evaluado y descartado

La primera ejecución de la auditoría incluía el borde de la tarjeta (`ink/200` sobre blanco, **1.26:1**), muy por debajo de 3:1. Tras analizarlo **no lo contamos como incumplimiento**, y por eso el par quedó fuera de la lista que evalúa el script.

El criterio 1.4.11 se aplica a «la información visual necesaria para identificar componentes de interfaz y sus estados». Una tarjeta de DAFI no es un control: no recibe foco, no tiene estados y su contenido —título, subtítulo, texto— se entiende perfectamente sin ver el borde, que es una separación decorativa. Subirlo a 3:1 convertiría una interfaz tranquila en una rejilla de cajas marcadas sin ganar nada para nadie.

La excepción es la variante `interactive`: si una tarjeta llega a ser pulsable en su totalidad, pasa a ser un componente de interfaz y su límite sí tendrá que cumplir 3:1. Queda anotado en `Card.module.css`.

## 6. Qué queda pendiente

- **Sin validación con lector de pantalla real.** La revisión se hizo sobre el árbol de accesibilidad y la semántica del marcado, no probando con VoiceOver ni NVDA. Las correcciones son las adecuadas según los criterios, pero no está verificado cómo se anuncian en la práctica.
- **Sin gestión de foco al abrir el menú móvil.** Hoy el foco permanece en el botón hamburguesa. Lo correcto es llevarlo al panel y atraparlo mientras está abierto (patrón de diálogo), y cerrarlo con `Escape`.
- **Sin auditoría automatizada del DOM.** `contraste.mjs` evalúa los tokens, no la página renderizada. Convendría añadir `axe-core` a las pruebas de S09 para detectar problemas que sólo existen una vez compuesta la interfaz.
- **Zoom al 200 %** (1.4.4) no se verificó formalmente. El **reflujo a 320 px** (1.4.10) sí se revisó al regrabar el vídeo: 14 rutas sin desbordes horizontales tras corregir uno de 5 px (detalle en `README.md`).

## 7. Referencias

- W3C. (2023). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
- W3C. (2023). *Understanding Non-text Contrast (1.4.11)*. https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
- WebAIM. *Contrast Checker*. https://webaim.org/resources/contrastchecker/ (se usó para contrastar dos resultados del script)
