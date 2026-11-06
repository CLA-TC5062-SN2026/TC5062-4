'use client';

import { useRouter } from 'next/navigation';
import AppShell from '@/components/dafi/Shell';
import { TarjetaConversacion } from '@/components/dafi/Bloques';
import { HISTORIAL_MATEO } from '@/lib/datos-demo';
import estilos from '@/components/dafi/Pantalla.module.css';

/** Raíz de la pestaña «Conversaciones»: GET /api/v1/conversaciones */
export default function PaginaConversaciones() {
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
