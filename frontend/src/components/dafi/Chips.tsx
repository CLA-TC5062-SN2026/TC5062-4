import type { ReactNode } from 'react';
import Icono from '@/components/ui/Icono';
import estilos from './Chips.module.css';

/* ========================================================================
   Chip de estado de conversación
   ===================================================================== */
export type EstadoConversacion =
  | 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'INFO_SOLICITADA'
  | 'CON_INDICACIONES' | 'CERRADA' | 'SIN_MEDICO';

/** Texto visible de cada estado. El enum viaja en mayúsculas con guión bajo. */
const ETIQUETA_ESTADO: Record<EstadoConversacion, string> = {
  BORRADOR: 'BORRADOR',
  ENVIADA: 'ENVIADA',
  EN_REVISION: 'EN REVISIÓN',
  INFO_SOLICITADA: 'INFO SOLICITADA',
  CON_INDICACIONES: 'CON INDICACIONES',
  CERRADA: 'CERRADA',
  SIN_MEDICO: 'SIN MÉDICO',
};

export function ChipEstado({ estado }: { estado: EstadoConversacion }) {
  return (
    <span className={`${estilos.base} ${estilos.estado} ${estilos[estado]} t-overline`}>
      {/* El color por sí solo no comunica el estado: el texto siempre está presente (WCAG 1.4.1). */}
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

/* ========================================================================
   Chip de etiqueta (catálogo de la tabla `etiqueta`)
   ===================================================================== */
export type CodigoEtiqueta = 'piel' | 'fiebre' | 'estomago' | 'respiratorio' | 'otro';

const NOMBRE_ETIQUETA: Record<CodigoEtiqueta, string> = {
  piel: 'Piel',
  fiebre: 'Fiebre',
  estomago: 'Estómago',
  respiratorio: 'Respiratorio',
  otro: 'Otro',
};

export function ChipEtiqueta({ codigo }: { codigo: CodigoEtiqueta }) {
  return (
    <span className={`${estilos.base} ${estilos.etiqueta} t-label`}>
      <span className={`${estilos.punto} ${estilos[codigo]}`} aria-hidden="true" />
      {NOMBRE_ETIQUETA[codigo]}
    </span>
  );
}

/* ========================================================================
   Marca de prioridad indicada por la familia (RF-09-AC-4)
   ===================================================================== */
export function MarcaPrioridad() {
  return (
    <span className={`${estilos.base} ${estilos.prioridad} t-overline`}>
      <Icono nombre="reloj" tam={12} />
      Prioridad indicada por la familia
    </span>
  );
}

/* ========================================================================
   Chip seleccionable
   ===================================================================== */
export interface ChipFiltroProps {
  children: ReactNode;
  activo?: boolean;
  onClick?: () => void;
  /** Para grupos de selección única o múltiple, expone el estado al lector. */
  rolAria?: 'radio' | 'checkbox' | 'tab';
}

export function ChipFiltro({ children, activo = false, onClick, rolAria }: ChipFiltroProps) {
  const propsAria = rolAria === 'tab'
    ? { role: 'tab' as const, 'aria-selected': activo }
    : rolAria
      ? { role: rolAria, 'aria-checked': activo }
      : { 'aria-pressed': activo };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${estilos.base} ${estilos.filtro} ${
        activo ? estilos.filtroActivo : estilos.filtroInactivo
      } t-body-m-fuerte`}
      {...propsAria}
    >
      {children}
    </button>
  );
}
