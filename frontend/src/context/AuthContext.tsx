'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError } from '@/services/api';
import { login as loginApi, obtenerCuenta } from '@/services/auth';
import type { Usuario } from '@/services/auth';

/**
 * Estado de sesión de la aplicación.
 *
 * Decisión y su límite conocido: el JWT se guarda en `sessionStorage`, no en
 * una cookie httpOnly. Eso lo deja expuesto a un XSS, pero el backend de
 * S05-S06-A2 entrega el token en el cuerpo de la respuesta y no emite cookies,
 * así que ésta es la integración que el API permite hoy. `sessionStorage` (y no
 * `localStorage`) acota el daño: el token muere al cerrar la pestaña y no se
 * comparte entre pestañas.
 *
 * El paso correcto es un Route Handler de Next que haga de BFF, reciba el token
 * y lo reemita como cookie httpOnly + SameSite=Strict. Queda documentado como
 * deuda en S07_S08_A1/revision_componentes.md.
 */

const CLAVE_TOKEN = 'dafi.accessToken';

interface EstadoAuth {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  entrar: (correo: string, contrasena: string) => Promise<Usuario>;
  salir: () => void;
}

const AuthContext = createContext<EstadoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al montar, intenta rehidratar la sesión. `obtenerCuenta` vuelve a consultar
  // la BD, así que un token revocado o caducado por inactividad se detecta aquí
  // y no cuando el usuario intenta hacer algo.
  useEffect(() => {
    const control = new AbortController();

    // Toda la rehidratación vive en una función async: así ninguna actualización
    // de estado ocurre de forma síncrona en el cuerpo del efecto, que es lo que
    // provoca renders en cascada (regla react-hooks/set-state-in-effect).
    async function rehidratar() {
      const guardado = window.sessionStorage.getItem(CLAVE_TOKEN);

      if (guardado) {
        try {
          const cuenta = await obtenerCuenta(guardado, control.signal);
          setUsuario(cuenta);
          setToken(guardado);
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          // Sólo se descarta el token si el servidor dice que no vale. Ante un
          // fallo de red se conserva para no expulsar al usuario por un bache.
          if (error instanceof ApiError && error.esSesionInvalida) {
            window.sessionStorage.removeItem(CLAVE_TOKEN);
          }
        }
      }

      setCargando(false);
    }

    void rehidratar();

    return () => control.abort();
  }, []);

  const entrar = useCallback(async (correo: string, contrasena: string) => {
    const respuesta = await loginApi(correo, contrasena);
    window.sessionStorage.setItem(CLAVE_TOKEN, respuesta.accessToken);
    setToken(respuesta.accessToken);
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  }, []);

  const salir = useCallback(() => {
    // El contrato define DELETE /sesiones/actual para revocar el jti en el
    // servidor, pero ese endpoint aún no está implementado en backend/: por
    // ahora el cierre es sólo local y la sesión caduca sola por inactividad.
    window.sessionStorage.removeItem(CLAVE_TOKEN);
    setToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo<EstadoAuth>(
    () => ({ usuario, token, cargando, entrar, salir }),
    [usuario, token, cargando, entrar, salir]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return contexto;
}
