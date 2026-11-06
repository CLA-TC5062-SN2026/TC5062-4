'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import estilos from './Input.module.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-describedby'> {
  /** Obligatorio: un campo sin etiqueta visible incumple WCAG 3.3.2. */
  label: string;
  /** Texto de ayuda permanente (formato esperado, límites…). */
  hint?: string;
  /** Mensaje de error. Si está presente, el campo se marca como inválido. */
  error?: string;
  /** Icono decorativo dentro del campo. */
  startIcon?: ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    startIcon,
    fullWidth = true,
    required,
    disabled,
    id,
    className,
    containerClassName,
    ...rest
  },
  ref
) {
  // useId da un identificador estable entre el HTML del servidor y la
  // hidratación en el cliente. Con Math.random() React avisa de desajuste.
  const generado = useId();
  const idInput = id ?? `campo-${generado}`;
  const idAyuda = `${idInput}-ayuda`;
  const idError = `${idInput}-error`;

  // WCAG 1.3.1 y 3.3.1: la ayuda y el error se anuncian al enfocar el campo
  // porque van enlazados por aria-describedby, no sólo colocados cerca.
  const describedBy = [hint ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={[estilos.campo, fullWidth ? estilos.anchoCompleto : null, containerClassName]
        .filter(Boolean)
        .join(' ')}
    >
      <label htmlFor={idInput} className={estilos.etiqueta}>
        {label}
        {required && (
          <>
            {/* El asterisco es decorativo; el dato real va en texto para el lector. */}
            <span className={estilos.marcaObligatorio} aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        )}
      </label>

      <div className={estilos.contenedor}>
        {startIcon && (
          <span className={estilos.icono} aria-hidden="true">
            {startIcon}
          </span>
        )}
        <input
          ref={ref}
          id={idInput}
          required={required}
          disabled={disabled}
          // WCAG 4.1.2: el estado inválido viaja en el árbol de accesibilidad,
          // no sólo en el color del borde (que además sería WCAG 1.4.1).
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            estilos.input,
            startIcon ? estilos.conIcono : null,
            error ? estilos.invalido : null,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
      </div>

      {hint && !error && (
        <p id={idAyuda} className={estilos.ayuda}>
          {hint}
        </p>
      )}

      {error && (
        // role="alert" hace que el lector lo lea en cuanto aparece, sin esperar
        // a que el usuario vuelva a enfocar el campo (WCAG 3.3.1).
        <p id={idError} role="alert" className={estilos.error}>
          <svg
            className={estilos.iconoError}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

export default Input;
