'use client';

import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import { ChipEstado, ChipEtiqueta, MarcaPrioridad } from '@/components/dafi/Chips';
import { AvisoEmergencias } from '@/components/dafi/Piezas';
import {
  Compositor,
  EventoAviso,
  EventoCambioEstado,
  EventoMensaje,
} from '@/components/dafi/Bloques';
import estilos from '@/components/dafi/Pantalla.module.css';

/**
 * Pantalla 9: conversación enviada, con la bitácora de eventos.
 * GET /api/v1/conversaciones/{id}/eventos y POST .../mensajes.
 */
function Contenido() {
  return (
    <AppShell
      titulo="Ronchas en el brazo"
      conVolver
      mostrarBarra={false}
      sinRelleno
      pie={<Compositor />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', padding: 'var(--space-16)' }}>
        <div className={estilos.listaChips}>
          <ChipEstado estado="INFO_SOLICITADA" />
          <ChipEtiqueta codigo="piel" />
          <ChipEtiqueta codigo="fiebre" />
          <MarcaPrioridad />
        </div>

        <AvisoEmergencias />

        <EventoMensaje
          autor="María Ruán"
          rol="familia"
          hora="09:40"
          texto="Le salieron unas ronchas en el antebrazo derecho desde ayer en la tarde. No tiene fiebre."
          fotos={2}
        />

        <EventoCambioEstado desde="BORRADOR" hasta="ENVIADA" hora="09:42" />

        <EventoMensaje
          autor="Dra. Lucía Torres"
          rol="medico"
          hora="10:12"
          texto="Gracias. ¿Ha estado en contacto con algún jabón o crema nueva? Mándeme una foto con luz natural, por favor."
        />

        <EventoAviso
          tipo="solicitud"
          titulo="La Dra. Lucía Torres pidió más información"
          detalle="Solicitud de tipo «ambas»: una foto con luz natural y responder P3."
        />
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaConversacion() {
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido  />
    </RutaProtegida>
  );
}
