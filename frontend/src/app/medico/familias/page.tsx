'use client';

import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell, { NAV_MEDICO } from '@/components/dafi/Shell';
import { EstadoVacio } from '@/components/dafi/Bloques';
import { useAuth } from '@/context/AuthContext';

/**
 * Sección prevista en el diseño y en el SRS, todavía sin construir.
 * Existe como ruta para que la navegación no tenga enlaces muertos: en
 * producción Next precarga cada pestaña, y una ruta inexistente devuelve un
 * 404 que aparece como error en la consola del navegador.
 */
function Contenido() {
  const { usuario } = useAuth();
  return (
    <AppShell titulo="Familias" nav={NAV_MEDICO} usuario={{ nombre: usuario?.nombre ?? '', rol: usuario?.especialidad ?? 'Médica' }}>
      <EstadoVacio
        icono="actividad"
        titulo="Familias"
        texto="Las familias que tienen a este médico en su círculo. Sección prevista en el SRS, todavía sin construir."
      />
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function Pagina() {
  return (
    <RutaProtegida roles={['medico']}>
      <Contenido  />
    </RutaProtegida>
  );
}
