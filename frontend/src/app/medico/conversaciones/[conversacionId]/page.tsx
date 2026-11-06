'use client';

import AppShell, { NAV_MEDICO } from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import { ChipEstado, ChipEtiqueta, MarcaPrioridad } from '@/components/dafi/Chips';
import {
  Compositor,
  EventoAviso,
  EventoCambioEstado,
  EventoMensaje,
  Pregunta,
  TarjetaResumen,
} from '@/components/dafi/Bloques';
import { PREGUNTAS_BORRADOR, RESUMEN_MATEO } from '@/lib/datos-demo';
import estilos from '@/components/dafi/Pantalla.module.css';

const MEDICO = { nombre: 'Dra. Lucía Torres', rol: 'Pediatría' };

/** Pantalla 11 y D6: GET /api/v1/conversaciones/{conversacionId} */
export default function PaginaConversacionMedico() {
  const respondidas = PREGUNTAS_BORRADOR.filter((p) => p.respuesta);

  return (
    <AppShell
      titulo="Mateo · 4 años"
      nav={NAV_MEDICO}
      usuario={MEDICO}
      conVolver
      mostrarBarra={false}
      accion={{ icono: 'filtro', etiqueta: 'Filtrar la conversación' }}
      pie={<Compositor />}
    >
      <div className={estilos.columnas}>
        <div className={estilos.principal}>
          <div className={estilos.listaChips}>
            <ChipEstado estado="INFO_SOLICITADA" />
            <ChipEtiqueta codigo="piel" />
            <ChipEtiqueta codigo="fiebre" />
            <MarcaPrioridad />
          </div>

          {/* El aviso de emergencias es sólo del lado de la familia (RF-13):
              por eso esta pantalla no lo muestra. */}
          <p className={`${estilos.apoyo} t-body-s`}>
            Familia Ruán · enviada hace 2 h · sin aviso de emergencias (es sólo del lado de la familia)
          </p>

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

        <aside className={estilos.lateral}>
          <TarjetaResumen grupos={RESUMEN_MATEO} />

          <div className={estilos.tarjeta}>
            <h2 className={`${estilos.rotulo} t-overline`}>
              RESPUESTAS DE CONTEXTO · {respondidas.length} DE {PREGUNTAS_BORRADOR.length}
            </h2>
            {respondidas.slice(0, 1).map((p) => (
              <Pregunta key={p.codigo} {...p} />
            ))}
            <button type="button" className={estilos.enlaceFila}>
              <span className={estilos.enlaceFilaIzq}>
                <Icono nombre="archivo" tam={16} />
                <span className="t-body-m-fuerte">
                  Ver las {PREGUNTAS_BORRADOR.length} respuestas
                </span>
              </span>
              <Icono nombre="chevronDerecha" tam={16} />
            </button>
          </div>

          <div className={estilos.barraAcciones}>
            <Button fullWidth>Registrar indicaciones</Button>
            <Button variant="secundario" fullWidth>Pedir más información</Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
