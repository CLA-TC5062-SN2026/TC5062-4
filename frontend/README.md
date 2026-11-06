# DAFI — Frontend (S07-S08-A1)

Cliente web de DAFI construido con **Next.js (App Router), React y TypeScript**, con **CSS Modules** para los estilos. Consume el API REST de `backend/` (S05-S06-A2).

> **Uso exclusivamente académico con datos ficticios.** DAFI no diagnostica, no evalúa la urgencia de ningún caso y no verifica credenciales médicas.

## Requisitos

- Node.js 20 o superior (probado con Node 24)
- El backend de `backend/` corriendo, si se quiere iniciar sesión de verdad

## Instalación

```bash
cd frontend
npm ci
cp .env.example .env.local
```

`.env.local` no se versiona. Variables:

| Variable | Para qué sirve | Valor por omisión |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Ruta base del API **tal como la ve el navegador**. Es relativa a propósito. | `/api/v1` |
| `BACKEND_URL` | Dirección real de Express. Sólo la usa el servidor de Next al reescribir. | `http://localhost:4000` |
| `NEXT_PUBLIC_APP_NAME` | Nombre que muestra la barra de navegación. | `DAFI` |

Todo lo que lleva el prefijo `NEXT_PUBLIC_` acaba dentro del bundle que descarga el navegador: **nunca ponga un secreto ahí**.

## Ejecutar

```bash
npm run dev     # servidor de desarrollo en http://localhost:3000
npm run build   # compilación de producción
npm run lint    # ESLint
npx tsc --noEmit  # comprobación de tipos
```

Si el puerto 3000 está ocupado, Next elige el siguiente libre y lo anuncia en la terminal.

## Mismo origen para cliente y API

`next.config.ts` reescribe `/api/v1/*` hacia `BACKEND_URL`, así que el navegador sólo habla con su propio origen. Esto evita las peticiones de origen cruzado (y la dependencia del `cors()` abierto del backend) y deja listo el camino para mover el JWT a una cookie `httpOnly`. Viene del registro de riesgos del Sprint 1: *«Cookies de sesión bloqueadas en Safari para iOS si cliente y API quedan en dominios distintos»*.

## Estructura

```
frontend/
├── .env.example
├── next.config.ts          # reescritura /api/v1 -> backend
└── src/
    ├── app/
    │   ├── globals.css     # tokens + escala tipográfica de Figma
    │   ├── layout.tsx      # lang="es", Inter + Roboto Mono, AuthProvider
    │   ├── entrar/ crear-cuenta/ sesion-expirada/     # pantallas 1-3
    │   ├── perfiles/ perfiles/nuevo/ perfiles/[perfilId]/
    │   │   └── conversaciones/nueva/                  # pantallas 4-7
    │   ├── conversaciones/ borrador/ [conversacionId]/  # pantallas 8-9
    │   ├── medico/bandeja/ conversaciones/ sin-acceso/  # pantallas 10-12
    │   └── componentes/    # catálogo de los componentes base
    ├── components/
    │   ├── ui/             # Button, Input, Card, Navbar, Icono
    │   └── dafi/           # sistema de diseño: Chips, Piezas, Bloques, Shell
    ├── context/AuthContext.tsx
    ├── lib/datos-demo.ts   # contenido ficticio de las pantallas
    └── services/           # api.ts (contrato de errores) y auth.ts
```

## Pantallas

Reproducen el archivo de Figma del equipo. Cada pantalla es responsiva: por
debajo de 1024 px sigue la composición móvil (390 × 844) y por encima la de
escritorio (1440 × 1024), con navegación lateral y vistas a dos columnas.

| Ruta | Pantalla del diseño |
|---|---|
| `/entrar` | 1 · Iniciar sesión (y D1, panel de marca) |
| `/crear-cuenta` | 2 · Crear cuenta con las tres declaraciones |
| `/sesion-expirada` | 3 · Sesión cerrada por inactividad |
| `/perfiles` | 4 · Perfiles de la familia (y D2) |
| `/perfiles/nuevo` | 5 · Nuevo perfil |
| `/perfiles/mateo` | 6 · Perfil e historial (y D3) |
| `/perfiles/mateo/conversaciones/nueva` | 7 · Nueva conversación |
| `/conversaciones/borrador` | 8 · Conversación en BORRADOR (y D4) |
| `/conversaciones/c-ronchas` | 9 · Conversación enviada · bitácora |
| `/medico/bandeja` | 10 · Bandeja del médico (y D5) |
| `/medico/conversaciones/c-ronchas` | 11 · Conversación vista del médico (y D6) |
| `/medico/sin-acceso` | 12 · Acceso retirado (404) |
| `/componentes` | Catálogo de los cuatro componentes base |

Las pantallas usan datos ficticios de `src/lib/datos-demo.ts`. La única que
habla hoy con el backend es `/entrar` (`POST /api/v1/auth/login`).

## Sistema de diseño

Los tokens de `globals.css` son los mismos valores que la colección «DAFI Tokens» del archivo de Figma del equipo, para que diseño y código no se separen. Varios se corrigieron tras la auditoría de contraste; el detalle está en `../S07_S08_A1/accesibilidad.md` y la medición se reproduce con:

```bash
node ../S07_S08_A1/evidencia/contraste.mjs
```

## Rutas

| Ruta | Qué hay |
|---|---|
| `/` | Catálogo de los cuatro componentes con sus variantes y estados |
| `/login` | Inicio de sesión real contra `POST /api/v1/auth/login` |

## Estado actual

Esta entrega cubre el andamiaje y los cuatro componentes base. Las pantallas de producto (perfiles, conversaciones, bandeja del médico) están diseñadas en Figma pero todavía no implementadas.
