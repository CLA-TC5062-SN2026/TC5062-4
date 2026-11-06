'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Navbar from '@/components/ui/Navbar';
import estilos from './page.module.css';

const NAV = [
  { label: 'Perfiles', href: '/perfiles' },
  { label: 'Conversaciones', href: '/conversaciones' },
  { label: 'Círculo', href: '/circulo' },
];

export default function PaginaComponentes() {
  const [autenticado, setAutenticado] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [correo, setCorreo] = useState('maria.ruan@correo.com');
  const [correoInvalido, setCorreoInvalido] = useState('no-es-un-correo');

  const errorCorreo =
    correoInvalido && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correoInvalido)
      ? 'El correo no tiene un formato válido.'
      : undefined;

  return (
    <div className={estilos.pagina}>
      <Navbar
        user={autenticado ? { nombre: 'María Ruán', rol: 'cuidador_principal' } : null}
        items={NAV}
        activeHref="/"
        onLogout={() => setAutenticado(false)}
        onLogin={() => setAutenticado(true)}
        onRegister={() => setAutenticado(true)}
      />

      <main id="contenido" className={estilos.principal}>
        <section className={estilos.intro}>
          <h1 className={estilos.titulo}>Componentes de interfaz de DAFI</h1>
          <p className={estilos.entradilla}>
            Los cuatro componentes base del frontend, con sus variantes y estados. Los colores, radios y
            tipografía salen de los tokens de <code>globals.css</code>, que son los mismos del archivo de Figma
            del equipo.
          </p>
          <div className={estilos.fila}>
            <Button variant="secundario" size="sm" onClick={() => setAutenticado((v) => !v)}>
              {autenticado ? 'Simular sesión cerrada' : 'Simular sesión iniciada'}
            </Button>
          </div>
        </section>

        <section className={estilos.seccion} aria-labelledby="t-boton">
          <div>
            <h2 id="t-boton" className={estilos.tituloSeccion}>
              Botón
            </h2>
            <p className={estilos.notaSeccion}>
              Cuatro variantes, tres tamaños y estado de carga. Al cargar se deshabilita y expone{' '}
              <code>aria-busy</code>.
            </p>
          </div>

          <div className={estilos.fila}>
            <Button variant="primario">Enviar a la Dra. Torres</Button>
            <Button variant="secundario">Editar perfil</Button>
            <Button variant="fantasma">Cancelar</Button>
            <Button variant="peligro">Descartar borrador</Button>
          </div>

          <div className={estilos.fila}>
            <Button size="sm">Pequeño</Button>
            <Button size="md">Mediano</Button>
            <Button size="lg">Grande</Button>
            <Button disabled>Deshabilitado</Button>
            <Button
              loading={cargando}
              loadingText="Enviando…"
              onClick={() => {
                setCargando(true);
                window.setTimeout(() => setCargando(false), 2000);
              }}
            >
              Probar estado de carga
            </Button>
          </div>
        </section>

        <section className={estilos.seccion} aria-labelledby="t-campo">
          <div>
            <h2 id="t-campo" className={estilos.tituloSeccion}>
              Campo de entrada
            </h2>
            <p className={estilos.notaSeccion}>
              Etiqueta siempre visible, ayuda y error enlazados por <code>aria-describedby</code>. El error usa{' '}
              <code>role=&quot;alert&quot;</code>.
            </p>
          </div>

          <form className={estilos.formulario} onSubmit={(e) => e.preventDefault()}>
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              hint="Use el correo con el que creó su cuenta familiar."
            />
            <Input
              label="Correo con error"
              type="email"
              autoComplete="off"
              value={correoInvalido}
              onChange={(e) => setCorreoInvalido(e.target.value)}
              error={errorCorreo}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="Entre 8 y 72 caracteres"
            />
            <Input label="Campo deshabilitado" defaultValue="Familia Ruán" disabled />
          </form>
        </section>

        <section className={estilos.seccion} aria-labelledby="t-tarjeta">
          <div>
            <h2 id="t-tarjeta" className={estilos.tituloSeccion}>
              Tarjeta
            </h2>
            <p className={estilos.notaSeccion}>
              Contenedor genérico con encabezado, acciones y pie. El nivel del título se pasa por{' '}
              <code>headingLevel</code> para no romper el orden de encabezados.
            </p>
          </div>

          <div className={estilos.rejilla}>
            <Card
              title="Ronchas en el brazo desde ayer"
              subtitle="Mateo · 4 años"
              headingLevel={3}
              actions={<span className={`${estilos.etiquetaChip} ${estilos.chipEnviada}`}>ENVIADA</span>}
              footer={<span className={estilos.notaSeccion}>Dra. Lucía Torres · hace 2 h</span>}
            >
              <p className={estilos.notaSeccion}>
                Le salieron unas ronchas en el antebrazo derecho desde ayer por la tarde. No tiene fiebre.
              </p>
            </Card>

            <Card
              title="Fiebre de 38.9 °C desde el martes"
              subtitle="Mateo · 4 años"
              headingLevel={3}
              actions={
                <span className={`${estilos.etiquetaChip} ${estilos.chipIndicaciones}`}>CON INDICACIONES</span>
              }
              footer={<Button size="sm" variant="secundario">Ver conversación</Button>}
            >
              <p className={estilos.notaSeccion}>
                Indicaciones registradas: cuidado en casa y revaloración a las 48 horas.
              </p>
            </Card>

            <Card title="Sin encabezado ni pie" headingLevel={3} padding="lg">
              <div className={estilos.aviso}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p>
                  DAFI no atiende emergencias. Si la persona tiene dificultad para respirar, pierde el
                  conocimiento o la situación le preocupa, llame al 911 o acuda a urgencias.
                </p>
              </div>
            </Card>
          </div>
        </section>

        <section className={estilos.seccion} aria-labelledby="t-navbar">
          <div>
            <h2 id="t-navbar" className={estilos.tituloSeccion}>
              Barra de navegación
            </h2>
            <p className={estilos.notaSeccion}>
              Es la barra de arriba. Use el botón «Simular sesión…» del inicio para alternar entre el estado
              autenticado y el no autenticado, y reduzca la ventana por debajo de 768 px para ver el menú
              plegable.
            </p>
          </div>
        </section>
      </main>

      <footer className={estilos.pie}>
        <p>
          Proyecto académico TC5062 · Equipo 4 · Datos ficticios. DAFI no diagnostica ni atiende emergencias.
        </p>
      </footer>
    </div>
  );
}
