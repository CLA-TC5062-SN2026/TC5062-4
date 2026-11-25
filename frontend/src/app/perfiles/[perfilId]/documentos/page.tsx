'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import estilos from '@/components/dafi/Pantalla.module.css';

/** Tarea F10: pantalla informativa. No guarda archivos ni llama al backend.
 *  Se redacta como archivo personal de la familia, no como expediente clínico (RD-04). */
function Contenido({ perfilId }: { perfilId: string }) {
  const router = useRouter();
  return (
    <AppShell titulo="Documentos" conVolver>
      <div className={estilos.tarjeta}>
        <span className={`${estilos.pastillaContexto} t-label`}>
          <Icono nombre="reloj" tam={16} />
          Próximamente
        </span>
        <p className="t-heading-s">Recetas, análisis e imágenes en un solo lugar</p>
        <p className={`${estilos.apoyo} t-body-m`}>
          Muy pronto su familia podrá guardar en DAFI las recetas, los análisis y las imágenes de este perfil, en vez de
          tenerlos repartidos entre Archivos, Notas y Fotos del teléfono. Desde una conversación podrá compartirlos con
          su médico.
        </p>
        <p className={`${estilos.apoyo} t-body-m`}>
          Será un archivo personal de la familia, para tener a la mano los papeles que ya tiene.
        </p>
      </div>
      <div className={estilos.notaInfo}>
        <Icono nombre="info" tam={18} />
        <span className="t-body-s">Por ahora DAFI no guarda ningún archivo. Esta pantalla solo anuncia la función.</span>
      </div>
      <Button variant="secundario" fullWidth onClick={() => router.push(`/perfiles/${perfilId}`)}>
        Volver al perfil
      </Button>
    </AppShell>
  );
}

export default function PaginaDocumentos({ params }: { params: Promise<{ perfilId: string }> }) {
  const { perfilId } = use(params);
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido perfilId={perfilId} />
    </RutaProtegida>
  );
}
