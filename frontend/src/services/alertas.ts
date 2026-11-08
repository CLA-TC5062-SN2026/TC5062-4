'use client';

/**
 * Presentación de errores al usuario, con SweetAlert2.
 *
 * Reparto de responsabilidades, a propósito:
 *  - Un error **de campo** (formato de correo, contraseña corta) NO abre un
 *    diálogo: se muestra junto al campo y se enlaza con `aria-describedby`,
 *    que es lo que exige WCAG 3.3.1 y lo que permite corregirlo sin perder el
 *    contexto.
 *  - Un error **de la API o de red** sí abre el diálogo: ocurre lejos del sitio
 *    donde el usuario estaba mirando y necesita interrumpir.
 *
 * El diálogo nunca muestra el texto crudo del servidor: pasa por
 * `mensajeParaUsuario`, que traduce cada código del contrato a algo accionable.
 */
import Swal from 'sweetalert2';
import { ApiError, mensajeParaUsuario } from './errores';

const BASE = {
  heightAuto: false,
  buttonsStyling: false,
  customClass: {
    popup: 'dafi-swal',
    title: 'dafi-swal-titulo',
    htmlContainer: 'dafi-swal-texto',
    confirmButton: 'dafi-swal-boton',
    cancelButton: 'dafi-swal-boton-secundario',
    actions: 'dafi-swal-acciones',
  },
} as const;

/** Título corto según la naturaleza del fallo, no un «Error» genérico. */
function tituloDe(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Algo salió mal';
  if (error.esFalloDeRed) return 'Sin conexión con DAFI';
  if (error.esSesionInvalida) return 'Su sesión se cerró';
  switch (error.codigo) {
    case 'SIN_PERMISOS': return 'No tiene permiso';
    case 'NO_ENCONTRADO': return 'No disponible';
    case 'CORREO_REGISTRADO': return 'Ese correo ya tiene cuenta';
    case 'BLOQUEADO': return 'Demasiados intentos';
    case 'DATOS_INVALIDOS': return 'Revise los datos';
    default: return 'No se pudo completar';
  }
}

export interface OpcionesError {
  /** Texto del botón principal. */
  confirmar?: string;
  /** Muestra un segundo botón y resuelve `true` si el usuario lo pulsa. */
  reintentar?: boolean;
}

/**
 * Muestra un error de API o de red. Devuelve `true` si el usuario pidió
 * reintentar.
 */
export async function alertarError(error: unknown, opciones: OpcionesError = {}): Promise<boolean> {
  const { confirmar = 'Entendido', reintentar = false } = opciones;
  const esApi = error instanceof ApiError;

  const resultado = await Swal.fire({
    ...BASE,
    icon: 'error',
    title: tituloDe(error),
    text: mensajeParaUsuario(error),
    // El identificador de correlación permite al equipo encontrar la petición
    // exacta en los registros del servidor cuando alguien reporta un fallo.
    footer: esApi && error.correlacionId
      ? `<span class="dafi-swal-correlacion">Referencia: ${error.correlacionId}</span>`
      : undefined,
    showCancelButton: reintentar,
    confirmButtonText: reintentar ? 'Reintentar' : confirmar,
    cancelButtonText: 'Cerrar',
    reverseButtons: true,
    focusConfirm: true,
  });

  return reintentar ? resultado.isConfirmed : false;
}

/** Confirmación de una acción destructiva (borrar perfil o conversación). */
export function confirmarAccion(titulo: string, texto: string, confirmar = 'Sí, continuar') {
  return Swal.fire({
    ...BASE,
    icon: 'warning',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: confirmar,
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true,
  }).then((r) => r.isConfirmed);
}

/** Aviso breve que no interrumpe: se cierra solo. */
export function avisar(titulo: string, icono: 'success' | 'info' = 'success') {
  return Swal.fire({
    ...BASE,
    icon: icono,
    title: titulo,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
  });
}
