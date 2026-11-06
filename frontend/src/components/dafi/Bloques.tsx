'use client';

import type { ReactNode } from 'react';
import Icono from '@/components/ui/Icono';
import Button from '@/components/ui/Button';
import { Avatar } from './Piezas';
import { ChipEstado, ChipEtiqueta, MarcaPrioridad } from './Chips';
import type { CodigoEtiqueta, EstadoConversacion } from './Chips';
import estilos from './Bloques.module.css';

/* ===================== Tarjeta de conversación ===================== */
export interface TarjetaConversacionProps {
  contexto: string;
  titulo: string;
  estado: EstadoConversacion;
  etiquetas: CodigoEtiqueta[];
  prioridad?: boolean;
  autor: string;
  cuando: string;
  seleccionada?: boolean;
  onClick?: () => void;
}

export function TarjetaConversacion({
  contexto, titulo, estado, etiquetas, prioridad = false, autor, cuando,
  seleccionada = false, onClick,
}: TarjetaConversacionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${estilos.conversacion} ${seleccionada ? estilos.conversacionSeleccionada : ''}`}
    >
      <span className={estilos.convCabecera}>
        <span className={`${estilos.convContexto} t-label`}>{contexto}</span>
        <ChipEstado estado={estado} />
      </span>

      <span className={`${estilos.convTitulo} t-heading-s`}>{titulo}</span>

      <span className={estilos.convEtiquetas}>
        {etiquetas.map((e) => <ChipEtiqueta key={e} codigo={e} />)}
      </span>

      {prioridad && (
        <span className={estilos.convPrioridad}>
          <MarcaPrioridad />
        </span>
      )}

      <span className={estilos.convSeparador} aria-hidden="true" />

      <span className={estilos.convPie}>
        <span className={`${estilos.convAutor} t-body-s`}>
          <Icono nombre="usuario" tam={14} />
          {autor}
        </span>
        <span className={`${estilos.convCuando} t-body-s`}>
          {cuando}
          <Icono nombre="chevronDerecha" tam={16} />
        </span>
      </span>
    </button>
  );
}

/* ===================== Tarjeta de perfil ===================== */
export type TipoInsignia = 'aviso' | 'compartido' | 'pendiente';

export interface TarjetaPerfilProps {
  nombre: string;
  meta: string;
  insignias?: { texto: string; tipo: TipoInsignia }[];
  onClick?: () => void;
}

const CLASE_INSIGNIA: Record<TipoInsignia, string> = {
  aviso: estilos.insigniaAviso,
  compartido: estilos.insigniaCompartido,
  pendiente: estilos.insigniaPendiente,
};

export function TarjetaPerfil({ nombre, meta, insignias = [], onClick }: TarjetaPerfilProps) {
  return (
    <button type="button" onClick={onClick} className={estilos.perfil}>
      <Avatar nombre={nombre} />
      <span className={estilos.perfilCuerpo}>
        <span className={`${estilos.perfilNombre} t-heading-s`}>{nombre}</span>
        <span className={`${estilos.perfilMeta} t-body-s`}>{meta}</span>
        {insignias.length > 0 && (
          <span className={estilos.perfilInsignias}>
            {insignias.map((i) => (
              <span key={i.texto} className={`${estilos.insignia} ${CLASE_INSIGNIA[i.tipo]} t-overline`}>
                {i.tipo === 'pendiente' && <Icono nombre="candado" tam={12} />}
                {i.texto}
              </span>
            ))}
          </span>
        )}
      </span>
      <Icono nombre="chevronDerecha" tam={18} className={estilos.perfilChevron} />
    </button>
  );
}

/* ===================== Pregunta de contexto (RF-10) ===================== */
export interface PreguntaProps {
  codigo: string;
  texto: string;
  obligatoria: boolean;
  /** Valor respondido. Si falta y es obligatoria, se marca como pendiente. */
  respuesta?: string;
}

export function Pregunta({ codigo, texto, obligatoria, respuesta }: PreguntaProps) {
  const pendiente = obligatoria && !respuesta;
  return (
    <article className={`${estilos.pregunta} ${pendiente ? estilos.preguntaPendiente : ''}`}>
      <div className={estilos.preguntaCabecera}>
        <span className={`${estilos.preguntaCodigo} t-mono`}>{codigo}</span>
        <span className={`${estilos.preguntaObligatoria} t-overline`}>
          {obligatoria ? 'OBLIGATORIA' : 'OPCIONAL'}
        </span>
      </div>

      <p className={`${estilos.preguntaTexto} t-body-m-fuerte`}>{texto}</p>

      {respuesta ? (
        <p className={`${estilos.preguntaRespuesta} ${estilos.respondida} t-body-m`}>
          <Icono nombre="check" tam={14} />
          {respuesta}
        </p>
      ) : pendiente ? (
        <p className={`${estilos.preguntaRespuesta} ${estilos.pendiente} t-body-m`}>
          <Icono nombre="alerta" tam={14} />
          Falta responder {codigo}
        </p>
      ) : (
        <p className={`${estilos.preguntaRespuesta} ${estilos.sinResponder} t-body-m`}>
          Sin responder (opcional)
        </p>
      )}
    </article>
  );
}

/* ===================== Eventos de la bitácora ===================== */
export function EventoMensaje({
  autor, rol, hora, texto, fotos,
}: {
  autor: string;
  rol: 'familia' | 'medico';
  hora: string;
  texto: string;
  fotos?: number;
}) {
  return (
    <article className={estilos.evento}>
      <Avatar nombre={autor} rol={rol} />
      <div className={estilos.eventoCuerpo}>
        <header className={estilos.eventoCabecera}>
          <span className={`${estilos.eventoAutor} t-body-m-fuerte`}>{autor}</span>
          <span className={estilos.eventoPunto} aria-hidden="true">·</span>
          <time className={`${estilos.eventoHora} t-body-s`}>{hora}</time>
        </header>
        <div className={`${estilos.burbuja} ${rol === 'familia' ? estilos.burbujaFamilia : estilos.burbujaMedico}`}>
          <p className="t-body-m">{texto}</p>
          {fotos ? (
            <span className={`${estilos.adjunto} t-label`}>
              <Icono nombre="camara" tam={14} />
              {fotos} fotos adjuntas
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function EventoCambioEstado({ desde, hasta, hora }: { desde: string; hasta: string; hora: string }) {
  return (
    <div className={estilos.cambioEstado}>
      <span className={estilos.cambioLinea} aria-hidden="true" />
      <span className={`${estilos.cambioPastilla} t-overline`}>
        <Icono nombre="check" tam={12} />
        {desde} → {hasta} · {hora}
      </span>
      <span className={estilos.cambioLinea} aria-hidden="true" />
    </div>
  );
}

export function EventoAviso({
  tipo, titulo, detalle, decision,
}: {
  tipo: 'solicitud' | 'indicacion';
  titulo: string;
  detalle: string;
  decision?: string;
}) {
  return (
    <article
      className={`${estilos.eventoAviso} ${
        tipo === 'solicitud' ? estilos.avisoSolicitud : estilos.avisoIndicacion
      }`}
    >
      <Icono nombre={tipo === 'solicitud' ? 'alerta' : 'archivo'} tam={16} />
      <div className={estilos.eventoAvisoCuerpo}>
        <p className="t-body-m-fuerte">{titulo}</p>
        <p className={`${estilos.eventoAvisoDetalle} t-body-s`}>{detalle}</p>
        {decision && <span className={`${estilos.decision} t-overline`}>{decision}</span>}
      </div>
    </article>
  );
}

/* ===================== Resumen de contexto ===================== */
export type EstadoResumen = 'disponible' | 'desactivado_por_familia' | 'no_disponible';

export interface GrupoResumen {
  titulo: string;
  hechos: string[];
}

const MENSAJE_RESUMEN: Record<Exclude<EstadoResumen, 'disponible'>, string> = {
  desactivado_por_familia:
    'La familia desactivó el resumen de contexto para este perfil. Puede consultar el historial completo si la familia comparte el historial.',
  no_disponible: 'Todavía no hay hechos registrados en el historial de este perfil.',
};

export function TarjetaResumen({
  estado = 'disponible',
  grupos = [],
}: {
  estado?: EstadoResumen;
  grupos?: GrupoResumen[];
}) {
  return (
    <section className={estilos.resumen} aria-labelledby="titulo-resumen">
      <header className={estilos.resumenCabecera}>
        <h2 id="titulo-resumen" className={`${estilos.resumenTitulo} t-heading-s`}>
          <Icono nombre="archivo" tam={16} />
          Resumen de contexto
        </h2>
        {/* DAFI sólo reúne hechos del historial: no interpreta ni diagnostica. */}
        <span className={`${estilos.resumenSello} t-overline`}>SOLO HECHOS DEL HISTORIAL</span>
      </header>

      {estado === 'disponible' ? (
        grupos.map((g) => (
          <div key={g.titulo} className={estilos.resumenGrupo}>
            <h3 className={`${estilos.resumenGrupoTitulo} t-overline`}>{g.titulo}</h3>
            <ul className={estilos.resumenLista}>
              {g.hechos.map((h) => (
                <li key={h} className={estilos.resumenItem}>
                  <span className={estilos.resumenBolita} aria-hidden="true" />
                  <span className={estilos.resumenTextos}>
                    <span className={`${estilos.resumenHecho} t-body-m`}>{h}</span>
                    <button type="button" className={`${estilos.resumenOrigen} t-label`}>
                      Ver el mensaje de origen
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p className={estilos.resumenNoDisponible}>
          <Icono nombre="ojoTachado" tam={16} />
          <span className="t-body-m">{MENSAJE_RESUMEN[estado]}</span>
        </p>
      )}
    </section>
  );
}

/* ===================== Estado vacío ===================== */
export function EstadoVacio({
  icono, titulo, texto, accion,
}: {
  icono: 'actividad' | 'mensaje' | 'usuarios';
  titulo: string;
  texto: string;
  accion?: ReactNode;
}) {
  return (
    <div className={estilos.vacio}>
      <span className={estilos.vacioAnillo}>
        <Icono nombre={icono} tam={24} />
      </span>
      <p className={`${estilos.vacioTitulo} t-heading-s`}>{titulo}</p>
      <p className={`${estilos.vacioTexto} t-body-m`}>{texto}</p>
      {accion}
    </div>
  );
}

/* ===================== Compositor de mensaje ===================== */
export function Compositor({ onEnviar }: { onEnviar?: (texto: string) => void }) {
  return (
    <form
      className={estilos.compositor}
      onSubmit={(e) => {
        e.preventDefault();
        const campo = (e.currentTarget.elements.namedItem('mensaje') as HTMLInputElement | null);
        if (campo?.value.trim()) {
          onEnviar?.(campo.value.trim());
          campo.value = '';
        }
      }}
    >
      <button type="button" className={estilos.compositorBoton} aria-label="Adjuntar una foto">
        <Icono nombre="camara" tam={20} />
      </button>
      <input
        name="mensaje"
        className={`${estilos.compositorCampo} t-body-l`}
        placeholder="Escriba un mensaje"
        aria-label="Mensaje para el médico"
        maxLength={4000}
      />
      <button type="submit" className={estilos.compositorEnviar} aria-label="Enviar el mensaje">
        <Icono nombre="enviar" tam={20} />
      </button>
    </form>
  );
}

export { Button };
