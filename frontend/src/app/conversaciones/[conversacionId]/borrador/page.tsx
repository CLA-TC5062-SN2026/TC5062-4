'use client';

import { use, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { ChipEstado, ChipEtiqueta, ChipFiltro, MarcaPrioridad } from '@/components/dafi/Chips';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { AvisoEmergencias, FilaDato } from '@/components/dafi/Piezas';
import { EstadoVacio } from '@/components/dafi/Bloques';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import { enviarConversacion, obtenerConversacion, responderPregunta } from '@/services/conversacionesService';
import type { DetalleConversacion, Pregunta, ValorRespuesta } from '@/services/conversacionesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { listoParaEnviar, textoPendientes, validarRespuesta } from './preguntas';
import estilos from '@/components/dafi/Pantalla.module.css';
import acceso from '@/components/dafi/Acceso.module.css';

/** Lo que la persona tiene escrito o elegido en cada pregunta, antes y después de guardar. */
interface Campos {
  opcion: string | null;
  texto: string;
  numero: string;
}

type EstadoGuardado = { fase: 'guardando' | 'guardado' } | { fase: 'error'; mensaje: string };

const camposDe = (r: { opcion: string | null; texto: string | null; numero: number | string | null } | undefined): Campos => ({
  opcion: r?.opcion ?? null,
  texto: r?.texto ?? '',
  numero: r?.numero == null ? '' : String(Number(r.numero)),
});

/**
 * Pantalla 8 y D4: conversación en BORRADOR, cargada con GET /conversaciones/{id}.
 * Cada respuesta se guarda con B2 al elegir una opción o al pulsar «Guardar»;
 * «Enviar» usa POST .../envios con Idempotency-Key.
 */
function Contenido({ conversacionId }: { conversacionId: string }) {
  const router = useRouter();
  const [conversacion, setConversacion] = useState<DetalleConversacion | null>(null);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const [campos, setCampos] = useState<Record<string, Campos>>({});
  const [estados, setEstados] = useState<Record<string, EstadoGuardado>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  // Una clave por intento de envío: se reutiliza si el intento anterior no tuvo respuesta definitiva.
  const claveEnvio = useRef<string | null>(null);

  useEffect(() => {
    const control = new AbortController();
    let vigente = true;
    async function cargar() {
      setError(null);
      setNoEncontrada(false);
      try {
        const datos = await obtenerConversacion(conversacionId, control.signal);
        if (!vigente) return;
        // Ya enviada: aquí no se edita ni se envía; su pantalla es el hilo.
        if (datos.estado !== 'BORRADOR') return router.replace(`/conversaciones/${conversacionId}`);
        setCampos(Object.fromEntries(datos.preguntas.map((q) => [q.id, camposDe(q.respuesta)])));
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

  const cambiar = (id: string, cambio: Partial<Campos>) => setCampos((c) => ({ ...c, [id]: { ...c[id], ...cambio } }));
  const marcar = (id: string, estado: EstadoGuardado) => setEstados((e) => ({ ...e, [id]: estado }));

  async function guardar(q: Pregunta, valor: ValorRespuesta) {
    const invalido = validarRespuesta(q, valor);
    if (invalido) return marcar(q.id, { fase: 'error', mensaje: invalido });
    marcar(q.id, { fase: 'guardando' });
    try {
      const r = await responderPregunta(conversacionId, q.id, valor);
      const respuesta = { id: q.respuesta?.id ?? '', opcion: r.opcion, texto: r.texto, numero: r.numero };
      cambiar(q.id, camposDe(respuesta));
      // Responder sólo puede quitar pendientes: se actualiza aquí sin otro GET.
      setConversacion((c) => c && {
        ...c,
        preguntas: c.preguntas.map((p) => (p.id === q.id ? { ...p, respuesta } : p)),
        puntosPendientes: c.puntosPendientes.filter((p) => p.referencia !== q.id),
      });
      marcar(q.id, { fase: 'guardado' });
    } catch (e) {
      if (e instanceof ApiError && e.esSesionInvalida) return;
      const mensaje = e instanceof ApiError && e.codigo === 'DATOS_INVALIDOS' ? `Revise los datos: ${e.message}.` : mensajeParaUsuario(e);
      marcar(q.id, { fase: 'error', mensaje });
      if (!(e instanceof ApiError && (e.status === 409 || e.status === 422))) await alertarError(e);
    }
  }

  function elegir(q: Pregunta, opcion: string) {
    const { texto } = campos[q.id];
    cambiar(q.id, { opcion, ...(q.tipoRespuesta === 'numero_u_opcion' ? { numero: '' } : {}) });
    void guardar(q, q.tipoRespuesta === 'opcion_con_texto' && texto.trim() ? { opcion, texto } : { opcion });
  }

  function guardarCampo(q: Pregunta, evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const { opcion, texto, numero } = campos[q.id];
    if (q.tipoRespuesta === 'numero_u_opcion') {
      if (numero.trim()) cambiar(q.id, { opcion: null });
      return void guardar(q, numero.trim() ? { numero: Number(numero.replace(',', '.')) } : {});
    }
    if (q.tipoRespuesta === 'opcion_con_texto') {
      return void guardar(q, { opcion: opcion ?? undefined, texto: texto.trim() ? texto : undefined });
    }
    void guardar(q, { texto });
  }

  async function enviar() {
    if (enviando) return;
    setEnviando(true);
    setErrorEnvio(null);
    claveEnvio.current ??= crypto.randomUUID();
    try {
      await enviarConversacion(conversacionId, claveEnvio.current);
      // enviando se queda en true: la pantalla se va y no debe aceptar otro envío.
      router.push('/conversaciones');
    } catch (e) {
      // Sin respuesta o 5xx: el envío pudo haberse hecho, así que el reintento usa la misma clave.
      const incierto = e instanceof ApiError && (e.esFalloDeRed || e.status >= 500);
      if (!incierto) claveEnvio.current = null;
      setEnviando(false);
      if (e instanceof ApiError && e.esSesionInvalida) return;
      // 422 por pendientes y 409 se muestran junto al botón (L-26).
      if (e instanceof ApiError && e.codigo === 'DATOS_INVALIDOS') {
        setErrorEnvio(`Revise los datos: ${e.message}.`);
      } else if (e instanceof ApiError && (e.codigo === 'CONVERSACION_INCOMPLETA' || e.status === 409)) {
        setErrorEnvio(mensajeParaUsuario(e));
      } else {
        await alertarError(e);
      }
    }
  }

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

  const pendientes = textoPendientes(conversacion.puntosPendientes, conversacion.preguntas);

  return (
    <AppShell
      titulo={conversacion.titulo}
      conVolver
      mostrarBarra={false}
      pie={
        <div className={estilos.barraAcciones}>
          {pendientes && (
            <p className={`${estilos.apoyo} t-body-s`} role="status">
              {pendientes}
            </p>
          )}
          {/* Junto al botón: siempre a la vista en un teléfono (L-26). */}
          {errorEnvio && (
            <p className={acceso.errorGeneral} role="alert">
              <Icono nombre="alerta" tam={16} />
              <span className="t-body-s">{errorEnvio}</span>
            </p>
          )}
          <Button
            fullWidth
            disabled={!listoParaEnviar(conversacion.puntosPendientes)}
            loading={enviando}
            loadingText="Enviando…"
            onClick={enviar}
          >
            Enviar
          </Button>
        </div>
      }
    >
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

          <h2 className={`${estilos.rotulo} t-overline`}>PREGUNTAS DE CONTEXTO</h2>
          {conversacion.preguntas.map((q) => {
            const c = campos[q.id];
            const estado = estados[q.id];
            const conOpciones = q.tipoRespuesta !== 'texto';
            const conCampo = q.tipoRespuesta === 'texto' || q.tipoRespuesta === 'opcion_con_texto' || q.tipoRespuesta === 'numero_u_opcion';
            return (
              <section key={q.id} className={estilos.tarjeta} aria-labelledby={`pregunta-${q.id}`}>
                <h3 id={`pregunta-${q.id}`} className="t-body-m-fuerte">
                  {q.texto}
                  {q.obligatoria && <span className={`${estilos.apoyo} t-label`}> · Obligatoria</span>}
                </h3>

                {conCampo && (
                  <form className={estilos.pila} onSubmit={(e) => guardarCampo(q, e)} noValidate>
                    {q.tipoRespuesta === 'numero_u_opcion' ? (
                      <Input
                        label="Temperatura (°C)"
                        hint="Entre 30 y 45 °C"
                        inputMode="decimal"
                        value={c.numero}
                        onChange={(e) => cambiar(q.id, { numero: e.target.value })}
                      />
                    ) : (
                      <Input
                        label={q.tipoRespuesta === 'texto' ? 'Su respuesta' : 'Detalle (opcional)'}
                        maxLength={2000}
                        value={c.texto}
                        onChange={(e) => cambiar(q.id, { texto: e.target.value })}
                      />
                    )}
                    <span>
                      <Button type="submit" size="sm" variant="secundario" disabled={estado?.fase === 'guardando'}>
                        Guardar
                      </Button>
                    </span>
                  </form>
                )}

                {conOpciones && (
                  <div className={estilos.listaChips} role="radiogroup" aria-labelledby={`pregunta-${q.id}`}>
                    {q.opciones.map((o) => (
                      <ChipFiltro key={o} activo={c.opcion === o} onClick={() => elegir(q, o)} rolAria="radio">
                        {o}
                      </ChipFiltro>
                    ))}
                  </div>
                )}

                {estado?.fase === 'error' ? (
                  <p className={acceso.errorGeneral} role="alert">
                    <Icono nombre="alerta" tam={16} />
                    <span className="t-body-s">{estado.mensaje}</span>
                  </p>
                ) : (
                  estado && (
                    <p className={`${estilos.apoyo} t-body-s`} role="status">
                      {estado.fase === 'guardando' ? 'Guardando…' : 'Guardado'}
                    </p>
                  )
                )}
              </section>
            );
          })}
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
