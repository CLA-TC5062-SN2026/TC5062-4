'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import { TarjetaConversacion } from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { listarConversaciones } from '@/services/conversacionesService';
import type { Conversacion } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError } from '@/services/errores';
import estilos from '@/components/dafi/Pantalla.module.css';

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });

/**
 * Raíz de la pestaña «Conversaciones»: GET /api/v1/conversaciones.
 * shortcut: primera página tal como la ordena el backend (creación), sin filtros ni
 * paginación; F6 la reconstruye con orden por último evento.
 */
function Contenido() {
  const router = useRouter();
  const [conversaciones, setConversaciones] = useState<Conversacion[] | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    let vigente = true;
    listarConversaciones({}, control.signal).then(
      (p) => vigente && setConversaciones(p.datos),
      async (e) => {
        if (!vigente || (e instanceof DOMException && e.name === 'AbortError')) return;
        if (e instanceof ApiError && e.esSesionInvalida) return;
        if ((await alertarError(e, { reintentar: true })) && vigente) setIntento((n) => n + 1);
      }
    );
    return () => {
      vigente = false;
      control.abort();
    };
  }, [intento]);

  return (
    <AppShell titulo="Conversaciones">
      <p className={`${estilos.apoyo} t-body-m`}>
        Todas las conversaciones de la familia, de la más reciente a la más antigua.
      </p>
      {!conversaciones ? (
        <EsqueletoLista filas={2} mensaje="Cargando conversaciones…" />
      ) : (
        <div className={estilos.rejilla}>
          {conversaciones.map((c) => (
            <TarjetaConversacion
              key={c.id}
              contexto={c.perfil.nombre}
              titulo={c.titulo}
              estado={c.estado}
              etiquetas={c.etiquetas as CodigoEtiqueta[]}
              prioridad={c.prioridadIndicada}
              autor={c.medico?.nombre ?? 'Sin médico'}
              cuando={fecha(c.ultimoEventoEn)}
              onClick={() => router.push(`/conversaciones/${c.id}${c.estado === 'BORRADOR' ? '/borrador' : ''}`)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaConversaciones() {
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido />
    </RutaProtegida>
  );
}
