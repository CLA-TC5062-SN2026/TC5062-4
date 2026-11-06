import { redirect } from 'next/navigation';

/**
 * Raíz de la aplicación. El backend devuelve `pantallaInicio` al iniciar
 * sesión ('perfiles' para la familia, 'bandeja' para el médico); mientras no
 * hay sesión, la raíz lleva a la pantalla de acceso.
 */
export default function Inicio() {
  redirect('/entrar');
}
