'use client';

import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import { EstadoVacio } from '@/components/dafi/Bloques';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

/**
 * Sección prevista en el diseño y en el SRS, todavía sin construir.
 * Existe como ruta para que la navegación no tenga enlaces muertos: en
 * producción Next precarga cada pestaña, y una ruta inexistente devuelve un
 * 404 que aparece como error en la consola del navegador.
 */
function Contenido() {
  const { salir } = useAuth();
  return (
    <AppShell titulo="Cuenta">
      <EstadoVacio
        icono="usuarios"
        titulo="Cuenta"
        texto="Datos de la cuenta, cambio de contraseña, invitación del cocuidador y borrado de la familia. Sección prevista en el SRS, todavía sin construir; por ahora aquí solo puede cerrar sesión."
        accion={<Button variant="secundario" onClick={salir}>Cerrar sesión</Button>}
      />
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function Pagina() {
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido  />
    </RutaProtegida>
  );
}
