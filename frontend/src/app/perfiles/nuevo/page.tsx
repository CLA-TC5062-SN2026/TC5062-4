'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { ChipFiltro } from '@/components/dafi/Chips';
import { Casilla } from '@/components/dafi/Piezas';
import estilos from '@/components/dafi/Pantalla.module.css';

const TIPOS = [
  { id: 'menor', nombre: 'Menor' },
  { id: 'propio', nombre: 'Perfil propio' },
  { id: 'adulto_representado', nombre: 'Adulto representado' },
];

/** Pantalla 5: POST /api/v1/familias/{familiaId}/perfiles */
export default function PaginaNuevoPerfil() {
  const router = useRouter();
  const [tipo, setTipo] = useState('menor');

  return (
    <AppShell
      titulo="Nuevo perfil"
      conVolver
      mostrarBarra={false}
      pie={
        <div className={estilos.barraAcciones}>
          <Button fullWidth onClick={() => router.push('/perfiles')}>Guardar perfil</Button>
        </div>
      }
    >
      <h2 className={`${estilos.rotulo} t-overline`} id="tipo-perfil">TIPO DE PERFIL</h2>
      <div className={estilos.listaChips} role="radiogroup" aria-labelledby="tipo-perfil">
        {TIPOS.map((t) => (
          <ChipFiltro key={t.id} activo={tipo === t.id} onClick={() => setTipo(t.id)} rolAria="radio">
            {t.nombre}
          </ChipFiltro>
        ))}
      </div>

      <Input label="Nombre" defaultValue="Mateo Ruán" required />
      <Input label="Fecha de nacimiento" type="date" defaultValue="2021-03-14" required />
      <Input label="Alergias" placeholder="Agregue una por una (hasta 30)" />
      <Input label="Medicamentos de uso continuo" placeholder="Agregue uno por uno (hasta 30)" />

      {tipo === 'adulto_representado' && (
        <Input
          label="Correo de la persona representada"
          type="email"
          placeholder="correo@ejemplo.com"
          hint="Recibirá un enlace para dar su consentimiento."
          required
        />
      )}

      {/* Un menor no admite «compartir»: el cocuidador siempre lo ve. */}
      <Casilla
        titulo="Compartir con el cocuidador"
        apoyo="No aplica a los perfiles de menores: el cocuidador siempre los ve."
        defaultChecked={false}
      />

      <p className={estilos.notaInfo}>
        <Icono nombre="info" tam={18} />
        <span className="t-body-m">
          Un perfil de adulto representado queda en «pendiente_consentimiento» hasta que esa persona
          acepte por correo.
        </span>
      </p>
    </AppShell>
  );
}
