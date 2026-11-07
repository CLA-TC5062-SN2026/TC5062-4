'use client';

import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import { ChipEstado, ChipEtiqueta } from '@/components/dafi/Chips';
import { AvisoEmergencias } from '@/components/dafi/Piezas';
import { Pregunta } from '@/components/dafi/Bloques';
import { PREGUNTAS_BORRADOR } from '@/lib/datos-demo';
import estilos from '@/components/dafi/Pantalla.module.css';

/**
 * Pantalla 8 y D4: conversación en BORRADOR.
 * El envío es POST /api/v1/conversaciones/{id}/envios y lo rechaza la API con
 * 422 CONVERSACION_INCOMPLETA mientras queden obligatorias sin responder.
 */
function Contenido() {
  const router = useRouter();
  const pendientes = PREGUNTAS_BORRADOR.filter((p) => p.obligatoria && !p.respuesta);
  const puedeEnviar = pendientes.length === 0;

  return (
    <AppShell
      titulo="Ronchas en el brazo"
      conVolver
      mostrarBarra={false}
      pie={
        <div className={estilos.barraAcciones}>
          <Button fullWidth disabled={!puedeEnviar} onClick={() => router.push('/conversaciones/c-ronchas')}>
            Enviar a la Dra. Torres
          </Button>
          <Button variant="peligro" fullWidth>Descartar borrador</Button>
        </div>
      }
    >
      <div className={estilos.columnas}>
        <div className={estilos.principal}>
          <div className={estilos.listaChips}>
            <ChipEstado estado="BORRADOR" />
            <ChipEtiqueta codigo="piel" />
            <ChipEtiqueta codigo="fiebre" />
          </div>

          {pendientes.length > 0 && (
            <p className={estilos.notaAviso} role="status">
              <Icono nombre="alerta" tam={18} />
              <span className={estilos.notaCuerpo}>
                <span className="t-body-m-fuerte">
                  {pendientes.length === 1
                    ? 'Falta 1 respuesta obligatoria para poder enviar'
                    : `Faltan ${pendientes.length} respuestas obligatorias para poder enviar`}
                </span>
                <span className={`${estilos.notaDetalle} t-body-s`}>
                  La API rechaza el envío con 422 CONVERSACION_INCOMPLETA mientras queden puntos
                  pendientes.
                </span>
              </span>
            </p>
          )}

          <h2 className={`${estilos.rotulo} t-overline`}>
            PREGUNTAS DE CONTEXTO · DE LAS ETIQUETAS PIEL Y FIEBRE
          </h2>
          {PREGUNTAS_BORRADOR.map((p) => (
            <Pregunta key={p.codigo} {...p} />
          ))}
        </div>

        <aside className={estilos.lateral}>
          {/* RF-13: el aviso es fijo y sólo aparece del lado de la familia. */}
          <AvisoEmergencias />

          <div className={estilos.tarjeta}>
            <h2 className={`${estilos.rotulo} t-overline`}>FOTOS · 2 DE 6</h2>
            <div className={estilos.galeria}>
              <span className={estilos.foto}><Icono nombre="camara" tam={22} /></span>
              <span className={estilos.foto}><Icono nombre="camara" tam={22} /></span>
              <button type="button" className={`${estilos.foto} ${estilos.fotoAgregar}`} aria-label="Agregar una foto">
                <Icono nombre="mas" tam={22} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaBorrador() {
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido  />
    </RutaProtegida>
  );
}
