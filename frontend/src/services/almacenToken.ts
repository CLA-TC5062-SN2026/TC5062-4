/**
 * Único punto donde vive el token de sesión.
 *
 * Ningún servicio ni componente toca `sessionStorage` directamente: si mañana
 * el backend emite una cookie httpOnly, se cambia este archivo y nada más.
 *
 * Por qué `sessionStorage` y no `localStorage`: el token muere al cerrar la
 * pestaña y no se comparte entre pestañas, lo que acota el daño de un XSS.
 * Por qué no una cookie httpOnly, que sería lo correcto: el backend de
 * S05-S06-A2 devuelve el JWT en el cuerpo de la respuesta y no emite cookies.
 * La deuda está documentada en S07_S08_A2/capa_servicios.md.
 */
const CLAVE = 'dafi.accessToken';

type Suscriptor = (token: string | null) => void;
const suscriptores = new Set<Suscriptor>();

/** Copia en memoria: evita leer de sessionStorage en cada petición. */
let enMemoria: string | null = null;
let hidratado = false;

export function leerToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (!hidratado) {
    enMemoria = window.sessionStorage.getItem(CLAVE);
    hidratado = true;
  }
  return enMemoria;
}

export function guardarToken(token: string): void {
  enMemoria = token;
  hidratado = true;
  if (typeof window !== 'undefined') window.sessionStorage.setItem(CLAVE, token);
  suscriptores.forEach((s) => s(token));
}

export function borrarToken(): void {
  enMemoria = null;
  hidratado = true;
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(CLAVE);
  suscriptores.forEach((s) => s(null));
}

/** Avisa cuando la sesión cambia, incluso si la cierra un interceptor. */
export function alCambiarToken(s: Suscriptor): () => void {
  suscriptores.add(s);
  return () => suscriptores.delete(s);
}
