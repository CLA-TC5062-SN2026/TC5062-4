'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Rol } from '@/services/authService';
import Cargando from './Cargando';

export interface RutaProtegidaProps {
  children: ReactNode;
  /** Si se indica, además de sesión se exige uno de estos roles. */
  roles?: Rol[];
}

/**
 * Envuelve una pantalla que requiere sesión.
 *
 * Es una comprobación de cliente, para la experiencia: evita que alguien vea
 * una pantalla vacía y entienda por qué. **No es el control de acceso**: ése
 * lo hace el backend en cada petición (`authenticate` + `authorize`), que es
 * el único sitio donde no se puede saltar.
 */
export function RutaProtegida({ children, roles }: RutaProtegidaProps) {
  const { usuario, comprobando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (comprobando) return;
    if (!usuario) {
      router.replace('/entrar');
      return;
    }
    if (roles && !roles.includes(usuario.rol)) {
      // El rol no corresponde: se le lleva a su propia pantalla de inicio en
      // vez de dejarle en una vista que el servidor le va a negar.
      router.replace(usuario.rol === 'medico' ? '/medico/bandeja' : '/perfiles');
    }
  }, [usuario, comprobando, roles, router]);

  if (comprobando) return <Cargando mensaje="Comprobando su sesión…" pantallaCompleta />;
  if (!usuario) return <Cargando mensaje="Llevándole al inicio de sesión…" pantallaCompleta />;
  if (roles && !roles.includes(usuario.rol)) return <Cargando mensaje="Redirigiendo…" pantallaCompleta />;

  return <>{children}</>;
}

export default RutaProtegida;
