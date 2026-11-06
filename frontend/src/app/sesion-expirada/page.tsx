'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import estilos from '@/components/dafi/Acceso.module.css';

/**
 * Pantalla 3 del diseño. El backend revoca la sesión en el servidor tras
 * MINUTOS_SESION sin actividad y responde 401 NO_AUTENTICADO (RNF-05).
 */
export default function PaginaSesionExpirada() {
  const router = useRouter();
  return (
    <div className={estilos.pagina}>
      <main id="contenido" className={estilos.panelFormulario}>
        <div className={`${estilos.caja} ${estilos.centrado}`}>
          <span className={estilos.anilloAlerta} aria-hidden="true">
            <Icono nombre="candado" tam={28} />
          </span>
          <h1 className={`${estilos.titulo} t-heading-l`}>Su sesión se cerró por inactividad</h1>
          <p className={`${estilos.entradilla} t-body-m`}>
            Por seguridad, DAFI cierra la sesión después de 30 minutos sin actividad y revoca el token en
            el servidor. Vuelva a entrar para continuar.
          </p>
          <p className={`${estilos.codigo} t-mono`}>
            <Icono nombre="reloj" tam={14} />
            401 NO_AUTENTICADO
          </p>
          <Button fullWidth onClick={() => router.push('/entrar')}>
            Volver a entrar
          </Button>
        </div>
      </main>
    </div>
  );
}
