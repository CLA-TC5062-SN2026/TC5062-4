'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import { Avatar, FilaDato } from '@/components/dafi/Piezas';
import { TarjetaConversacion } from '@/components/dafi/Bloques';
import { HISTORIAL_MATEO, PERFILES } from '@/lib/datos-demo';
import estilos from '@/components/dafi/Pantalla.module.css';

/** Pantalla 6 y D3: GET /perfiles/{id} + /perfiles/{id}/conversaciones */
function Contenido({ params }: { params: Promise<{ perfilId: string }> }) {
  const { perfilId } = use(params);
  const router = useRouter();
  const perfil = PERFILES.find((p) => p.id === perfilId) ?? PERFILES[0];

  return (
    <AppShell
      titulo={perfil.nombre}
      conVolver
      accion={{ icono: 'lapiz', etiqueta: 'Editar el perfil' }}
    >
      <div className={estilos.columnas}>
        <div className={estilos.principal}>
          <h2 className={`${estilos.rotulo} t-overline`}>
            HISTORIAL · {HISTORIAL_MATEO.length} CONVERSACIONES
          </h2>
          {HISTORIAL_MATEO.map((c) => (
            <TarjetaConversacion
              key={c.id}
              {...c}
              onClick={() => router.push(`/conversaciones/${c.id}`)}
            />
          ))}
        </div>

        <aside className={estilos.lateral}>
          <div className={estilos.tarjeta}>
            <div className={estilos.identidad}>
              <Avatar nombre={perfil.nombre} />
              <div className={estilos.identidadTextos}>
                <p className={`${estilos.identidadNombre} t-heading-m`}>{perfil.nombre}</p>
                <p className={`${estilos.identidadMeta} t-body-s`}>{perfil.meta} · perfil activo</p>
              </div>
            </div>
            {perfil.datos.map((d) => (
              <FilaDato key={d.clave} clave={d.clave} valor={d.valor} />
            ))}
          </div>

          <Button
            fullWidth
            onClick={() => router.push(`/perfiles/${perfil.id}/conversaciones/nueva`)}
          >
            Nueva conversación
          </Button>
          <Button variant="secundario" fullWidth>Editar perfil</Button>
        </aside>
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaPerfil(props: { params: Promise<{ perfilId: string }> }) {
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido params={props.params} />
    </RutaProtegida>
  );
}
