'use client';

import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell, { NAV_MEDICO } from '@/components/dafi/Shell';
import { EstadoVacio } from '@/components/dafi/Bloques';

/**
 * Sección prevista en el diseño y en el SRS, todavía sin construir.
 * Existe como ruta para que la navegación no tenga enlaces muertos: en
 * producción Next precarga cada pestaña, y una ruta inexistente devuelve un
 * 404 que aparece como error en la consola del navegador.
 */
function Contenido() {
  return (
    <AppShell titulo="Cuenta" nav={NAV_MEDICO} usuario={{ nombre: 'Dra. Lucía Torres', rol: 'Pediatría' }}>
      <EstadoVacio
        icono="usuarios"
        titulo="Cuenta"
        texto="Datos del médico, especialidad y cierre de sesión. Sección prevista en el SRS, todavía sin construir."
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
