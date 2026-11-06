'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import estilos from '@/components/dafi/Acceso.module.css';
import shell from '@/components/dafi/Shell.module.css';

/**
 * Pantalla 12: la familia retiró al médico de su círculo.
 * `authorize.js` responde 404 NO_ENCONTRADO en lugar de 403 para no revelar
 * que el recurso existe.
 */
export default function PaginaSinAcceso() {
  const router = useRouter();
  return (
    <div className={estilos.pagina}>
      <main id="contenido" className={estilos.panelFormulario}>
        <div className={estilos.caja}>
          <header className={shell.encabezado} style={{ margin: '0 calc(var(--space-24) * -1)' }}>
            <button type="button" className={shell.volver} onClick={() => router.back()} aria-label="Volver">
              <Icono nombre="flechaIzquierda" tam={22} />
            </button>
            <h1 className={`${shell.encabezadoTitulo} t-heading-m`}>Conversación</h1>
          </header>

          <div className={estilos.centrado}>
            <span className={estilos.anilloAlerta} aria-hidden="true">
              <Icono nombre="candado" tam={28} />
            </span>
            <h2 className={`${estilos.titulo} t-heading-l`}>Esta conversación ya no está disponible</h2>
            <p className={`${estilos.entradilla} t-body-m`}>
              La familia retiró a este médico de su círculo. DAFI responde 404 en lugar de 403 para no
              revelar que el recurso existe.
            </p>
            <p className={`${estilos.codigo} t-mono`}>404 NO_ENCONTRADO</p>
            <Button variant="secundario" fullWidth onClick={() => router.push('/medico/bandeja')}>
              Volver a la bandeja
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
