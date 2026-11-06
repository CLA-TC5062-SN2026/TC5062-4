import type { SVGProps } from 'react';

/**
 * Iconos del sistema de diseño (trazo de 2, extremos redondeados), los mismos
 * que usa el archivo de Figma. Son decorativos por omisión: llevan
 * `aria-hidden`, así que el significado tiene que estar en el texto que los
 * acompaña. Si un icono es la única etiqueta de un control, el control necesita
 * su propio `aria-label` (WCAG 4.1.2).
 */
export type NombreIcono =
  | 'alerta' | 'chevronDerecha' | 'flechaIzquierda' | 'mas' | 'usuario' | 'usuarios'
  | 'mensaje' | 'campana' | 'camara' | 'reloj' | 'check' | 'enviar' | 'buscar'
  | 'escudo' | 'actividad' | 'lapiz' | 'candado' | 'correo' | 'info' | 'archivo'
  | 'filtro' | 'telefono' | 'ojoTachado' | 'papelera';

const TRAZOS: Record<NombreIcono, React.ReactNode> = {
  alerta: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  chevronDerecha: <path d="m9 18 6-6-6-6" />,
  flechaIzquierda: <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>,
  mas: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  usuario: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  usuarios: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  mensaje: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  campana: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  camara: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>,
  reloj: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  enviar: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  buscar: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  escudo: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  actividad: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  lapiz: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  candado: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  correo: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  archivo: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v5h5" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  filtro: <><path d="M3 6h18" /><path d="M7 12h10" /><path d="M10 18h4" /></>,
  telefono: <path d="M13.83 19a16 16 0 0 1-8.8-8.8 2 2 0 0 1 .44-2.2l1.6-1.6a1 1 0 0 0 0-1.42L5.3 2.7a1 1 0 0 0-1.42 0L2.7 3.88A4 4 0 0 0 2 7.5c0 7.5 7 14.5 14.5 14.5a4 4 0 0 0 3.62-.7l1.18-1.18a1 1 0 0 0 0-1.42l-2.28-2.28a1 1 0 0 0-1.42 0l-1.6 1.6a2 2 0 0 1-2.17.45z" />,
  ojoTachado: <><path d="m15 18-.722-3.25" /><path d="M2 8a10.645 10.645 0 0 0 20 0" /><path d="m20 15-1.726-2.05" /><path d="M4 15l1.726-2.05" /><path d="M9 18l.722-3.25" /></>,
  papelera: <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
};

export interface IconoProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  nombre: NombreIcono;
  tam?: number;
  /** Grosor del trazo. Los iconos pequeños suelen necesitar algo más. */
  grosor?: number;
}

export function Icono({ nombre, tam = 20, grosor = 2, ...rest }: IconoProps) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

export default Icono;
