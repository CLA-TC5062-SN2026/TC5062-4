'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import { ChipEstado, ChipEtiqueta, MarcaPrioridad } from '@/components/dafi/Chips';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { AvisoEmergencias, FilaDato } from '@/components/dafi/Piezas';
import { EstadoVacio } from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import { obtenerConversacion } from '@/services/conversacionesService';
import type { Conversacion } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import estilos from '@/components/dafi/Pantalla.module.css';

/**
 * Pantalla 8 y D4: conversación en BORRADOR, cargada con GET /conversaciones/{id}.
 * Las preguntas de contexto y el envío (POST .../envios) llegan con F5.
 */
function Contenido({ conversacionId }: { conversacionId: string }) {
  const router = useRouter();
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    let vigente = true;
    async function cargar() {
      setError(null);
      setNoEncontrada(false);
      try {
        const datos = await obtenerConversacion(conversacionId, control.signal);
        if (vigente) setConversacion(datos);
      } catch (e) {
        if (!vigente || (e instanceof DOMException && e.name === 'AbortError')) return;
        if (e instanceof ApiError && e.esSesionInvalida) return;
        // Inexistente, de otra familia o id mal formado: el backend responde 404.
        if (e instanceof ApiError && e.status === 404) return setNoEncontrada(true);
        setError(mensajeParaUsuario(e));
        if ((await alertarError(e, { reintentar: true })) && vigente) setIntento((n) => n + 1);
      }
    }
    void cargar();
    return () => {
      vigente = false;
      control.abort();
    };
  }, [conversacionId, intento]);

  if (noEncontrada) {
    return (
      <AppShell titulo="Borrador" conVolver>
        <EstadoVacio
          icono="mensaje"
          titulo="Conversación no encontrada"
          texto="No existe o no pertenece a su familia."
          accion={<Button onClick={() => router.push('/conversaciones')}>Ver conversaciones</Button>}
        />
      </AppShell>
    );
  }

  if (!conversacion) {
    return (
      <AppShell titulo="Borrador" conVolver>
        {error ? (
          <div className={estilos.notaAviso} role="alert">
            <Icono nombre="alerta" tam={18} />
            <span className={estilos.notaCuerpo}>
              <span className="t-body-m-fuerte">No pudimos cargar la conversación</span>
              <span className={`${estilos.notaDetalle} t-body-s`}>{error}</span>
              <span>
                <Button size="sm" variant="secundario" onClick={() => setIntento((n) => n + 1)}>
                  Reintentar
                </Button>
              </span>
            </span>
          </div>
        ) : (
          <EsqueletoLista filas={2} mensaje="Cargando la conversación…" />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell titulo={conversacion.titulo} conVolver mostrarBarra={false}>
      <div className={estilos.columnas}>
        <div className={estilos.principal}>
          <div className={estilos.listaChips}>
            <ChipEstado estado={conversacion.estado} />
            {conversacion.etiquetas.map((codigo) => (
              <ChipEtiqueta key={codigo} codigo={codigo as CodigoEtiqueta} />
            ))}
            {conversacion.prioridadIndicada && <MarcaPrioridad />}
          </div>

          <div className={estilos.tarjeta}>
            <FilaDato clave="Perfil" valor={conversacion.perfil.nombre} />
            <FilaDato clave="Médico" valor={conversacion.medico?.nombre ?? 'Sin médico'} />
          </div>

          <p className={`${estilos.apoyo} t-body-m`}>Las preguntas de contexto aparecerán aquí.</p>
        </div>

        <aside className={estilos.lateral}>
          {/* RF-13: el aviso es fijo y sólo aparece del lado de la familia. */}
          <AvisoEmergencias />
        </aside>
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaBorrador({ params }: { params: Promise<{ conversacionId: string }> }) {
  const { conversacionId } = use(params);
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido key={conversacionId} conversacionId={conversacionId} />
    </RutaProtegida>
  );
}
