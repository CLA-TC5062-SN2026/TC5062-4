'use client';

import AppShell from '@/components/dafi/Shell';
import { EstadoVacio } from '@/components/dafi/Bloques';

/**
 * Sección prevista en el diseño y en el SRS, todavía sin construir.
 * Existe como ruta para que la navegación no tenga enlaces muertos: en
 * producción Next precarga cada pestaña, y una ruta inexistente devuelve un
 * 404 que aparece como error en la consola del navegador.
 */
export default function Pagina() {
  return (
    <AppShell titulo="Cuenta">
      <EstadoVacio
        icono="usuarios"
        titulo="Cuenta"
        texto="Datos de la cuenta, cambio de contraseña, invitación del cocuidador y borrado de la familia. Sección prevista en el SRS, todavía sin construir."
      />
    </AppShell>
  );
}
