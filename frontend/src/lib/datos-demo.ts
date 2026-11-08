/**
 * Datos ficticios que reproducen exactamente el contenido de las pantallas
 * del archivo de Figma del equipo. Sirven para montar la interfaz mientras el
 * cliente del API (src/services) se conecta pantalla por pantalla.
 *
 * NO son datos reales de ningún paciente.
 */
import type { CodigoEtiqueta, EstadoConversacion } from '@/components/dafi/Chips';
import type { TipoInsignia } from '@/components/dafi/Bloques';

export interface PerfilDemo {
  id: string;
  nombre: string;
  meta: string;
  insignias: { texto: string; tipo: TipoInsignia }[];
  datos: { clave: string; valor: string }[];
}

export const PERFILES: PerfilDemo[] = [
  {
    id: 'mateo',
    nombre: 'Mateo Ruán',
    meta: 'Menor · 4 años',
    insignias: [{ texto: 'Alergias: 1', tipo: 'aviso' }],
    datos: [
      { clave: 'Fecha de nacimiento', valor: '2021-03-14' },
      { clave: 'Alergias', valor: 'Penicilina' },
      { clave: 'Medicamentos', valor: 'Salbutamol' },
      { clave: 'Resumen de contexto', valor: 'Activado' },
    ],
  },
  {
    id: 'rosa',
    nombre: 'Rosa Aguilar',
    meta: 'Adulto representado · 71 años',
    insignias: [{ texto: 'Pendiente de consentimiento', tipo: 'pendiente' }],
    datos: [
      { clave: 'Fecha de nacimiento', valor: '1955-06-02' },
      { clave: 'Estado', valor: 'Pendiente de consentimiento' },
    ],
  },
  {
    id: 'maria',
    nombre: 'María Ruán',
    meta: 'Perfil propio · 38 años',
    insignias: [{ texto: 'Compartido con cocuidador', tipo: 'compartido' }],
    datos: [
      { clave: 'Fecha de nacimiento', valor: '1988-01-23' },
      { clave: 'Alergias', valor: 'Ninguna registrada' },
    ],
  },
];

export interface ConversacionDemo {
  id: string;
  contexto: string;
  titulo: string;
  estado: EstadoConversacion;
  etiquetas: CodigoEtiqueta[];
  prioridad: boolean;
  autor: string;
  cuando: string;
}

/** Historial del perfil de Mateo (pantalla 6 y D3). */
export const HISTORIAL_MATEO: ConversacionDemo[] = [
  {
    id: 'c-ronchas',
    contexto: 'Mateo · 4 años',
    titulo: 'Ronchas en el brazo desde ayer',
    estado: 'ENVIADA',
    etiquetas: ['piel', 'fiebre'],
    prioridad: true,
    autor: 'Dra. Lucía Torres',
    cuando: 'hace 2 h',
  },
  {
    id: 'c-fiebre',
    contexto: 'Mateo · 4 años',
    titulo: 'Fiebre de 38.9 °C desde el martes',
    estado: 'CON_INDICACIONES',
    etiquetas: ['fiebre'],
    prioridad: false,
    autor: 'Dra. Lucía Torres',
    cuando: 'hace 3 semanas',
  },
  {
    id: 'c-tos',
    contexto: 'Mateo · 4 años',
    titulo: 'Tos seca por las noches',
    estado: 'CERRADA',
    etiquetas: ['respiratorio'],
    prioridad: false,
    autor: 'Dra. Lucía Torres',
    cuando: 'hace 2 meses',
  },
];

/** Bandeja del médico (pantalla 10 y D5). */
export const BANDEJA_MEDICO: ConversacionDemo[] = [
  {
    id: 'c-ronchas',
    contexto: 'Familia Ruán · Mateo, 4 años',
    titulo: 'Ronchas en el brazo desde ayer',
    estado: 'ENVIADA',
    etiquetas: ['piel', 'fiebre'],
    prioridad: true,
    autor: 'María Ruán',
    cuando: 'hace 2 h',
  },
  {
    id: 'c-tos-ana',
    contexto: 'Familia Salinas · Ana, 8 años',
    titulo: 'Tos por las noches desde el lunes',
    estado: 'EN_REVISION',
    etiquetas: ['respiratorio'],
    prioridad: false,
    autor: 'Carlos Salinas',
    cuando: 'ayer',
  },
  {
    id: 'c-estomago-luis',
    contexto: 'Familia Pérez · Luis, 62 años',
    titulo: 'Malestar de estómago después de comer',
    estado: 'CON_INDICACIONES',
    etiquetas: ['estomago'],
    prioridad: false,
    autor: 'Luis Pérez',
    cuando: 'hace 3 d',
  },
];

/** Catálogo de etiquetas, versión 1 del SRS (sección 3.0). */
export const CATALOGO_ETIQUETAS: { codigo: CodigoEtiqueta; nombre: string }[] = [
  { codigo: 'piel', nombre: 'Piel' },
  { codigo: 'fiebre', nombre: 'Fiebre' },
  { codigo: 'estomago', nombre: 'Estómago' },
  { codigo: 'respiratorio', nombre: 'Respiratorio' },
  { codigo: 'otro', nombre: 'Otro' },
];

/** Preguntas de contexto del borrador de «Ronchas en el brazo» (RF-10). */
export const PREGUNTAS_BORRADOR = [
  { codigo: 'G1', texto: '¿Desde cuándo?', obligatoria: true, respuesta: 'Ayer' },
  { codigo: 'G2', texto: '¿Qué le preocupa?', obligatoria: true, respuesta: undefined },
  { codigo: 'P1', texto: '¿En qué parte del cuerpo?', obligatoria: true, respuesta: 'Brazo derecho' },
  { codigo: 'F1', texto: 'Temperatura más alta que midió', obligatoria: true, respuesta: '38.2 °C' },
  { codigo: 'G4', texto: '¿Algo más que quiera contarle a su médico?', obligatoria: false, respuesta: undefined },
];

/** Médicos del círculo de la familia Ruán. */
export const CIRCULO_MEDICO = [
  { id: 'lucia', nombre: 'Dra. Lucía Torres', detalle: 'Pediatría · en el círculo desde feb 2026' },
  { id: 'andres', nombre: 'Dr. Andrés Salas', detalle: 'Medicina familiar · desde ene 2026' },
];

/** Grupos del resumen de contexto (enum grupo_resumen). */
export const RESUMEN_MATEO = [
  {
    titulo: 'ALERGIAS Y MEDICAMENTOS',
    hechos: ['Alergia registrada: penicilina', 'Toma salbutamol de uso continuo'],
  },
  {
    titulo: 'EPISODIOS ANTERIORES',
    hechos: [
      'Mar 2026 · Piel: dermatitis en el pliegue del codo',
      'Ene 2026 · Fiebre: 38.9 °C por tres días',
    ],
  },
  {
    titulo: 'INDICACIONES PREVIAS',
    hechos: ['Feb 2026 · Cuidado en casa, revaloración a las 48 h'],
  },
];

/** Secciones de la bandeja (enum SeccionBandeja). */
export const SECCIONES_BANDEJA = [
  { id: 'prioridad_familia', nombre: 'Prioridad de la familia' },
  { id: 'esperan_respuesta', nombre: 'Esperan respuesta' },
  { id: 'esperando_familia', nombre: 'Esperando a la familia' },
];
