'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import estilos from './Button.module.css';

export type ButtonVariant = 'primario' | 'secundario' | 'fantasma' | 'peligro';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Jerarquía visual. Una sola acción `primario` por pantalla. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra el indicador de carga y bloquea la interacción. */
  loading?: boolean;
  /** Texto mientras `loading` es true. Reemplaza al nombre accesible. */
  loadingText?: string;
  fullWidth?: boolean;
  /** Icono decorativo a la izquierda. Se oculta a lectores de pantalla. */
  startIcon?: ReactNode;
}

/** Indicador de carga. `aria-hidden` porque el estado lo comunica `aria-busy`. */
function Spinner() {
  return (
    <svg
      className={estilos.spinner}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primario',
    size = 'md',
    loading = false,
    loadingText = 'Procesando…',
    fullWidth = false,
    startIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const clases = [
    estilos.boton,
    estilos[variant],
    estilos[size],
    fullWidth ? estilos.anchoCompleto : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      // El scaffold de un botón suelto hereda type="submit" dentro de un <form>
      // y envía el formulario sin querer: por eso el valor por defecto es "button".
      type={type}
      // WCAG 4.1.2: el estado ocupado se expone por `aria-busy`, no sólo por el spinner.
      aria-busy={loading || undefined}
      // `disabled` nativo lo saca del orden de tabulación mientras carga, lo que
      // evita envíos duplicados (el backend además exige Idempotency-Key).
      disabled={disabled || loading}
      className={clases}
      {...rest}
    >
      {loading ? (
        <Spinner />
      ) : startIcon ? (
        <span className={estilos.icono} aria-hidden="true">
          {startIcon}
        </span>
      ) : null}
      <span className={estilos.etiqueta}>{loading ? loadingText : children}</span>
    </button>
  );
});

export default Button;
