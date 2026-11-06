'use client';

import AppShell, { NAV_MEDICO } from '@/components/dafi/Shell';
import { EstadoVacio } from '@/components/dafi/Bloques';

/**
 * Sección prevista en el diseño y en el SRS, todavía sin construir.
 * Existe como ruta para que la navegación no tenga enlaces muertos: en
 * producción Next precarga cada pestaña, y una ruta inexistente devuelve un
 * 404 que aparece como error en la consola del navegador.
 */
export default function Pagina() {
  return (
    <AppShell titulo="Pacientes" nav={NAV_MEDICO} usuario={{ nombre: 'Dra. Lucía Torres', rol: 'Pediatría' }}>
      <EstadoVacio
        icono="usuarios"
        titulo="Pacientes"
        texto="Los perfiles a los que este médico tiene acceso, con su historial. Sección prevista en el SRS, todavía sin construir."
      />
    </AppShell>
  );
}
