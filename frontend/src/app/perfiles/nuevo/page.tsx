'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import AppShell from '@/components/dafi/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Icono from '@/components/ui/Icono';
import { ChipFiltro } from '@/components/dafi/Chips';
import { CampoTipoSangre, Casilla } from '@/components/dafi/Piezas';
import { useAuth } from '@/context/AuthContext';
import { crearPerfil } from '@/services/perfilesService';
import type { TipoPerfil, TipoSangre } from '@/services/perfilesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import { aLista, validarPerfil } from './validacion';
import type { ErroresPerfil } from './validacion';
import estilos from '@/components/dafi/Pantalla.module.css';
import acceso from '@/components/dafi/Acceso.module.css';

const TIPOS: { id: TipoPerfil; nombre: string }[] = [
  { id: 'menor', nombre: 'Menor' },
  { id: 'propio', nombre: 'Perfil propio' },
  { id: 'adulto_representado', nombre: 'Adulto representado' },
];

/** Pantalla 5: POST /api/v1/familias/{familiaId}/perfiles */
function Contenido() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [tipo, setTipo] = useState<TipoPerfil>('menor');
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [alergias, setAlergias] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [tipoSangre, setTipoSangre] = useState<TipoSangre | null>(null);
  const [correo, setCorreo] = useState('');
  const [compartir, setCompartir] = useState(false);
  const [errores, setErrores] = useState<ErroresPerfil>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando || !usuario?.familiaId) return;
    setErrorGeneral(null);
    const nuevos = validarPerfil({ tipo, nombre, fechaNacimiento, alergias, medicamentos, correo });
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      // Lleva al primer campo con error: el botón está en la barra fija y el
      // campo puede haber quedado fuera de la vista en un teléfono.
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    setEnviando(true);
    try {
      await crearPerfil(usuario.familiaId, {
        tipo,
        nombre: nombre.trim(),
        fechaNacimiento,
        alergias: aLista(alergias),
        medicamentos: aLista(medicamentos),
        tipoSangre,
        // El backend rechaza compartir en un menor (422).
        compartirConCocuidador: tipo !== 'menor' && compartir,
        ...(tipo === 'adulto_representado' && { correo: correo.trim() }),
      });
      router.push('/perfiles');
    } catch (error) {
      // 409 y 422 se corrigen en este formulario: se muestran junto al botón.
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
    <AppShell
      titulo="Nuevo perfil"
      conVolver
      mostrarBarra={false}
      pie={
        <div className={estilos.barraAcciones}>
          {/* En la barra fija, junto al botón: siempre a la vista en un teléfono. */}
          {errorGeneral && (
            <p className={acceso.errorGeneral} role="alert">
              <Icono nombre="alerta" tam={16} />
              <span className="t-body-s">{errorGeneral}</span>
            </p>
          )}
          <Button type="submit" form="form-perfil" fullWidth loading={enviando} loadingText="Guardando…">
            Guardar perfil
          </Button>
        </div>
      }
    >
      {/* display: contents conserva el espaciado del contenido del Shell. */}
      <form id="form-perfil" onSubmit={alEnviar} noValidate style={{ display: 'contents' }}>
        <h2 className={`${estilos.rotulo} t-overline`} id="tipo-perfil">TIPO DE PERFIL</h2>
        <div className={estilos.listaChips} role="radiogroup" aria-labelledby="tipo-perfil">
          {TIPOS.map((t) => (
            <ChipFiltro key={t.id} activo={tipo === t.id} onClick={() => setTipo(t.id)} rolAria="radio">
              {t.nombre}
            </ChipFiltro>
          ))}
        </div>

        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
          required
        />
        <Input
          label="Fecha de nacimiento"
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          error={errores.fechaNacimiento}
          required
        />
        <CampoTipoSangre valor={tipoSangre} onChange={setTipoSangre} />
        <Input
          label="Alergias"
          placeholder="Separe con comas (hasta 30)"
          value={alergias}
          onChange={(e) => setAlergias(e.target.value)}
          error={errores.alergias}
        />
        <Input
          label="Medicamentos de uso continuo"
          placeholder="Separe con comas (hasta 30)"
          value={medicamentos}
          onChange={(e) => setMedicamentos(e.target.value)}
          error={errores.medicamentos}
        />

        {tipo === 'adulto_representado' && (
          <Input
            label="Correo de la persona representada"
            type="email"
            placeholder="correo@ejemplo.com"
            hint="Recibirá un enlace para dar su consentimiento."
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            error={errores.correo}
            required
          />
        )}

        {/* Un menor no admite «compartir»: el cocuidador siempre lo ve. */}
        {tipo !== 'menor' && (
          <Casilla
            titulo="Compartir con el cocuidador"
            apoyo="Si no lo marca, sólo usted verá este perfil."
            checked={compartir}
            onChange={setCompartir}
          />
        )}

        <p className={estilos.notaInfo}>
          <Icono nombre="info" tam={18} />
          <span className="t-body-m">
            Un perfil de adulto representado queda en «pendiente_consentimiento» hasta que esa persona
            acepte por correo.
          </span>
        </p>
      </form>
    </AppShell>
  );
}

/** Requiere sesión; el control real lo hace el backend en cada petición. */
export default function PaginaNuevoPerfil() {
  return (
    <RutaProtegida roles={['cuidador_principal']}>
      <Contenido />
    </RutaProtegida>
  );
}
