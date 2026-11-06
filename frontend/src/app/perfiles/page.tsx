'use client';

import { useRouter } from 'next/navigation';
import AppShell from '@/components/dafi/Shell';
import { TarjetaPerfil } from '@/components/dafi/Bloques';
import { FilaOpcion } from '@/components/dafi/Piezas';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import { CIRCULO_MEDICO, PERFILES } from '@/lib/datos-demo';
import estilos from '@/components/dafi/Pantalla.module.css';

/** Pantalla 4 (móvil) y D2 (escritorio): GET /api/v1/familias/{familiaId}/perfiles */
export default function PaginaPerfiles() {
  const router = useRouter();

  return (
    <AppShell titulo="Perfiles">
      <div className={estilos.cabeceraSeccion}>
        <p className={`${estilos.rotulo} t-label`}>Familia Ruán</p>
        <p className={`${estilos.apoyo} t-label`}>{PERFILES.length} perfiles</p>
        <div className={estilos.accionCabecera}>
          <Button onClick={() => router.push('/perfiles/nuevo')}>Agregar un perfil</Button>
        </div>
      </div>

      <div className={estilos.rejilla}>
        {PERFILES.map((p) => (
          <TarjetaPerfil
            key={p.id}
            nombre={p.nombre}
            meta={p.meta}
            insignias={p.insignias}
            onClick={() => router.push(`/perfiles/${p.id}`)}
          />
        ))}
      </div>

      <p className={estilos.notaInfo}>
        <Icono nombre="info" tam={18} />
        <span className="t-body-m">
          El cocuidador sólo ve los perfiles de menores y los que usted marque con «Compartir con el
          cocuidador».
        </span>
      </p>

      <div className={estilos.accionPie}>
        <Button variant="secundario" fullWidth onClick={() => router.push('/perfiles/nuevo')}>
          Agregar un perfil
        </Button>
      </div>

      <h2 className={`${estilos.rotulo} t-overline`}>CÍRCULO MÉDICO</h2>
      <div className={estilos.listaMedicos} role="radiogroup" aria-label="Médicos del círculo">
        {CIRCULO_MEDICO.map((m) => (
          <FilaOpcion key={m.id} nombre={m.nombre} detalle={m.detalle} />
        ))}
      </div>
    </AppShell>
  );
}
