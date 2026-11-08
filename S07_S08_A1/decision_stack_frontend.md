# Decisión del stack de frontend: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S07-S08-A1, Parte 0
**Fecha:** 5 de noviembre de 2026

---

## 1. Stack elegido

| Capa | Elección | Versión instalada |
|---|---|---|
| Framework / librería de UI | **Next.js (App Router) con React** | Next 16.4.5 · React 19.3.0 |
| Lenguaje | **TypeScript** | 5.x |
| Construcción y servidor de desarrollo | **Turbopack**, el que trae Next de fábrica | incluido en Next 16 |
| Estilos | **CSS Modules** sobre custom properties de CSS | nativo de Next, sin dependencias |
| Manejo de estado | **Estado local de React + un Context para la sesión** | sin librería adicional |

El proyecto vive en `frontend/`. Arranca con `npm run dev` y no necesita PostCSS, Babel ni ningún plugin de estilos.

## 2. Cómo se tomó la decisión

Dos de las cuatro capas **no estaban realmente abiertas a discusión**, y conviene decirlo antes de simular una deliberación que no ocurrió:

- El SRS de equipo v3.0 fija en su sección 2.4 (restricciones tecnológicas) «**Next.js en el frontend**, Node.js con Express en el backend». Es una restricción del proyecto, no una preferencia.
- Los tres ADR individuales de S04-A1 (Francisco, Isaac y Daniel) llegaron por separado al mismo estilo: «cliente-servidor con la API como monolito modular… **Next.js como cliente** y una sola API Express» (`S05_S06_A1/diferencias_diseno.md`, sección 3).
- El Sprint Planning del Sprint 1 ya había presupuestado la tarea «Esqueleto del cliente — **Next.js** con diseño base para 360 px y cliente HTTP con identificador de correlación (1.5 h)».

Lo que sí se decidió en esta actividad fue **el enfoque de estilos y el manejo de estado**, y confirmar que Next.js sigue siendo adecuado ahora que el backend existe y ya sabemos cómo se comporta.

Para las dos opciones que quedaron realmente en disputa (Tailwind CSS frente a CSS Modules) se le pidió al agente que las evaluara contra las características concretas del proyecto. Su recomendación inicial fue Tailwind; el equipo eligió CSS Modules. El razonamiento está en la sección 3.2 y la consecuencia práctica fue que hubo que desmontar la configuración de Tailwind que el scaffold había instalado por omisión (ver `revision_componentes.md`, cambio C1).

## 3. Alternativas consideradas y por qué se descartaron

### 3.1 Framework de UI

| Alternativa | Por qué no |
|---|---|
| **React + Vite** | Es el stack con el que más cómodo está el equipo y arranca más rápido. Se descarta porque obliga a resolver a mano dos cosas que Next ya trae y que el proyecto necesita: el enrutado por archivos y, sobre todo, un servidor propio capaz de reenviar `/api` al backend. Ese reenvío no es un lujo: el registro de riesgos del Sprint 1 lo exige (sección 3.4). |
| **Vue 3 + Vite** | Ningún integrante lo ha usado en el posgrado y no hay ninguna ventaja que compense la curva de aprendizaje a mitad del curso. Contradice además la restricción 2.4 del SRS. |
| **Angular** | Es el framework más pesado de los candidatos para una aplicación de ~18 pantallas. Su ventaja (estructura impuesta y DI) importa en equipos grandes y rotativos; aquí somos cuatro personas durante doce semanas. |
| **Svelte + Vite** | Muy buen rendimiento y menos código, pero el ecosistema de componentes accesibles es más delgado y nadie del equipo lo ha usado en producción. El riesgo no se paga con el tamaño del proyecto. |
| **JavaScript vanilla + Fetch** | DAFI tiene estado compartido real (sesión, lista de perfiles, hilo de eventos que cambia de estado) y un flujo de formularios con validación. Hacerlo a mano significa reinventar el renderizado por diferencias. Se descarta por costo de mantenimiento. |

### 3.2 Enfoque de estilos — la decisión de fondo de esta actividad

| Alternativa | Por qué no |
|---|---|
| **Tailwind CSS** | Fue la recomendación del agente y la opción por omisión del scaffold. Se descarta por una razón concreta: el sistema de diseño del equipo **ya existe** como una colección de 55 variables en Figma, y esas variables se trasladan uno a uno a custom properties de CSS. Con Tailwind habría que volver a expresarlas en `@theme`, y a partir de ahí existirían dos fuentes de verdad (la colección de Figma y la configuración de Tailwind) que hay que mantener sincronizadas a mano. El segundo motivo es de legibilidad en revisión: un botón con doce clases de utilidad es más difícil de revisar en un pull request que una regla `.primario` con tres declaraciones. |
| **Bootstrap** | Trae sus propios componentes y su propia estética. DAFI tiene un sistema de diseño propio ya dibujado; adoptar Bootstrap significaría sobrescribir casi todo lo que aporta. |
| **CSS-in-JS (styled-components, Emotion)** | Añade trabajo en tiempo de ejecución y fricción con los Server Components de Next 16. No hay nada en DAFI que necesite estilos calculados en tiempo de ejecución. |
| **CSS global puro** | Sin ámbito local, los nombres de clase colisionan en cuanto hay más de unos pocos componentes. Es justo lo que CSS Modules resuelve sin añadir nada. |

**Lo que estamos aceptando a cambio.** CSS Modules no evita que alguien escriba `color: #7B8A91` en lugar de `var(--color-ink-600)`. Tailwind sí lo haría, porque el token es la única forma de expresar el estilo. La contramedida es doble: la auditoría de contraste (`evidencia/contraste.mjs`) está escrita contra los nombres de token, y la revisión de código debe rechazar colores literales. Si el equipo crece o aparecen colores sueltos en varias ramas, esta decisión merece revisarse.

### 3.3 Manejo de estado

| Alternativa | Por qué no |
|---|---|
| **Redux Toolkit** | Resuelve estado global complejo y compartido entre muchas vistas. En DAFI casi todo el estado es *estado del servidor* (perfiles, conversaciones, eventos) que se pide por pantalla; el único estado verdaderamente global es la sesión. Redux sería andamiaje sin carga. |
| **Zustand** | Más ligero que Redux y una opción razonable. Se descarta porque para un único objeto de sesión, el Context de React hace lo mismo sin sumar una dependencia. |
| **TanStack Query** | Es la que más nos tienta para una fase posterior: cacheo, reintentos y revalidación del estado del servidor. Hoy no hay suficientes pantallas que compartan datos como para justificarlo. Queda anotado como candidato para cuando se implementen la bandeja y el historial. |

**Elección:** `useState` local y un `AuthProvider` basado en Context para `usuario` y `token`. Si el árbol de estado crece más allá de la sesión, se reevalúa con TanStack Query.

### 3.4 Integración con el backend: por qué Next decide la arquitectura y no sólo la sintaxis

Esta es la razón que más peso tuvo para no reemplazar Next por React + Vite.

El backend de S05-S06-A2 autentica con **JWT en la cabecera `Authorization: Bearer`** y revoca la sesión del lado del servidor tras 30 minutos de inactividad (`MINUTOS_SESION`). El cliente tiene que guardar ese token en algún sitio, y las dos opciones son:

1. **Almacenamiento del navegador** (`sessionStorage`). Funciona con cualquier framework, pero el token queda al alcance de cualquier XSS.
2. **Cookie `httpOnly`**, inaccesible desde JavaScript. Es lo correcto, y exige que un servidor intermedio reciba el token y lo reemita como cookie.

El equipo ya había identificado este eje en el Sprint 1, por otro motivo: *«Cookies de sesión bloqueadas en Safari para iOS si cliente y API quedan en dominios distintos → Next.js reenvía `/api` a Express para que todo salga del mismo dominio»*. Un frontend puramente estático no puede hacer ese reenvío; Next sí.

**Lo que ya está implementado:** `next.config.ts` reescribe `/api/v1/*` hacia `BACKEND_URL`, de modo que el navegador sólo habla con su propio origen. Dos consecuencias inmediatas: el frontend deja de depender del `cors()` abierto del backend (deuda registrada en `S05_S06_A2/revision_seguridad.md`, sección 5), y el camino a la cookie `httpOnly` queda despejado porque sería una cookie de primera parte.

**Lo que todavía no:** el token sigue guardándose en `sessionStorage`. El backend actual devuelve el JWT en el cuerpo de la respuesta y no emite cookies, así que cerrar el círculo exige un Route Handler de Next que haga de BFF. Está documentado como deuda en `revision_componentes.md`, sección «Deuda consciente».

### 3.5 Complejidad de la interfaz que hay que construir

El diseño del equipo en Figma tiene **18 pantallas** (12 móviles de 390 × 844 y 6 de escritorio de 1440 × 1024) y un sistema de **22 componentes** con variantes. Tres consecuencias para la elección:

- **El enrutado por archivos de Next** mapea directo contra esas pantallas, sin tabla de rutas que mantener.
- **El mismo componente sirve en móvil y escritorio** cambiando sólo el contenedor: por eso los cuatro componentes de esta entrega aceptan `fullWidth`, `size` y `padding` en lugar de tener medidas fijas.
- **La interfaz es mayoritariamente interactiva** (formularios, estados de carga, menú plegable), así que la mayoría de los componentes son de cliente. Los Server Components de Next aportan poco hoy, pero no estorban, y ayudarán cuando las pantallas de lectura (historial, bandeja) se rendericen en el servidor.

## 4. Consecuencias y riesgos asumidos

| Consecuencia | Mitigación |
|---|---|
| Next 16 y React 19 son versiones muy recientes; parte de la documentación y de las respuestas del agente corresponde a versiones anteriores. | Se verificó todo contra el proyecto real: `npm run build`, `tsc --noEmit` y `eslint` pasan en limpio, y la aplicación se cargó en el navegador sin errores de consola. |
| CSS Modules no obliga a usar los tokens. | Auditoría de contraste automatizada por nombre de token y revisión de código que rechaza colores literales. |
| El token sigue en `sessionStorage`. | Riesgo acotado: muere al cerrar la pestaña, el backend revoca por inactividad y el proxy de mismo origen ya deja listo el cambio a cookie `httpOnly`. |
| Sin librería de estado del servidor, cada pantalla pedirá sus datos por su cuenta. | Aceptable con las pantallas actuales; se reevalúa con TanStack Query al construir bandeja e historial. |

## 5. Referencias

- IEEE Computer Society. (2024). *Guide to the Software Engineering Body of Knowledge (SWEBOK) v4.0a*, Chapter 4: Software Construction. IEEE.
- Norman, D. A. (2013). *The design of everyday things* (edición revisada y ampliada). Basic Books.
- W3C. (2023). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21/
- Documentos propios del equipo: `S03_A1/SRS_equipo.md` (§2.4), `S03_A2/sprint1_planning.md` (§riesgos), `S05_S06_A1/arquitectura_equipo.md` y `S05_S06_A2/revision_seguridad.md`.
