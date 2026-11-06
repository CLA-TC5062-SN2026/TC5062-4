import { redirect } from 'next/navigation';

/** La ruta de acceso pasó a llamarse /entrar, en español como el resto. */
export default function LoginRedirigido() {
  redirect('/entrar');
}
