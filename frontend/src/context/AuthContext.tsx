'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { ApiError } from '@/services/errores';
import { instalarInterceptores } from '@/services/interceptores';
import { alCambiarToken, leerToken } from '@/services/almacenToken';
import { cerrarSesion, login as loginApi, obtenerCuenta, RUTA_INICIO } from '@/services/authService';
import type { Usuario } from '@/services/authService';

interface EstadoAuth {
  usuario: Usuario | null;
  /** true mientras se comprueba si hay una sesión válida al cargar la página. */
  comprobando: boolean;
  entrar: (correo: string, contrasena: string) => Promise<Usuario>;
  salir: () => void;
  /** Ruta de inicio según el rol, tal como la indica el backend. */
  rutaInicio: string;
}

const AuthContext = createContext<EstadoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [comprobando, setComprobando] = useState(true);
  const [rutaInicio, setRutaInicio] = useState('/perfiles');
  const expirada = useRef(false);

  // Los interceptores se instalan una sola vez. El de respuesta necesita saber
  // qué hacer cuando el servidor devuelve 401, y eso depende de la navegación,
  // que sólo conoce este componente.
  useEffect(() => {
    instalarInterceptores(() => {
      if (expirada.current) return;
      expirada.current = true;
      setUsuario(null);
      router.replace('/sesion-expirada');
    });
  }, [router]);

  // Si otro punto de la aplicación borra el token, la sesión se cae aquí también.
  useEffect(() => alCambiarToken((t) => { if (!t) setUsuario(null); }), []);

  // Rehidratación: /auth/me vuelve a consultar la base, así que un token
  // revocado o caducado por inactividad se detecta al cargar, no más tarde.
  useEffect(() => {
    const control = new AbortController();

    async function rehidratar() {
      if (leerToken()) {
        try {
          setUsuario(await obtenerCuenta(control.signal));
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          // Un fallo de red no debe expulsar al usuario: sólo lo hace el
          // servidor, y de eso ya se encarga el interceptor de 401.
          if (!(error instanceof ApiError) || !error.esSesionInvalida) {
            // se conserva el token para reintentar más tarde
          }
        }
      }
      setComprobando(false);
    }

    void rehidratar();
    return () => control.abort();
  }, []);

  const entrar = useCallback(async (correo: string, contrasena: string) => {
    const sesion = await loginApi(correo, contrasena);
    expirada.current = false;
    setUsuario(sesion.usuario);
    setRutaInicio(RUTA_INICIO[sesion.pantallaInicio] ?? '/perfiles');
    return sesion.usuario;
  }, []);

  const salir = useCallback(() => {
    cerrarSesion();
    setUsuario(null);
    router.replace('/entrar');
  }, [router]);

  const valor = useMemo<EstadoAuth>(
    () => ({ usuario, comprobando, entrar, salir, rutaInicio }),
    [usuario, comprobando, entrar, salir, rutaInicio]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return contexto;
}
