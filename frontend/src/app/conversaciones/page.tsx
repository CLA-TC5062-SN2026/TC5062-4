'use client';

import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import { TarjetaConversacion } from '@/components/dafi/Bloques';
import { HISTORIAL_MATEO } from '@/lib/datos-demo';
import estilos from '@/components/dafi/Pantalla.module.css';

/** Raíz de la pestaña «Conversaciones»: GET /api/v1/conversaciones */
function Contenido() {
  const router = useRouter();
  return (
    <AppShell titulo="Conversaciones">
      <p className={`${estilos.apoyo} t-body-m`}>
        Todas las conversaciones de la familia, de la más reciente a la más antigua.
      </p>
      <div className={estilos.rejilla}>
        {HISTORIAL_MATEO.map((c) => (
          <TarjetaConversacion key={c.id} {...c} onClick={() => router.push(`/conversaciones/${c.id}`)} />
        ))}
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaConversaciones() {
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido  />
    </RutaProtegida>
  );
}
