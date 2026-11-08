import estilos from './Cargando.module.css';

export interface CargandoProps {
  mensaje?: string;
  pantallaCompleta?: boolean;
}

/**
 * Indicador de carga.
 *
 * `role="status"` + `aria-live="polite"` hacen que un lector de pantalla
 * anuncie el cambio sin interrumpir lo que la persona esté haciendo: sin esto,
 * quien no ve la rueda no sabe que algo está en marcha (WCAG 4.1.3).
 */
export function Cargando({ mensaje = 'Cargando…', pantallaCompleta = false }: CargandoProps) {
  return (
    <div
      className={`${estilos.contenedor} ${pantallaCompleta ? estilos.pantallaCompleta : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className={estilos.rueda} aria-hidden="true" />
      <p className="t-body-m">{mensaje}</p>
    </div>
  );
}

/** Esqueleto con la forma de una lista de tarjetas. */
export function EsqueletoLista({ filas = 3, mensaje = 'Cargando los perfiles…' }: { filas?: number; mensaje?: string }) {
  return (
    <div className={estilos.esqueleto} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{mensaje}</span>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className={estilos.tarjetaFalsa} aria-hidden="true">
          <span className={`${estilos.bloque} ${estilos.circulo}`} />
          <span className={estilos.lineas}>
            <span className={`${estilos.bloque} ${estilos.linea1}`} />
            <span className={`${estilos.bloque} ${estilos.linea2}`} />
          </span>
        </div>
      ))}
    </div>
  );
}

export default Cargando;
