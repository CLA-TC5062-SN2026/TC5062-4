/**
 * Interceptores que se registran una sola vez al arrancar la aplicación.
 * Viven separados del cliente para que éste no dependa ni del almacén del
 * token ni de la navegación.
 */
import { registrarInterceptorError, registrarInterceptorPeticion } from './clienteHttp';
import { borrarToken, leerToken } from './almacenToken';

let instalados = false;

/** Qué hacer cuando el servidor dice que la sesión ya no vale. */
type AlExpirarSesion = () => void;

export function instalarInterceptores(alExpirarSesion: AlExpirarSesion): void {
  if (instalados) return;
  instalados = true;

  // Petición: adjunta el JWT salvo en las rutas públicas.
  registrarInterceptorPeticion((config) => {
    if (config.publica) return config;
    const token = leerToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Respuesta: un 401 significa que el servidor revocó la sesión (caducó por
  // inactividad, se cerró, o el token dejó de ser válido). Se limpia aquí, una
  // sola vez, en vez de que cada pantalla tenga que acordarse de hacerlo.
  registrarInterceptorError((error) => {
    if (error.esSesionInvalida) {
      borrarToken();
      alExpirarSesion();
    }
  });
}
