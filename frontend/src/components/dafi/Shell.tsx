'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useId } from 'react';
import type { ReactNode } from 'react';
import Icono from '@/components/ui/Icono';
import type { NombreIcono } from '@/components/ui/Icono';
import { Avatar } from './Piezas';
import estilos from './Shell.module.css';

export interface ItemNav {
  etiqueta: string;
  href: string;
  icono: NombreIcono;
}

/** Navegación de la familia (pantallaInicio = «perfiles»). */
export const NAV_FAMILIA: ItemNav[] = [
  { etiqueta: 'Perfiles', href: '/perfiles', icono: 'usuarios' },
  { etiqueta: 'Conversaciones', href: '/conversaciones', icono: 'mensaje' },
  { etiqueta: 'Círculo', href: '/circulo', icono: 'actividad' },
  { etiqueta: 'Cuenta', href: '/cuenta', icono: 'usuario' },
];

/** Navegación del médico (pantallaInicio = «bandeja»). */
export const NAV_MEDICO: ItemNav[] = [
  { etiqueta: 'Pacientes', href: '/medico/pacientes', icono: 'usuarios' },
  { etiqueta: 'Bandeja', href: '/medico/bandeja', icono: 'mensaje' },
  { etiqueta: 'Familias', href: '/medico/familias', icono: 'actividad' },
  { etiqueta: 'Cuenta', href: '/medico/cuenta', icono: 'usuario' },
];

export interface AppShellProps {
  titulo: string;
  children: ReactNode;
  nav?: ItemNav[];
  usuario?: { nombre: string; rol: string };
  /** Muestra la flecha de volver en vez del título de raíz de pestaña. */
  conVolver?: boolean;
  /** Icono de la acción de la derecha en el encabezado móvil. */
  accion?: { icono: NombreIcono; etiqueta: string; onClick?: () => void };
  /** Barra fija al pie (acciones primarias o compositor de mensajes). */
  pie?: ReactNode;
  /** Quita el relleno del contenido (lo pone la propia pantalla). */
  sinRelleno?: boolean;
  /**
   * La barra inferior sólo aparece en las raíces de pestaña (pantallas 4, 6 y
   * 10 del diseño). En formularios y detalles el diseño la quita para dejar
   * sitio a la acción principal o al compositor.
   */
  mostrarBarra?: boolean;
}

export function AppShell({
  titulo,
  children,
  nav = NAV_FAMILIA,
  usuario = { nombre: 'María Ruán', rol: 'Cuidadora principal' },
  conVolver = false,
  accion,
  pie,
  sinRelleno = false,
  mostrarBarra = true,
}: AppShellProps) {
  const router = useRouter();
  const ruta = usePathname();
  const idBuscador = useId();
  const esMedico = nav === NAV_MEDICO;

  const activo = (href: string) => ruta === href || ruta.startsWith(`${href}/`);

  return (
    <div className={estilos.shell}>
      <a href="#contenido" className="salto-contenido">Saltar al contenido</a>

      {/* ---------- Navegación lateral (escritorio) ---------- */}
      <nav className={estilos.lateral} aria-label="Principal">
        <Link href={esMedico ? '/medico/bandeja' : '/perfiles'} className={`${estilos.marca} t-heading-m`}>
          <span className={estilos.marcaLogo} aria-hidden="true">
            <Icono nombre="actividad" tam={18} grosor={2.4} />
          </span>
          DAFI
        </Link>

        <div className={estilos.lateralLista}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${estilos.lateralItem} ${activo(item.href) ? estilos.lateralItemActivo : ''} t-body-m-fuerte`}
              aria-current={activo(item.href) ? 'page' : undefined}
            >
              <Icono nombre={item.icono} tam={20} />
              {item.etiqueta}
            </Link>
          ))}
        </div>

        <span className={estilos.lateralEspaciador} />

        <div className={estilos.lateralUsuario}>
          <Avatar nombre={usuario.nombre} rol={esMedico ? 'medico' : 'familia'} />
          <span className={estilos.lateralUsuarioTextos}>
            <span className={`${estilos.lateralUsuarioNombre} t-body-m-fuerte`}>{usuario.nombre}</span>
            <span className={`${estilos.lateralUsuarioRol} t-body-s`}>{usuario.rol}</span>
          </span>
        </div>
      </nav>

      <div className={estilos.principal}>
        {/* ---------- Encabezado móvil ---------- */}
        <header className={estilos.encabezado}>
          {conVolver && (
            <button type="button" className={estilos.volver} onClick={() => router.back()} aria-label="Volver">
              <Icono nombre="flechaIzquierda" tam={22} />
            </button>
          )}
          <h1 className={`${estilos.encabezadoTitulo} ${conVolver ? 't-heading-m' : 't-heading-l'}`}>
            {titulo}
          </h1>
          {accion ? (
            <button type="button" className={estilos.encabezadoAccion} aria-label={accion.etiqueta} onClick={accion.onClick}>
              <Icono nombre={accion.icono} tam={20} />
            </button>
          ) : (
            !conVolver && (
              <button type="button" className={estilos.encabezadoAccion} aria-label="Notificaciones">
                <Icono nombre="campana" tam={20} />
              </button>
            )
          )}
        </header>

        {/* ---------- Encabezado de escritorio ---------- */}
        <header className={estilos.escritorio}>
          <h1 className={`${estilos.escritorioTitulo} t-heading-l`}>{titulo}</h1>
          <div className={estilos.buscador}>
            <Icono nombre="buscar" tam={16} />
            {/* El campo necesita id y name propios: sin ellos Chrome marca
                FormEmptyIdAndNameAttributesForInputError y ni el autocompletado
                ni los gestores de formularios saben identificarlo. */}
            <label htmlFor={idBuscador} className="sr-only">
              Buscar en las conversaciones
            </label>
            <input
              id={idBuscador}
              name="buscar"
              type="search"
              className={`${estilos.buscadorCampo} t-body-m`}
              placeholder="Buscar en las conversaciones"
            />
          </div>
          <button type="button" className={estilos.encabezadoAccion} aria-label="Notificaciones">
            <Icono nombre="campana" tam={20} />
          </button>
          <Avatar nombre={usuario.nombre} rol={esMedico ? 'medico' : 'familia'} tam="sm" />
        </header>

        <main
          id="contenido"
          className={`${estilos.contenido} ${sinRelleno ? estilos.contenidoSinRelleno : ''}`}
        >
          {children}
        </main>

        {pie}
      </div>

      {/* ---------- Barra inferior (móvil) ---------- */}
      {mostrarBarra && (
      <nav className={estilos.barra} aria-label="Secciones">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${estilos.barraItem} ${activo(item.href) ? estilos.barraItemActivo : ''}`}
            aria-current={activo(item.href) ? 'page' : undefined}
          >
            <Icono nombre={item.icono} tam={22} />
            <span className={`${estilos.barraEtiqueta} t-overline`}>{item.etiqueta}</span>
          </Link>
        ))}
      </nav>
      )}
    </div>
  );
}

export default AppShell;
