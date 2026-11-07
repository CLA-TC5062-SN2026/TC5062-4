'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { useAuth } from '@/context/AuthContext';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import estilos from '@/components/dafi/Acceso.module.css';

const RE_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const PROMESAS = [
  'Cada conversación pertenece a un paciente y a un médico de su círculo.',
  'Las preguntas de contexto se hacen una sola vez, no en cada consulta.',
  'Al abrir la conversación, el médico ya tiene el historial relevante.',
];

export default function PaginaEntrar() {
  const router = useRouter();
  const { entrar, usuario, comprobando, rutaInicio } = useAuth();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesión válida no tiene sentido pedir credenciales otra vez.
  useEffect(() => {
    if (!comprobando && usuario) {
      router.replace(usuario.rol === 'medico' ? '/medico/bandeja' : '/perfiles');
    }
  }, [usuario, comprobando, router]);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);
    const nuevos: { correo?: string; contrasena?: string } = {};
    if (!RE_CORREO.test(correo.trim())) nuevos.correo = 'Escriba un correo válido.';
    if (contrasena.length < 8) nuevos.contrasena = 'La contraseña tiene al menos 8 caracteres.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      await entrar(correo.trim(), contrasena);
      // El backend indica en `pantallaInicio` dónde empieza cada rol: la
      // familia en sus perfiles, el médico en su bandeja.
      router.replace(rutaInicio);
    } catch (error) {
      // Credenciales incorrectas es un fallo esperable del formulario: se
      // muestra en la propia pantalla, sin diálogo que interrumpa.
      const credencialesMal = error instanceof ApiError && error.status === 401;
      setErrorGeneral(mensajeParaUsuario(error));
      if (!credencialesMal) {
        // Lo demás (red caída, servidor apagado, cuenta desactivada) sí merece
        // un diálogo: ocurre lejos del campo que la persona estaba rellenando.
        await alertarError(error);
      }
      setEnviando(false);
    }
  }

  return (
    <div className={estilos.pagina}>
      {/* ---------- Panel de marca (sólo escritorio, Figma D1) ---------- */}
      <aside className={estilos.panelMarca}>
        <div className={estilos.panelMarcaLogo}>
          <span className={estilos.panelMarcaLogoCaja} aria-hidden="true">
            <Icono nombre="actividad" tam={24} grosor={2.4} />
          </span>
          <span className="t-heading-l">DAFI</span>
        </div>

        <div className={estilos.panelMarcaPitch}>
          <p className="t-display">
            Un espacio ordenado para hablar con los médicos que su familia ya conoce.
          </p>
          <ul className={estilos.panelMarcaLista}>
            {PROMESAS.map((p) => (
              <li key={p} className={`${estilos.panelMarcaItem} t-body-l`}>
                <Icono nombre="check" tam={18} grosor={2.4} />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className={`${estilos.panelMarcaPie} t-body-s`}>
          DAFI no diagnostica, no evalúa la urgencia de ningún caso y no verifica credenciales médicas.
        </p>
      </aside>

      {/* ---------- Formulario ---------- */}
      <main id="contenido" className={estilos.panelFormulario}>
        <div className={`${estilos.caja} ${estilos.cajaJusta}`}>
          <div className={estilos.bloqueMarca}>
            <span className={estilos.logo} aria-hidden="true">
              <Icono nombre="actividad" tam={32} grosor={2.4} />
            </span>
            <p className={`${estilos.marcaNombre} t-display`}>DAFI</p>
            <p className={`${estilos.lema} t-body-m`}>
              Un espacio ordenado para hablar con los médicos que su familia ya conoce.
            </p>
          </div>

          <form className={estilos.formulario} onSubmit={alEnviar} noValidate>
            <div className={estilos.titulos}>
              <h1 className={`${estilos.titulo} t-display`}>Entrar a DAFI</h1>
              <p className={`${estilos.entradilla} t-body-m`}>
                Use el correo con el que creó su cuenta familiar.
              </p>
            </div>

            {errorGeneral && (
              <p className={estilos.errorGeneral} role="alert">
                <Icono nombre="alerta" tam={16} />
                <span className="t-body-s">{errorGeneral}</span>
              </p>
            )}

            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              error={errores.correo}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              error={errores.contrasena}
              required
            />

            <p className={estilos.olvido}>
              <Link href="/sesion-expirada" className={`${estilos.enlace} t-label`}>
                ¿Olvidó su contraseña?
              </Link>
            </p>

            <Button type="submit" fullWidth loading={enviando} loadingText="Entrando…">
              Entrar
            </Button>
            <Button variant="secundario" fullWidth onClick={() => router.push('/crear-cuenta')}>
              Crear una cuenta
            </Button>
          </form>

          <div className={estilos.pie}>
            <span className={`${estilos.sello} t-overline`}>
              <Icono nombre="escudo" tam={14} />
              USO ACADÉMICO · DATOS FICTICIOS
            </span>
            <p className={`${estilos.aclaracion} t-body-s`}>
              DAFI no diagnostica ni atiende emergencias. Los médicos son contactos que su familia ya
              conoce e invita por correo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
