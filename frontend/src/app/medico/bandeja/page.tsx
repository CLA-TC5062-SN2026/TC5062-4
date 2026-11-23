'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell, { NAV_MEDICO } from '@/components/dafi/Shell';
import Icono from '@/components/ui/Icono';
import Button from '@/components/ui/Button';
import { EstadoVacio, TarjetaConversacion } from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { useAuth } from '@/context/AuthContext';
import { listarConversaciones } from '@/services/conversacionesService';
import type { Conversacion } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { agruparBandeja } from './grupos';
import estilos from '@/components/dafi/Pantalla.module.css';

// shortcut: una sola página de 100 (máximo del backend) agrupada en el cliente; si una médica
// llega a más de 100 conversaciones, paginar por estado (una petición por grupo con `estado`).
const LIMITE = 100;

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' });

/**
 * Pantalla 10 y D5: GET /api/v1/conversaciones. El backend ya filtra lo que la médica
 * puede ver (asignadas a ella, sin borradores) y ordena por último evento.
 */
function Contenido() {
  const router = useRouter();
  const { usuario } = useAuth();
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
        const p = await listarConversaciones({ limite: LIMITE }, control.signal);
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
  }, [intento]);

  return (
    <AppShell
      titulo="Bandeja"
      nav={NAV_MEDICO}
      usuario={{ nombre: usuario?.nombre ?? '', rol: usuario?.especialidad ?? 'Médica' }}
    >
      <p className={estilos.notaInfo}>
        <Icono nombre="info" tam={18} />
        <span className="t-body-m">
          Sólo aparecen las conversaciones que le enviaron. Los borradores de la familia nunca son visibles.
        </span>
      </p>

      {error ? (
        <div className={estilos.notaAviso} role="alert">
          <Icono nombre="alerta" tam={18} />
          <span className={estilos.notaCuerpo}>
            <span className="t-body-m-fuerte">No pudimos cargar la bandeja</span>
            <span className={`${estilos.notaDetalle} t-body-s`}>{error}</span>
            <span>
              <Button size="sm" variant="secundario" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </Button>
            </span>
          </span>
        </div>
      ) : !conversaciones ? (
        <EsqueletoLista filas={2} mensaje="Cargando la bandeja…" />
      ) : conversaciones.length === 0 ? (
        <EstadoVacio
          icono="mensaje"
          titulo="No tiene conversaciones por revisar"
          texto="Aquí aparecerán las que le envíen las familias de su círculo."
        />
      ) : (
        <>
          {agruparBandeja(conversaciones).map((g) => (
            <section key={g.titulo} className={estilos.pila} aria-label={g.titulo}>
              <h2 className={`${estilos.rotulo} t-overline`}>
                {g.titulo.toUpperCase()} · {g.conversaciones.length}
              </h2>
              <div className={estilos.rejilla}>
                {g.conversaciones.map((c) => (
                  <TarjetaConversacion
                    key={c.id}
                    contexto={c.perfil.nombre}
                    titulo={c.titulo}
                    estado={c.estado}
                    etiquetas={c.etiquetas as CodigoEtiqueta[]}
                    prioridad={c.prioridadIndicada}
                    autor={c.familiaNombre}
                    cuando={fecha(c.ultimoEventoEn)}
                    onClick={() => router.push(`/medico/conversaciones/${c.id}`)}
                  />
                ))}
              </div>
            </section>
          ))}
          {total > conversaciones.length && (
            <p className={`${estilos.apoyo} t-body-s`}>
              Se muestran las {conversaciones.length} más recientes de {total}.
            </p>
          )}
        </>
      )}
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaBandeja() {
  return (
    <RutaProtegida roles={['medico']}>
      <Contenido />
    </RutaProtegida>
  );
}
