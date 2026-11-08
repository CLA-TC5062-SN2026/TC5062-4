import type { ElementType, ReactNode } from 'react';
import estilos from './Card.module.css';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /**
   * Nivel del encabezado. El componente NO lo adivina: el nivel correcto
   * depende de dónde se coloque la tarjeta, y saltarse niveles rompe la
   * navegación por encabezados del lector de pantalla (WCAG 1.3.1).
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Controles alineados a la derecha del encabezado. */
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: CardPadding;
  /** Etiqueta HTML del contenedor: `article` para contenido autónomo, `li` en listas. */
  as?: ElementType;
  /** Resalta la tarjeta al pasar el cursor. No la hace pulsable por sí solo. */
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
}

const RELLENOS: Record<CardPadding, string> = {
  none: estilos.sinRelleno,
  sm: estilos.rellenoSm,
  md: estilos.rellenoMd,
  lg: estilos.rellenoLg,
};

export function Card({
  title,
  subtitle,
  headingLevel = 3,
  actions,
  footer,
  padding = 'md',
  as: Contenedor = 'div',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps & Record<string, unknown>) {
  const Encabezado = `h${headingLevel}` as ElementType;
  const tieneEncabezado = Boolean(title || subtitle || actions);

  return (
    <Contenedor
      className={[estilos.tarjeta, RELLENOS[padding], interactive ? estilos.interactiva : null, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {tieneEncabezado && (
        <div className={estilos.encabezado}>
          <div className={estilos.titulos}>
            {title && <Encabezado className={estilos.titulo}>{title}</Encabezado>}
            {subtitle && <p className={estilos.subtitulo}>{subtitle}</p>}
          </div>
          {actions && <div className={estilos.acciones}>{actions}</div>}
        </div>
      )}

      {children && <div className={estilos.cuerpo}>{children}</div>}

      {footer && <div className={estilos.pie}>{footer}</div>}
    </Contenedor>
  );
}

export default Card;
