'use client';

import { useId } from 'react';
import type { ReactNode } from 'react';
import Icono from '@/components/ui/Icono';
import estilos from './Piezas.module.css';

/* ===================== Avatar ===================== */
export function Avatar({
  nombre,
  rol = 'familia',
  tam = 'md',
}: {
  nombre: string;
  rol?: 'familia' | 'medico';
  tam?: 'sm' | 'md';
}) {
  // «Dra. Lucía Torres» -> LT, no DL: el tratamiento no es parte del nombre.
  const iniciales = nombre
    .replace(/^(Dra?\.|Lic\.|Mtra?\.|Sr(a|ita)?\.)\s*/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? '')
    .join('')
    .toUpperCase();
  return (
    <span
      className={[
        estilos.avatar,
        rol === 'medico' ? estilos.avatarMedico : estilos.avatarFamilia,
        tam === 'sm' ? estilos.avatarSm : '',
        't-heading-s',
      ].filter(Boolean).join(' ')}
      // El nombre completo ya aparece como texto al lado; las iniciales sobran.
      aria-hidden="true"
    >
      {iniciales}
    </span>
  );
}

/* ============ Aviso de emergencias (RF-13) ============ */
export const TEXTO_EMERGENCIAS =
  'DAFI no atiende emergencias. Si la persona tiene dificultad para respirar, pierde el conocimiento o la situación le preocupa, llame al 911 o acuda a urgencias.';

export function AvisoEmergencias() {
  return (
    // role="note" y no "alert": es un aviso permanente del catálogo, no algo
    // que acaba de ocurrir. Un "alert" interrumpiría al lector en cada pantalla.
    <aside className={estilos.aviso} role="note" aria-label="Aviso de emergencias">
      <Icono nombre="alerta" tam={18} className={estilos.avisoIcono} />
      <div className={estilos.avisoCuerpo}>
        <p className="t-body-s">{TEXTO_EMERGENCIAS}</p>
        <a className={`${estilos.llamar911} t-label`} href="tel:911">
          <Icono nombre="telefono" tam={14} />
          Llamar al 911
        </a>
      </div>
    </aside>
  );
}

/* ===================== Casilla ===================== */
export function Casilla({
  titulo,
  apoyo,
  checked,
  defaultChecked,
  onChange,
  name,
}: {
  titulo: ReactNode;
  apoyo?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (valor: boolean) => void;
  name?: string;
}) {
  const id = useId();
  const idApoyo = `${id}-apoyo`;
  return (
    <label className={estilos.casilla} htmlFor={id}>
      <span className={estilos.casillaEnvoltorio}>
        <input
          id={id}
          name={name}
          type="checkbox"
          className={estilos.casillaEntrada}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-describedby={apoyo ? idApoyo : undefined}
        />
        <span className={estilos.casillaCaja} aria-hidden="true">
          <Icono nombre="check" tam={14} grosor={3} />
        </span>
      </span>
      <span className={estilos.casillaTextos}>
        <span className={`${estilos.casillaTitulo} t-body-m`}>{titulo}</span>
        {apoyo && (
          <span id={idApoyo} className={`${estilos.casillaApoyo} t-body-s`}>
            {apoyo}
          </span>
        )}
      </span>
    </label>
  );
}

/* ===================== Fila de dato ===================== */
export function FilaDato({ clave, valor }: { clave: ReactNode; valor: ReactNode }) {
  return (
    <div className={estilos.filaDato}>
      <div className={estilos.filaDatoFila}>
        <span className={`${estilos.filaDatoClave} t-body-m`}>{clave}</span>
        <span className={`${estilos.filaDatoValor} t-body-m-fuerte`}>{valor}</span>
      </div>
      <span className={estilos.filaDatoLinea} aria-hidden="true" />
    </div>
  );
}

/* ===================== Fila seleccionable ===================== */
export function FilaOpcion({
  nombre,
  detalle,
  seleccionada = false,
  onSelect,
  name,
}: {
  nombre: string;
  detalle: string;
  seleccionada?: boolean;
  onSelect?: () => void;
  name?: string;
}) {
  const id = useId();
  return (
    // Es una elección única: se modela con role="radio" para que el lector
    // anuncie «seleccionado / no seleccionado» y no «botón».
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      name={name}
      id={id}
      onClick={onSelect}
      className={`${estilos.opcion} ${seleccionada ? estilos.opcionSeleccionada : ''}`}
    >
      <Avatar nombre={nombre} rol="medico" />
      <span className={estilos.opcionTextos}>
        <span className={`${estilos.opcionNombre} t-body-m-fuerte`}>{nombre}</span>
        <span className={`${estilos.opcionDetalle} t-body-s`}>{detalle}</span>
      </span>
      <span className={`${estilos.radio} ${seleccionada ? estilos.radioActivo : ''}`} aria-hidden="true" />
    </button>
  );
}
