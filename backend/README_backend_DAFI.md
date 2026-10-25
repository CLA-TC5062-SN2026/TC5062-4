# DAFI — Backend (S05-S06 A1 y A2)

API REST académica con Node.js, Express (ES Modules) y PostgreSQL. Utiliza el esquema relacional del equipo (`S05_S06_A1/esquema_bd.sql`). La versión actual añade autenticación JWT y control de acceso por roles a los CRUD de A1.

> **Uso exclusivamente local con datos ficticios.** Esta implementación no debe exponerse públicamente ni usarse con información médica real. No implementa todas las operaciones del OpenAPI/SRS.

## Requisitos

- Node.js y npm
- PostgreSQL con la base de datos `dafi`
- Postman para las pruebas
- Archivo `backend/.env` local (no subir a Git)

## Instalación

Desde la carpeta `backend/`:

```bash
npm ci
```

Copia `backend/.env.example` a `backend/.env` y configura los valores reales de tu equipo. Ejemplo local **sin credenciales reales**:

```dotenv
PORT=4000
DB_HOST=localhost
DB_PORT=5434
DB_NAME=dafi
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=PEGA_AQUI_UN_SECRETO_ALEATORIO
JWT_EXPIRATION=30m
MINUTOS_SESION=30
```

Para crear un secreto propio en macOS/Linux, ejecuta `openssl rand -hex 32`. **No utilices** el valor de ejemplo como secreto real. Cada integrante debe usar sus propias credenciales locales. `DEV_USER_ID` ya no se utiliza en A2.

## Preparar la base de datos (instalación inicial)

Desde la raíz del repositorio, una vez creada la base de datos `dafi`:

```bash
psql -X -h localhost -p 5434 -U your_user -d dafi -v ON_ERROR_STOP=1 -f S05_S06_A1/esquema_bd.sql
```

**No repitas la importación si las tablas ya existen.** El puerto `5434` es el del entorno de desarrollo utilizado para la actividad; otros integrantes deben ajustarlo a su instalación.

### Datos ficticios para pruebas (solo local)

Desde la raíz del repositorio:

```bash
psql -X -h localhost -p 5434 -U your_user -d dafi -v ON_ERROR_STOP=1 -f backend/scripts/seed_demo.sql
psql -X -h localhost -p 5434 -U your_user -d dafi -v ON_ERROR_STOP=1 -f backend/scripts/seed_auth_demo.sql
```

Luego, dentro de `backend/`:

```bash
node scripts/seed_medico_demo.mjs
```

El primer script prepara los registros ficticios para A1; el segundo, un aviso ficticio para registro en A2; el tercero, credenciales de un médico de prueba. Utilízalos únicamente con una base local de pruebas.

## Ejecutar la API

Desde `backend/`:

```bash
npm run dev
```

Servidor esperado: `http://localhost:4000` (prefijo de API: `/api/v1`).

## Pruebas A1 — CRUD sin seguridad (evidencia histórica)

La colección `backend/postman/DAFI_A1.postman_collection.json` contiene el flujo de A1:

1. POST perfil → **201**.
2. GET perfil recién creado → **200** (persistencia).
3. PATCH perfil → **200**.
4. POST conversación → **201**.
5. DELETE conversación → **204**.

**Importante:** este flujo se grabó sobre la versión A1 (antes de JWT). En la versión A2 actual, los CRUD requieren autenticación y permisos.

## Pruebas A2 — JWT y roles

Importa `backend/postman/DAFI_A2.postman_collection.json` en Postman.

**Antes de grabar:** ejecuta «PREPARACIÓN antes de grabar: login médico demo» y verifica que `doctorToken` tenga un valor. Si está vacío, el paso del médico devolverá 401 en lugar de 403.

Ejecuta las peticiones 1–6 en orden:

1. POST `/api/v1/auth/register` → **201**.
2. POST `/api/v1/auth/login` → **200**, token JWT.
3. GET `/api/v1/auth/me` con token → **200**.
4. POST perfil con token del cuidador principal → **201**.
5. Misma petición sin token → **401**.
6. Misma petición con token del médico → **403**.

Ejecuta además «EXTRA. Token adulterado» → **401**.

La evidencia escrita es `S05_S06_A2/revision_seguridad.md`: completar los resultados **realmente obtenidos** y las pruebas de terminal requeridas por la actividad.

## Videos y entregables

- **A1:** `S05_S06_A1/pruebas_postman.mp4` (máximo 1 minuto, continuo, al menos cinco endpoints y persistencia POST→GET).
- **A2:** `S05_S06_A2/pruebas_auth.mp4` (máximo 1 minuto, continuo, flujo 201→200→200→201→401→403).
- La entrega a Canvas se realiza con el ZIP de la carpeta solicitada por la actividad; el código queda en `backend/` del repositorio del equipo.

## Seguridad y límites

- Nunca subas `.env`, contraseñas reales, tokens JWT ni datos personales reales a Git.
- El archivo `.env.example` utiliza solamente marcadores de posición.
- `bcryptjs` protege contraseñas y `jsonwebtoken` firma/verifica JWT con expiración; las rutas protegidas utilizan identidad y roles validados contra la base de datos.
- Las credenciales de médico incluidas en los scripts son **exclusivamente ficticias**; no deben reutilizarse en otros ambientes.
- Para uso fuera del entorno académico hacen falta controles adicionales (TLS, CORS restringido, limitación de intentos, pruebas automatizadas, etc.).
