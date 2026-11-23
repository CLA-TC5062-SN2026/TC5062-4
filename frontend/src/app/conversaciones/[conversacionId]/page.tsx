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
import { listarEventos, obtenerConversacion } from '@/services/conversacionesService';
import type { DetalleConversacion, Evento } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { CajaMensaje, ListaEventos, RespuestasContexto } from './piezasHilo';
import estilos from '@/components/dafi/Pantalla.module.css';

// Máximo que admite el backend por página; la demo queda muy por debajo.
const LIMITE_EVENTOS = 100;

/**
 * Pantalla 9: hilo de la cuidadora. GET /conversaciones/{id}, GET .../eventos
 * y POST .../mensajes con Idempotency-Key.
 */
function Contenido({ conversacionId }: { conversacionId: string }) {
  const router = useRouter();
  const [conversacion, setConversacion] = useState<DetalleConversacion | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [totalEventos, setTotalEventos] = useState(0);
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
        if (!vigente) return;
        // Un borrador se edita y envía en su propia pantalla.
        if (datos.estado === 'BORRADOR') return router.replace(`/conversaciones/${conversacionId}/borrador`);
        const pagina = await listarEventos(conversacionId, { limite: LIMITE_EVENTOS }, control.signal);
        if (!vigente) return;
        setEventos(pagina.datos);
        setTotalEventos(pagina.paginacion.total);
        setConversacion(datos);
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
  }, [conversacionId, intento, router]);

  if (noEncontrada) {
    return (
      <AppShell titulo="Conversación" conVolver>
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
      <AppShell titulo="Conversación" conVolver>
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

  const medico = conversacion.medico?.nombre ?? null;

  return (
    <AppShell
      titulo={conversacion.titulo}
      conVolver
      mostrarBarra={false}
      pie={
        <CajaMensaje
          conversacionId={conversacionId}
          estado={conversacion.estado}
          onEnviado={(evento) => {
            setEventos((lista) => [...lista, evento]);
            setTotalEventos((n) => n + 1);
          }}
        />
      }
    >
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
          <FilaDato clave="Médico" valor={medico ?? 'Sin médico'} />
        </div>

        {/* RF-13: aviso fijo del lado de la familia, antes del hilo; el backend lo quita al cerrar. */}
        {conversacion.estado !== 'CERRADA' && <AvisoEmergencias />}

        <RespuestasContexto preguntas={conversacion.preguntas} />

        <h2 className={`${estilos.rotulo} t-overline`}>CONVERSACIÓN</h2>
        {totalEventos > eventos.length && (
          <p className={`${estilos.apoyo} t-body-s`}>
            Se muestran los primeros {eventos.length} de {totalEventos} eventos.
          </p>
        )}
        <ListaEventos eventos={eventos} medico={medico} />
      </div>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaConversacion({ params }: { params: Promise<{ conversacionId: string }> }) {
  const { conversacionId } = use(params);
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido key={conversacionId} conversacionId={conversacionId} />
    </RutaProtegida>
  );
}
