'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { Casilla } from '@/components/dafi/Piezas';
import { useAuth } from '@/context/AuthContext';
import { registrar } from '@/services/authService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { validarRegistro } from './validacion';
import type { ErroresRegistro } from './validacion';
import estilos from '@/components/dafi/Acceso.module.css';
import shell from '@/components/dafi/Shell.module.css';

/**
 * Pantalla 2 del diseño. Reproduce el cuerpo de POST /api/v1/auth/register:
 * nombre, correo, contraseña, nombre de familia, las tres declaraciones
 * obligatorias y la versión del aviso de privacidad aceptada.
 */
const DECLARACIONES = [
  {
    campo: 'mayorDeEdad',
    titulo: 'Soy mayor de edad',
    apoyo: 'DAFI sólo admite cuentas de personas adultas.',
  },
  {
    campo: 'consentimientoDatosPropios',
    titulo: 'Consiento el tratamiento de mis datos de salud',
    apoyo: 'Puede retirar el consentimiento y borrar su cuenta cuando quiera.',
  },
  {
    campo: 'consentimientoDatosMenores',
    titulo: 'Consiento el tratamiento de los datos de los menores a mi cargo',
    apoyo: 'Como su madre, padre o tutor legal.',
  },
  {
    campo: 'aviso',
    titulo: 'He leído el aviso de privacidad',
    apoyo: 'Versión 1.',
  },
];

export default function PaginaCrearCuenta() {
  const router = useRouter();
  const { entrar } = useAuth();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [aceptadas, setAceptadas] = useState<Record<string, boolean>>({});
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const todas = DECLARACIONES.every((d) => aceptadas[d.campo]);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErrorGeneral(null);
    const nuevos = validarRegistro({ nombre, correo, contrasena, nombreFamilia, aceptadas });
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      await registrar({
        nombre: nombre.trim(),
        correo: correo.trim(),
        contrasena,
        nombreFamilia: nombreFamilia.trim(),
        declaraciones: {
          mayorDeEdad: true,
          consentimientoDatosPropios: true,
          consentimientoDatosMenores: true,
        },
        avisoVersion: 1,
      });
      // El registro no devuelve token: la sesión se abre igual que en /entrar.
      const { rutaInicio } = await entrar(correo.trim(), contrasena);
      router.replace(rutaInicio);
    } catch (error) {
      // Correo repetido (409) y datos rechazados (422) se corrigen en este
      // mismo formulario: se muestran aquí, sin diálogo.
      const deFormulario = error instanceof ApiError && (error.status === 409 || error.status === 422);
      setErrorGeneral(
        error instanceof ApiError && error.status === 422
          ? `Revise los datos: ${error.message}.`
          : mensajeParaUsuario(error)
      );
      if (!deFormulario) await alertarError(error);
      setEnviando(false);
    }
  }

  return (
    <div className={estilos.pagina}>
      <main id="contenido" className={estilos.panelFormulario}>
        <div className={estilos.caja}>
          <header className={shell.encabezado} style={{ margin: '0 calc(var(--space-24) * -1)' }}>
            <button type="button" className={shell.volver} onClick={() => router.back()} aria-label="Volver">
              <Icono nombre="flechaIzquierda" tam={22} />
            </button>
            <h1 className={`${shell.encabezadoTitulo} t-heading-m`}>Crear cuenta</h1>
          </header>

          <form
            className={estilos.formulario}
            onSubmit={alEnviar}
            noValidate
          >
            {errorGeneral && (
              <p className={estilos.errorGeneral} role="alert">
                <Icono nombre="alerta" tam={16} />
                <span className="t-body-s">{errorGeneral}</span>
              </p>
            )}

            <Input
              label="Nombre completo"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              error={errores.nombre}
              required
            />
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
              autoComplete="new-password"
              placeholder="Entre 8 y 72 caracteres"
              hint="Entre 8 y 72 caracteres."
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              error={errores.contrasena}
              required
            />
            <Input
              label="Nombre de la familia"
              value={nombreFamilia}
              onChange={(e) => setNombreFamilia(e.target.value)}
              error={errores.nombreFamilia}
              required
            />

            <section className={estilos.seccion} aria-labelledby="declaraciones">
              <h2 id="declaraciones" className={`${estilos.seccionTitulo} t-overline`}>
                DECLARACIONES OBLIGATORIAS
              </h2>
              {DECLARACIONES.map((d) => (
                <Casilla
                  key={d.campo}
                  name={d.campo}
                  titulo={d.titulo}
                  apoyo={d.apoyo}
                  checked={Boolean(aceptadas[d.campo])}
                  onChange={(v) => setAceptadas((prev) => ({ ...prev, [d.campo]: v }))}
                />
              ))}
              {errores.declaraciones && (
                <p className={estilos.errorGeneral} role="alert">
                  <Icono nombre="alerta" tam={16} />
                  <span className="t-body-s">{errores.declaraciones}</span>
                </p>
              )}
            </section>

            <p className={estilos.nota}>
              <Icono nombre="escudo" tam={16} />
              <span className="t-body-s">
                Al crear la cuenta se crea también su familia y usted queda como cuidador principal.
              </span>
            </p>

            {/* El backend rechaza el registro si falta cualquiera de las tres
                declaraciones, así que el botón no se habilita hasta tenerlas. */}
            <Button type="submit" fullWidth disabled={!todas} loading={enviando} loadingText="Creando…">
              Crear cuenta
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
