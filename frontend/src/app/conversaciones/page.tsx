'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import { EstadoVacio, TarjetaConversacion } from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import { ChipFiltro } from '@/components/dafi/Chips';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { listarConversaciones } from '@/services/conversacionesService';
import type { Conversacion, EstadoConversacion } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import estilos from '@/components/dafi/Pantalla.module.css';

const POR_PAGINA = 5;

const FILTROS: { estado?: EstadoConversacion; texto: string }[] = [
  { texto: 'Todas' },
  { estado: 'BORRADOR', texto: 'Borrador' },
  { estado: 'ENVIADA', texto: 'Enviada' },
  { estado: 'EN_REVISION', texto: 'En revisión' },
  { estado: 'CON_INDICACIONES', texto: 'Con indicaciones' },
  { estado: 'CERRADA', texto: 'Cerrada' },
];

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });

/**
 * Raíz de la pestaña «Conversaciones»: GET /api/v1/conversaciones, que ya ordena
 * por último evento y pagina con `pagina`/`limite`; el filtro usa `estado`.
 */
function Contenido() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoConversacion | undefined>();
  const [pagina, setPagina] = useState(1);
  const [conversaciones, setConversaciones] = useState<Conversacion[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    let vigente = true;
    async function cargar() {
      setConversaciones(null);
      setError(null);
      try {
        const p = await listarConversaciones({ estado, pagina, limite: POR_PAGINA }, control.signal);
        if (!vigente) return;
        setConversaciones(p.datos);
        setTotal(p.paginacion.total);
      } catch (e) {
        if (!vigente || (e instanceof DOMException && e.name === 'AbortError')) return;
        if (e instanceof ApiError && e.esSesionInvalida) return;
        setError(mensajeParaUsuario(e));
        if ((await alertarError(e, { reintentar: true })) && vigente) setIntento((n) => n + 1);
      }
    }
    void cargar();
    return () => {
      vigente = false;
      control.abort();
    };
  }, [estado, pagina, intento]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <AppShell titulo="Conversaciones">
      <p className={`${estilos.apoyo} t-body-m`}>
        Todas las conversaciones de la familia, primero las de actividad más reciente.
      </p>

      <div className={estilos.listaChips} role="radiogroup" aria-label="Filtrar por estado">
        {FILTROS.map((f) => (
          <ChipFiltro
            key={f.texto}
            activo={estado === f.estado}
            rolAria="radio"
            onClick={() => {
              setEstado(f.estado);
              setPagina(1);
            }}
          >
            {f.texto}
          </ChipFiltro>
        ))}
      </div>

      {error ? (
        <div className={estilos.notaAviso} role="alert">
          <Icono nombre="alerta" tam={18} />
          <span className={estilos.notaCuerpo}>
            <span className="t-body-m-fuerte">No pudimos cargar las conversaciones</span>
            <span className={`${estilos.notaDetalle} t-body-s`}>{error}</span>
            <span>
              <Button size="sm" variant="secundario" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </Button>
            </span>
          </span>
        </div>
      ) : !conversaciones ? (
        <EsqueletoLista filas={2} mensaje="Cargando conversaciones…" />
      ) : conversaciones.length === 0 ? (
        <EstadoVacio
          icono="mensaje"
          titulo={estado ? 'No hay conversaciones en este estado' : 'Todavía no hay conversaciones'}
          texto={estado ? 'Pruebe con otro filtro.' : 'Abra una desde el perfil de un familiar.'}
          accion={!estado && <Button onClick={() => router.push('/perfiles')}>Ver perfiles</Button>}
        />
      ) : (
        <>
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
          {paginas > 1 && (
            <nav className={estilos.cabeceraSeccion} aria-label="Páginas de conversaciones">
              <Button size="sm" variant="secundario" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
                Anterior
              </Button>
              <span className={`${estilos.apoyo} t-label`}>Página {pagina} de {paginas}</span>
              <Button size="sm" variant="secundario" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>
                Siguiente
              </Button>
            </nav>
          )}
        </>
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
