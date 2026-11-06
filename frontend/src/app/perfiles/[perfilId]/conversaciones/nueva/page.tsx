'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { ChipFiltro } from '@/components/dafi/Chips';
import type { CodigoEtiqueta } from '@/components/dafi/Chips';
import { Casilla, FilaOpcion } from '@/components/dafi/Piezas';
import { EstadoVacio } from '@/components/dafi/Bloques';
import { CATALOGO_ETIQUETAS, CIRCULO_MEDICO, PERFILES } from '@/lib/datos-demo';
import estilos from '@/components/dafi/Pantalla.module.css';

/** Pantalla 7: POST /api/v1/perfiles/{perfilId}/conversaciones */
export default function PaginaNuevaConversacion({
  params,
}: {
  params: Promise<{ perfilId: string }>;
}) {
  const { perfilId } = use(params);
  const router = useRouter();
  const perfil = PERFILES.find((p) => p.id === perfilId) ?? PERFILES[0];

  const [etiquetas, setEtiquetas] = useState<CodigoEtiqueta[]>(['piel', 'fiebre']);
  const [medico, setMedico] = useState(CIRCULO_MEDICO[0]?.id ?? '');

  // El contrato admite de 1 a 3 etiquetas; más allá, la API responde
  // 409 LIMITE_ALCANZADO, así que el cliente lo impide antes.
  function alternar(codigo: CodigoEtiqueta) {
    setEtiquetas((prev) =>
      prev.includes(codigo)
        ? prev.filter((e) => e !== codigo)
        : prev.length >= 3
          ? prev
          : [...prev, codigo]
    );
  }

  // RF-09-AC-3: sin médicos en el círculo no se puede abrir una conversación.
  if (CIRCULO_MEDICO.length === 0) {
    return (
      <AppShell titulo="Nueva conversación" conVolver>
        <EstadoVacio
          icono="actividad"
          titulo="Agregue primero a un médico de su confianza"
          texto="Para abrir una conversación necesita al menos un médico en el círculo de su familia."
          accion={<Button onClick={() => router.push('/circulo')}>Invitar a un médico</Button>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      titulo="Nueva conversación"
      conVolver
      mostrarBarra={false}
      pie={
        <div className={estilos.barraAcciones}>
          <Button
            fullWidth
            disabled={etiquetas.length === 0}
            onClick={() => router.push('/conversaciones/c-ronchas?estado=borrador')}
          >
            Crear borrador
          </Button>
        </div>
      }
    >
      <p className={`${estilos.pastillaContexto} t-label`}>
        <Icono nombre="usuarios" tam={14} />
        Para {perfil.nombre} · {perfil.meta.split('·')[1]?.trim()}
      </p>

      <Input label="Título de la conversación" defaultValue="Ronchas en el brazo desde ayer" required />

      <h2 className={`${estilos.rotulo} t-overline`} id="etiquetas">ETIQUETAS · DE 1 A 3</h2>
      <p className={`${estilos.apoyo} t-body-s`}>Definen qué preguntas de contexto se le harán.</p>
      <div className={estilos.listaChips} role="group" aria-labelledby="etiquetas">
        {CATALOGO_ETIQUETAS.map((e) => (
          <ChipFiltro
            key={e.codigo}
            activo={etiquetas.includes(e.codigo)}
            onClick={() => alternar(e.codigo)}
            rolAria="checkbox"
          >
            {e.nombre}
          </ChipFiltro>
        ))}
      </div>

      <h2 className={`${estilos.rotulo} t-overline`} id="medico">MÉDICO DEL CÍRCULO</h2>
      <div className={estilos.pila} role="radiogroup" aria-labelledby="medico">
        {CIRCULO_MEDICO.map((m) => (
          <FilaOpcion
            key={m.id}
            nombre={m.nombre}
            detalle={m.detalle}
            seleccionada={medico === m.id}
            onSelect={() => setMedico(m.id)}
          />
        ))}
      </div>

      <Casilla
        titulo="Necesito respuesta pronto"
        apoyo="Marca «Prioridad indicada por la familia». DAFI no evalúa la urgencia."
      />
    </AppShell>
  );
}
