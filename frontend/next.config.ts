import type { NextConfig } from "next";

// URL del backend de Express. Es una variable SIN el prefijo NEXT_PUBLIC_
// porque sólo la usa el servidor de Next al reescribir: el navegador nunca
// necesita conocer la dirección real del API.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Los estilos son CSS Modules, que Next.js compila de fábrica: no hace falta
  // ningún loader ni PostCSS extra. (El scaffold traía una regla de Turbopack
  // que pasaba todos los *.css por Tailwind; se eliminó al cambiar de enfoque.)
  // `cacheComponents` (prerenderizado parcial) venía activado por el scaffold.
  // Se desactiva a propósito: la navegación lateral y la barra inferior marcan
  // la pestaña activa con `usePathname()`, que es dinámico por naturaleza, y
  // casi todas las pantallas son interactivas. Con PPR habría que envolver cada
  // pantalla en <Suspense> para ganar un prerender que aquí no aporta nada.
  cacheComponents: false,

  // Mismo origen para cliente y API.
  //
  // El registro de riesgos del Sprint 1 (S03_A2/sprint1_planning.md) ya lo
  // había previsto: «Cookies de sesión bloqueadas en Safari para iOS si cliente
  // y API quedan en dominios distintos → Next.js reenvía /api a Express para
  // que todo salga del mismo dominio».
  //
  // Beneficios concretos aquí y ahora:
  //   1. El navegador no hace peticiones de origen cruzado, así que el frontend
  //      no depende del `cors()` abierto del backend (una deuda ya anotada en
  //      S05_S06_A2/revision_seguridad.md).
  //   2. Deja el camino listo para mover el JWT a una cookie httpOnly sin
  //      cambiar el cliente, porque la cookie sería de primera parte.
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
