'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell, { NAV_MEDICO } from '@/components/dafi/Shell';
import Icono from '@/components/ui/Icono';
import Button from '@/components/ui/Button';
import { ChipEstado, ChipEtiqueta, ChipFiltro, MarcaPrioridad } from '@/components/dafi/Chips';
import { TarjetaConversacion, TarjetaResumen, EventoMensaje } from '@/components/dafi/Bloques';
import { BANDEJA_MEDICO, RESUMEN_MATEO, SECCIONES_BANDEJA } from '@/lib/datos-demo';
import estilos from '@/components/dafi/Pantalla.module.css';

const MEDICO = { nombre: 'Dra. Lucía Torres', rol: 'Pediatría' };

/** Pantalla 10 y D5: GET /api/v1/conversaciones?seccion=… */
function Contenido() {
  const router = useRouter();
  const [seccion, setSeccion] = useState(SECCIONES_BANDEJA[0].id);
  const [seleccionada, setSeleccionada] = useState(BANDEJA_MEDICO[0].id);
  const conversacion = BANDEJA_MEDICO.find((c) => c.id === seleccionada) ?? BANDEJA_MEDICO[0];

  return (
    <AppShell titulo="Bandeja" nav={NAV_MEDICO} usuario={MEDICO}>
      <div className={estilos.columnas}>
        <div className={estilos.principal} style={{ maxWidth: 'var(--ancho-lista, none)' }}>
          <div className={estilos.listaChips} role="tablist" aria-label="Secciones de la bandeja">
            {SECCIONES_BANDEJA.map((s) => (
              <ChipFiltro key={s.id} activo={seccion === s.id} onClick={() => setSeccion(s.id)} rolAria="tab">
                {s.nombre}
              </ChipFiltro>
            ))}
          </div>

          <p className={estilos.notaInfo}>
            <Icono nombre="info" tam={18} />
            <span className="t-body-m">
              Sólo aparecen las conversaciones que le enviaron. Los borradores de la familia nunca son
              visibles.
            </span>
          </p>

          {BANDEJA_MEDICO.map((c) => (
            <TarjetaConversacion
              key={c.id}
              {...c}
              seleccionada={c.id === seleccionada}
              onClick={() => {
                setSeleccionada(c.id);
                router.push(`/medico/conversaciones/${c.id}`);
              }}
            />
          ))}
        </div>

        {/* Panel de vista previa: sólo en escritorio (Figma D5). */}
        <aside className={estilos.lateral} style={{ width: 'auto', flex: 1 }}>
          <div className={estilos.tarjeta}>
            <div className={estilos.listaChips}>
              <ChipEstado estado={conversacion.estado} />
              {conversacion.etiquetas.map((e) => <ChipEtiqueta key={e} codigo={e} />)}
              {conversacion.prioridad && <MarcaPrioridad />}
            </div>
            <h2 className="t-heading-l">{conversacion.titulo}</h2>
            <p className={`${estilos.apoyo} t-body-s`}>
              {conversacion.contexto} · enviada {conversacion.cuando} por {conversacion.autor}
            </p>
            <TarjetaResumen grupos={RESUMEN_MATEO} />
            <EventoMensaje
              autor="María Ruán"
              rol="familia"
              hora="09:40"
              texto="Le salieron unas ronchas en el antebrazo derecho desde ayer en la tarde. No tiene fiebre."
              fotos={2}
            />
            <div className={estilos.barraAcciones}>
              <Button variant="secundario" fullWidth>Pedir información</Button>
              <Button fullWidth>Registrar indicaciones</Button>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaBandeja() {
  return (
    <RutaProtegida roles={['medico']}>
      <Contenido  />
    </RutaProtegida>
  );
}
