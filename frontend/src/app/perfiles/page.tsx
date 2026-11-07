'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/dafi/Shell';
import RutaProtegida from '@/components/dafi/RutaProtegida';
import { EsqueletoLista } from '@/components/dafi/Cargando';
import { EstadoVacio, TarjetaPerfil } from '@/components/dafi/Bloques';
import Button from '@/components/ui/Button';
import Icono from '@/components/ui/Icono';
import { useAuth } from '@/context/AuthContext';
import { listarPerfiles } from '@/services/perfilesService';
import type { Perfil } from '@/services/perfilesService';
import { alertarError } from '@/services/alertas';
import { ApiError, mensajeParaUsuario } from '@/services/errores';
import estilos from '@/components/dafi/Pantalla.module.css';

/** Edad y tipo, tal como los muestra el diseño. */
const TIPO_LEGIBLE: Record<Perfil['tipo'], string> = {
  menor: 'Menor',
  propio: 'Perfil propio',
  adulto_representado: 'Adulto representado',
};

function insignias(p: Perfil) {
  const lista: { texto: string; tipo: 'aviso' | 'compartido' | 'pendiente' }[] = [];
  if (p.estado === 'pendiente_consentimiento') {
    lista.push({ texto: 'Pendiente de consentimiento', tipo: 'pendiente' });
  }
  if (p.alergias.length) {
    lista.push({ texto: `Alergias: ${p.alergias.length}`, tipo: 'aviso' });
  }
  if (p.compartirConCocuidador) {
    lista.push({ texto: 'Compartido con cocuidador', tipo: 'compartido' });
  }
  return lista;
}

function Contenido() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [perfiles, setPerfiles] = useState<Perfil[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Un contador en vez de llamar a `cargar` dentro de sí misma: el efecto
  // vuelve a dispararse y el AbortController del intento anterior se limpia.
  const [intento, setIntento] = useState(0);

  const familiaId = usuario?.familiaId ?? null;

  // Toda la carga vive dentro de una función async: así ninguna actualización
  // de estado ocurre de forma síncrona en el cuerpo del efecto, que es lo que
  // provoca renders en cascada.
  useEffect(() => {
    if (!familiaId) return;
    const control = new AbortController();
    let vigente = true;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const datos = await listarPerfiles(familiaId!, control.signal);
        if (vigente) setPerfiles(datos);
      } catch (e) {
        if (!vigente) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        // Un 401 ya lo gestiona el interceptor, que cierra la sesión; aquí
        // sólo se informa de lo que esta pantalla puede resolver.
        if (e instanceof ApiError && e.esSesionInvalida) return;
        setError(mensajeParaUsuario(e));
        // El diálogo ofrece reintentar: es la acción que de verdad resuelve un
        // fallo de red, y evita que el usuario tenga que recargar a mano.
        if (await alertarError(e, { reintentar: true })) {
          if (vigente) setIntento((n) => n + 1);
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }

    void cargar();
    return () => {
      vigente = false;
      control.abort();
    };
  }, [familiaId, intento]);

  return (
    <AppShell titulo="Perfiles">
      <div className={estilos.cabeceraSeccion}>
        <p className={`${estilos.rotulo} t-label`}>{usuario?.nombre ?? 'Su familia'}</p>
        <p className={`${estilos.apoyo} t-label`}>
          {cargando ? 'Cargando…' : `${perfiles?.length ?? 0} perfiles`}
        </p>
        <div className={estilos.accionCabecera}>
          <Button onClick={() => router.push('/perfiles/nuevo')}>Agregar un perfil</Button>
        </div>
      </div>

      {cargando && <EsqueletoLista filas={3} />}

      {!cargando && error && (
        // El diálogo ya avisó; esto deja el error visible y reintentable en la
        // propia pantalla, para quien lo cerró o usa lector de pantalla.
        <div className={estilos.notaAviso} role="alert">
          <Icono nombre="alerta" tam={18} />
          <span className={estilos.notaCuerpo}>
            <span className="t-body-m-fuerte">No pudimos cargar los perfiles</span>
            <span className={`${estilos.notaDetalle} t-body-s`}>{error}</span>
            <span>
              <Button size="sm" variant="secundario" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </Button>
            </span>
          </span>
        </div>
      )}

      {!cargando && !error && perfiles?.length === 0 && (
        <EstadoVacio
          icono="usuarios"
          titulo="Todavía no hay perfiles"
          texto="Agregue a la persona de quien quiere hablar con su médico: un hijo, usted misma o un familiar a su cargo."
          accion={<Button onClick={() => router.push('/perfiles/nuevo')}>Agregar un perfil</Button>}
        />
      )}

      {!cargando && !error && perfiles && perfiles.length > 0 && (
        <>
          <div className={estilos.rejilla}>
            {perfiles.map((p) => (
              <TarjetaPerfil
                key={p.id}
                nombre={p.nombre}
                meta={`${TIPO_LEGIBLE[p.tipo]} · ${p.edadAnios} años`}
                insignias={insignias(p)}
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
        </>
      )}
    </AppShell>
  );
}

/** Pantalla 4 (móvil) y D2 (escritorio): GET /api/v1/familias/{familiaId}/perfiles */
export default function PaginaPerfiles() {
  return (
    <RutaProtegida roles={['cuidador_principal', 'cocuidador']}>
      <Contenido />
    </RutaProtegida>
  );
}
