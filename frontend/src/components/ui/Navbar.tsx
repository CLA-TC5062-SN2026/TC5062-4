'use client';

import { useId, useState } from 'react';
import Button from './Button';
import estilos from './Navbar.module.css';

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarUser {
  nombre: string;
  /** Rol tal como lo devuelve el backend: cuidador_principal, cocuidador, medico… */
  rol: string;
}

export interface NavbarProps {
  /** `null` o ausente = sesión no iniciada. */
  user?: NavbarUser | null;
  items?: NavItem[];
  /** Ruta actual, para marcar el enlace activo. */
  activeHref?: string;
  onLogout?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
  brandHref?: string;
  appName?: string;
}

const ROLES: Record<string, string> = {
  cuidador_principal: 'Cuidador principal',
  cocuidador: 'Cocuidador',
  medico: 'Médico',
  administrador: 'Administrador',
};

function iniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
}

export function Navbar({
  user = null,
  items = [],
  activeHref,
  onLogout,
  onLogin,
  onRegister,
  brandHref = '/',
  appName = 'DAFI',
}: NavbarProps) {
  const [abierto, setAbierto] = useState(false);
  const idPanel = useId();
  const autenticado = Boolean(user);

  return (
    <header className={[estilos.barra, abierto ? estilos.panelAbierto : null].filter(Boolean).join(' ')}>
      {/* WCAG 2.4.1: permite saltarse la navegación repetida en cada página. */}
      <a href="#contenido" className="salto-contenido">
        Saltar al contenido
      </a>

      {/* aria-label distingue esta nav de cualquier otra de la página (WCAG 1.3.1). */}
      <nav className={estilos.contenido} aria-label="Principal">
        <a href={brandHref} className={estilos.marca}>
          <span className={estilos.logo} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M22 12h-4l-3 9L9 3l-3 9H2"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {appName}
        </a>

        <button
          type="button"
          className={estilos.menuBoton}
          // WCAG 4.1.2: un botón con sólo un icono necesita nombre accesible,
          // y su estado abierto/cerrado debe exponerse por aria-expanded.
          aria-label={abierto ? 'Cerrar el menú de navegación' : 'Abrir el menú de navegación'}
          aria-expanded={abierto}
          aria-controls={idPanel}
          onClick={() => setAbierto((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {abierto ? (
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <div id={idPanel} className={estilos.enlaces}>
          {autenticado &&
            items.map((item) => {
              const activo = item.href === activeHref;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={[estilos.enlace, activo ? estilos.enlaceActivo : null].filter(Boolean).join(' ')}
                  // aria-current marca la página actual sin depender del color (WCAG 1.4.1).
                  aria-current={activo ? 'page' : undefined}
                >
                  {item.label}
                </a>
              );
            })}
        </div>

        <div className={estilos.sesion}>
          {autenticado && user ? (
            <>
              <div className={estilos.usuario}>
                <span className={estilos.avatar} aria-hidden="true">
                  {iniciales(user.nombre)}
                </span>
                <span className={estilos.datosUsuario}>
                  <span className={estilos.nombre}>{user.nombre}</span>
                  <span className={estilos.rol}>{ROLES[user.rol] ?? user.rol}</span>
                </span>
              </div>
              <Button variant="secundario" size="sm" onClick={onLogout}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Button variant="fantasma" size="sm" onClick={onLogin}>
                Entrar
              </Button>
              <Button variant="primario" size="sm" onClick={onRegister}>
                Crear cuenta
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
