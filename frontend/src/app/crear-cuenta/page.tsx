'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { Casilla } from '@/components/dafi/Piezas';
import estilos from '@/components/dafi/Acceso.module.css';
import shell from '@/components/dafi/Shell.module.css';

/**
 * Pantalla 2 del diseño. Reproduce el cuerpo de POST /api/v1/auth/register:
 * nombre, correo, contraseña, nombre de familia, las tres declaraciones
 * obligatorias y la versión del aviso de privacidad aceptada.
 */
const DECLARACIONES = [
  { campo: 'mayorDeEdad', titulo: 'Soy mayor de edad', apoyo: 'declaraciones.mayorDeEdad' },
  {
    campo: 'consentimientoDatosPropios',
    titulo: 'Consiento el tratamiento de mis datos de salud',
    apoyo: 'declaraciones.consentimientoDatosPropios',
  },
  {
    campo: 'consentimientoDatosMenores',
    titulo: 'Consiento el tratamiento de los datos de los menores a mi cargo',
    apoyo: 'declaraciones.consentimientoDatosMenores',
  },
  { campo: 'aviso', titulo: 'He leído el aviso de privacidad', apoyo: 'avisoVersion = 3 · del catálogo de avisos' },
];

export default function PaginaCrearCuenta() {
  const router = useRouter();
  const [aceptadas, setAceptadas] = useState<Record<string, boolean>>({});
  const todas = DECLARACIONES.every((d) => aceptadas[d.campo]);

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
            onSubmit={(e) => {
              e.preventDefault();
              router.push('/perfiles');
            }}
            noValidate
          >
            <Input label="Nombre completo" autoComplete="name" defaultValue="María Ruán Aguilar" required />
            <Input label="Correo electrónico" type="email" autoComplete="email" defaultValue="maria.ruan@correo.com" required />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Entre 8 y 72 caracteres"
              hint="Entre 8 y 72 caracteres."
              required
            />
            <Input label="Nombre de la familia" defaultValue="Familia Ruán" required />

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
            </section>

            <p className={estilos.nota}>
              <Icono nombre="escudo" tam={16} />
              <span className="t-body-s">
                Al crear la cuenta se crea también su familia y usted queda como cuidador principal.
              </span>
            </p>

            {/* El backend rechaza el registro si falta cualquiera de las tres
                declaraciones, así que el botón no se habilita hasta tenerlas. */}
            <Button type="submit" fullWidth disabled={!todas}>
              Crear cuenta
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
