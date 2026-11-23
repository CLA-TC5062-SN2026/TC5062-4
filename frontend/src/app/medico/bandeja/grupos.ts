/** Agrupación de la bandeja de la médica, sin React para poder probarla sola. */
import type { Conversacion, EstadoConversacion } from '@/services/conversacionesService';

const GRUPOS: { titulo: string; estados: EstadoConversacion[] }[] = [
  { titulo: 'Enviadas', estados: ['ENVIADA'] },
  { titulo: 'En revisión', estados: ['EN_REVISION'] },
  { titulo: 'Con indicaciones', estados: ['CON_INDICACIONES'] },
];

export interface GrupoBandeja {
  titulo: string;
  conversaciones: Conversacion[];
}

/**
 * Grupos en el orden del guion; el resto de estados (información solicitada, cerrada,
 * sin médico) va al final en «Otras». Conserva el orden del backend (último evento)
 * y omite los grupos vacíos.
 */
export function agruparBandeja(conversaciones: Conversacion[]): GrupoBandeja[] {
  const conocidos = GRUPOS.flatMap((g) => g.estados);
  return [
    ...GRUPOS.map((g) => ({ titulo: g.titulo, conversaciones: conversaciones.filter((c) => g.estados.includes(c.estado)) })),
    { titulo: 'Otras', conversaciones: conversaciones.filter((c) => !conocidos.includes(c.estado)) },
  ].filter((g) => g.conversaciones.length > 0);
}
