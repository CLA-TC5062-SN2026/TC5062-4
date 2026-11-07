# S07-S08-A2 — Integración Frontend-Backend

**Equipo 4 · DAFI** · Trimestral Sep–Dic 2026

## Contenido

| Archivo | Qué es |
|---|---|
| `capa_servicios.md` | Parte 1. Decisiones de diseño de la capa de servicios |
| `flujo_auth.mp4` | Parte 2. Login real y ruta protegida (16.0 s) |
| `flujo_e2e.mp4` | Parte 3. Listado de perfiles con carga, error y recuperación (15.4 s) |
| `evidencia/error_sweetalert.png` | El diálogo de error con el esqueleto de carga detrás |
| `evidencia/perfiles_datos_reales.png` | Los tres perfiles servidos por PostgreSQL |

El código está en `frontend/src/services/` y en las pantallas que lo consumen.

## Qué muestran los vídeos

**`flujo_auth.mp4`** — todo contra el backend de Express y PostgreSQL:

1. Se abre `/perfiles` sin sesión y la ruta protegida redirige a `/entrar`.
2. Se escriben las credenciales reales.
3. `POST /api/v1/auth/login` devuelve el JWT; el botón pasa a «Entrando…».
4. Redirección a `/perfiles` según el `pantallaInicio` que indica el backend.
5. Se visitan otras rutas protegidas, ya autenticado: ahora sí entran.

**`flujo_e2e.mp4`** — `GET /api/v1/familias/{familiaId}/perfiles`:

1. La lista carga con datos reales de la base.
2. Con la red limitada, el esqueleto de carga queda a la vista y luego llegan los datos.
3. Con la red caída, el error se presenta en un diálogo con mensaje específico.
4. Al volver la red, «Reintentar» recupera los datos.

La lentitud y la caída **no son simuladas con temporizadores**: se aplican con `Network.emulateNetworkConditions` del protocolo de DevTools, así que la petición es real y el estado de carga es el que vería alguien con mala cobertura.

Los vídeos se grabaron conduciendo un navegador real con Playwright, que captura el área de la página. Los guiones están en el scratchpad de la sesión; se pueden volver a ejecutar contra cualquier instalación local.

## Cómo comprobarlo

Las instrucciones completas están en la sección 8 de `capa_servicios.md`. En corto:

```bash
docker run -d --name dafi-postgres \
  -e POSTGRES_USER=dafi -e POSTGRES_PASSWORD=dafi_local_dev -e POSTGRES_DB=dafi \
  -p 5434:5432 postgres:16
# importar esquema y seeds, crear backend/.env
cd backend && npm ci && npm run dev
node scripts/seed_integracion_demo.mjs
cd ../frontend && npm ci && npm run dev
```

Credenciales de prueba, sólo local y con datos ficticios:
`maria.ruan@correo.com` / `DafiDemo2026!`

## Verificaciones

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | Sin errores |
| `npm run lint` | Sin errores ni avisos |
| `npm run build` | Compila; 22 rutas |
| `GET /api/v1/salud` a través del proxy de Next | `{"estado":"ok","baseDatos":"ok"}` |
| Login a través del proxy | Devuelve JWT y usuario con su `familiaId` |
| `GET /familias/{id}/perfiles` con token | Tres perfiles reales de PostgreSQL |
| La misma ruta **sin** token | 401, como debe |
| Ruta protegida sin sesión en el navegador | Redirige a `/entrar` |
