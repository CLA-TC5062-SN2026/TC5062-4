-- =============================================================================
-- DAFI · Esquema físico en PostgreSQL 16
-- S05-S06-A1 · Equipo 4 (Armando Arredondo, Isaac González, Francisco Martínez,
-- Daniel Ruán)
--
-- Fuente de verdad: diagrama_clases_equipo.puml (entidades, atributos,
-- relaciones y multiplicidades). Tipos, longitudes y valores de enumeración
-- tomados de components/schemas de openapi_equipo.yaml. Reglas de negocio del
-- SRS de equipo v3.0 (S03_A1/SRS_equipo.md).
--
-- Se ejecuta en una base vacía de principio a fin, dentro de una sola
-- transacción. No requiere extensiones: gen_random_uuid() es nativa desde
-- PostgreSQL 13.
--
-- Estrategias de mapeo de herencia
-- --------------------------------
-- 1. Usuario (Cuidador, Medico, Administrador): una tabla por clase (class
--    table inheritance). La tabla usuario guarda lo común y un discriminador
--    (tipo_usuario); cada subclase tiene su tabla con la misma llave primaria.
--    Se eligió porque las subclases tienen atributos propios obligatorios
--    (declaraciones del cuidador, términos del médico) y, sobre todo, porque
--    varias relaciones del diagrama apuntan a una subclase concreta
--    (Conversacion -> Medico, Familia *-- Cuidador, RegistroAcceso -> Medico):
--    con tablas separadas esas FK garantizan el tipo correcto sin triggers.
--    La FK compuesta (id, tipo_usuario) impide que un mismo usuario aparezca
--    en dos subclases (herencia disjunta).
--
-- 2. Evento (Mensaje, SolicitudInformacion, Indicacion, CambioEstado,
--    RespuestaRegistrada, FotoAgregada, CitaMarcada): una sola tabla (single
--    table inheritance) con discriminador tipo. Las subclases tienen uno o dos
--    atributos cada una, la API expone un único schema Evento con campos
--    nulos según tipo, y la consulta principal (línea de tiempo de una
--    conversación en orden cronológico, RF-18-AC-3) se resuelve sin UNION ni
--    JOIN. Los CHECK por tipo sustituyen la garantía que daría el NOT NULL de
--    una tabla por subclase.
--
-- 3. Reporte (ReporteAbuso, ReporteTecnico): una sola tabla con discriminador
--    tipo, por la misma razón: dos subclases con muy pocos atributos propios y
--    un único schema Reporte en la API que el administrador lista junto.
--
-- Convenciones
-- ------------
-- * Tablas y columnas en español, snake_case, sin acentos.
-- * Toda llave primaria es UUID con gen_random_uuid(), también en las tablas
--   de asociación (que además llevan UNIQUE sobre el par de FK).
-- * Fechas y horas en timestamptz (UTC, schema FechaHora); fechas sin hora en
--   date (fechaNacimiento).
-- * Los valores de las enumeraciones siguen al OpenAPI (lo que viaja por la
--   API), no a las mayúsculas del diagrama, salvo EstadoConversacion, que el
--   OpenAPI también define en mayúsculas.
-- * Los atributos derivados del diagrama (/edadAnios, /estado del perfil,
--   /ultimoEventoEn, /id de la cita) no se guardan: se calculan en las vistas
--   del final o en la API.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Tipos enumerados
-- =============================================================================

CREATE TYPE tipo_usuario AS ENUM ('cuidador', 'medico', 'administrador');

-- Schema Rol del OpenAPI. Se usa como copia del rol en reporte.
CREATE TYPE rol_usuario AS ENUM ('cuidador_principal', 'cocuidador', 'medico', 'administrador');

CREATE TYPE tipo_cuidador AS ENUM ('principal', 'cocuidador');

CREATE TYPE tipo_perfil AS ENUM ('menor', 'propio', 'adulto_representado');

CREATE TYPE estado_perfil AS ENUM ('activo', 'pendiente_consentimiento');

CREATE TYPE estado_consentimiento AS ENUM ('pendiente', 'otorgado', 'revocado', 'vencido');

CREATE TYPE estado_conversacion AS ENUM (
    'BORRADOR', 'ENVIADA', 'EN_REVISION', 'INFO_SOLICITADA',
    'CON_INDICACIONES', 'CERRADA', 'SIN_MEDICO'
);

CREATE TYPE tipo_invitacion AS ENUM ('cocuidador', 'medico');

CREATE TYPE estado_invitacion AS ENUM ('pendiente', 'aceptada', 'rechazada', 'vencida', 'cancelada');

CREATE TYPE decision_medica AS ENUM ('cuidado_en_casa', 'consulta_presencial', 'acudir_a_urgencias');

CREATE TYPE tipo_solicitud AS ENUM ('fotos', 'respuesta', 'ambas');

CREATE TYPE tipo_respuesta AS ENUM ('opcion', 'texto', 'opcion_con_texto', 'numero_u_opcion', 'zona_cuerpo');

CREATE TYPE grupo_resumen AS ENUM ('alergias_y_medicamentos', 'episodios_anteriores', 'indicaciones_previas');

CREATE TYPE estado_resumen AS ENUM ('disponible', 'no_disponible', 'desactivado_por_familia');

CREATE TYPE codigo_aviso AS ENUM ('privacidad', 'emergencias', 'sin-respuesta', 'que-es-dafi');

CREATE TYPE tipo_notificacion AS ENUM (
    'conversacion_enviada', 'info_solicitada', 'respuesta_familia', 'mensaje_medico',
    'indicaciones', 'sin_respuesta', 'conversacion_borrada', 'consentimiento',
    'cocuidador_salio', 'medico_salio'
);

CREATE TYPE tipo_recurso AS ENUM ('conversacion', 'foto');

-- Discriminador de la jerarquía Evento (enum tipo del schema Evento).
CREATE TYPE tipo_evento AS ENUM (
    'respuesta', 'mensaje', 'foto', 'solicitud_informacion',
    'indicacion', 'cambio_estado', 'cita_marcada'
);

-- Discriminador de la jerarquía Reporte (schema TipoReporte).
CREATE TYPE tipo_reporte AS ENUM ('abuso', 'tecnico');

-- =============================================================================
-- 2. Funciones auxiliares para CHECK
-- =============================================================================

-- Valida arreglos de texto (alergias, medicamentos, opciones): como máximo
-- max_elementos elementos, ninguno nulo ni vacío y cada uno de hasta max_largo
-- caracteres (PerfilNuevo: maxItems 30, maxLength 100).
CREATE FUNCTION arreglo_texto_valido(arreglo text[], max_elementos integer, max_largo integer)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(cardinality(arreglo), 0) <= max_elementos
       AND NOT EXISTS (
           SELECT 1
           FROM unnest(arreglo) AS e(valor)
           WHERE e.valor IS NULL OR char_length(e.valor) NOT BETWEEN 1 AND max_largo
       );
$$;

-- =============================================================================
-- 3. Cuentas y familia
-- =============================================================================

-- Superclase abstracta Usuario.
CREATE TABLE usuario (
    id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_usuario       tipo_usuario NOT NULL,
    nombre             varchar(80)  NOT NULL,
    correo             varchar(254) NOT NULL,
    hash_contrasena    varchar(255) NOT NULL,
    correo_verificado  boolean      NOT NULL DEFAULT false,
    activo             boolean      NOT NULL DEFAULT true,
    -- No está en el diagrama; lo pide UsuarioAdmin.desactivadoEn (RF-22).
    desactivado_en     timestamptz,
    creado_en          timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_usuario_id_tipo UNIQUE (id, tipo_usuario),
    CONSTRAINT ck_usuario_nombre CHECK (char_length(btrim(nombre)) >= 1),
    CONSTRAINT ck_usuario_correo CHECK (correo ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    CONSTRAINT ck_usuario_desactivacion CHECK (
        (activo AND desactivado_en IS NULL) OR (NOT activo AND desactivado_en IS NOT NULL)
    )
);

-- {unique} sin distinguir mayúsculas (RF-01-AC-3); también sirve al login.
CREATE UNIQUE INDEX uq_usuario_correo ON usuario (lower(correo));

CREATE TABLE familia (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre     varchar(80) NOT NULL,
    creada_en  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_familia_nombre CHECK (char_length(btrim(nombre)) >= 1)
);

-- Subclase Cuidador. Familia "1" *-- "1..2" Cuidador (composición).
CREATE TABLE cuidador (
    id                        uuid          PRIMARY KEY,
    tipo_usuario              tipo_usuario  NOT NULL DEFAULT 'cuidador',
    familia_id                uuid          NOT NULL,
    tipo                      tipo_cuidador NOT NULL,
    declara_mayor_de_edad     boolean       NOT NULL,
    consiente_datos_propios   boolean       NOT NULL,
    consiente_datos_menores   boolean       NOT NULL,
    declarado_en              timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT ck_cuidador_tipo_usuario CHECK (tipo_usuario = 'cuidador'),
    CONSTRAINT fk_cuidador_usuario FOREIGN KEY (id, tipo_usuario)
        REFERENCES usuario (id, tipo_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_cuidador_familia FOREIGN KEY (familia_id)
        REFERENCES familia (id) ON DELETE CASCADE,
    -- Las tres declaraciones de RF-01 son obligatorias (RF-01-AC-2, RF-06-AC-2).
    CONSTRAINT ck_cuidador_declaraciones CHECK (
        declara_mayor_de_edad AND consiente_datos_propios AND consiente_datos_menores
    )
);

-- {exactamente un PRINCIPAL y a lo más un COCUIDADOR}: el máximo de cada uno
-- lo garantizan estos índices; el mínimo de un principal, un trigger diferido
-- (sección 9).
CREATE UNIQUE INDEX uq_cuidador_principal_por_familia
    ON cuidador (familia_id) WHERE tipo = 'principal';
CREATE UNIQUE INDEX uq_cuidador_cocuidador_por_familia
    ON cuidador (familia_id) WHERE tipo = 'cocuidador';

-- Subclase Medico.
CREATE TABLE medico (
    id                     uuid         PRIMARY KEY,
    tipo_usuario           tipo_usuario NOT NULL DEFAULT 'medico',
    especialidad           varchar(80),
    version_terminos       integer      NOT NULL,
    terminos_aceptados_en  timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT ck_medico_tipo_usuario CHECK (tipo_usuario = 'medico'),
    CONSTRAINT fk_medico_usuario FOREIGN KEY (id, tipo_usuario)
        REFERENCES usuario (id, tipo_usuario) ON DELETE CASCADE,
    CONSTRAINT ck_medico_version_terminos CHECK (version_terminos >= 1)
);

-- Subclase Administrador (sin atributos propios).
CREATE TABLE administrador (
    id            uuid         PRIMARY KEY,
    tipo_usuario  tipo_usuario NOT NULL DEFAULT 'administrador',
    CONSTRAINT ck_administrador_tipo_usuario CHECK (tipo_usuario = 'administrador'),
    CONSTRAINT fk_administrador_usuario FOREIGN KEY (id, tipo_usuario)
        REFERENCES usuario (id, tipo_usuario) ON DELETE CASCADE
);

-- Clase de asociación MiembroCirculo: Familia "0..*" -- "0..*" Medico.
CREATE TABLE miembro_circulo (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    familia_id  uuid        NOT NULL REFERENCES familia (id) ON DELETE CASCADE,
    medico_id   uuid        NOT NULL REFERENCES medico (id) ON DELETE CASCADE,
    desde       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_miembro_circulo UNIQUE (familia_id, medico_id)
);

CREATE INDEX ix_miembro_circulo_medico ON miembro_circulo (medico_id);

-- Familia "1" *-- "0..*" Invitacion; Invitacion "0..*" --> "0..1" Usuario (aceptadaPor).
CREATE TABLE invitacion (
    id               uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
    familia_id       uuid              NOT NULL REFERENCES familia (id) ON DELETE CASCADE,
    tipo             tipo_invitacion   NOT NULL,
    correo           varchar(254)      NOT NULL,
    estado           estado_invitacion NOT NULL DEFAULT 'pendiente',
    -- No está en el diagrama: SHA-256 en hex del token del enlace. RNF-05 exige
    -- guardar los enlaces de invitación de forma no reversible y la API busca
    -- la invitación por tokenInvitacion (POST /registros).
    token_hash       char(64)          NOT NULL,
    aceptada_por_id  uuid              REFERENCES usuario (id) ON DELETE SET NULL,
    creada_en        timestamptz       NOT NULL DEFAULT now(),
    vence_en         timestamptz       NOT NULL,
    CONSTRAINT uq_invitacion_token UNIQUE (token_hash),
    CONSTRAINT ck_invitacion_correo CHECK (correo ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    CONSTRAINT ck_invitacion_token CHECK (token_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_invitacion_vigencia CHECK (vence_en > creada_en),
    CONSTRAINT ck_invitacion_aceptada_por CHECK (aceptada_por_id IS NULL OR estado = 'aceptada')
);

CREATE INDEX ix_invitacion_familia_estado ON invitacion (familia_id, estado);
CREATE INDEX ix_invitacion_correo ON invitacion (lower(correo));
CREATE INDEX ix_invitacion_aceptada_por ON invitacion (aceptada_por_id);
-- Proceso que marca como vencidas las invitaciones pendientes.
CREATE INDEX ix_invitacion_pendiente_vence ON invitacion (vence_en) WHERE estado = 'pendiente';
-- Una sola invitación pendiente de cocuidador por familia (RF-06-AC-3) y una
-- sola invitación pendiente por correo dentro de la misma familia.
CREATE UNIQUE INDEX uq_invitacion_cocuidador_pendiente
    ON invitacion (familia_id) WHERE tipo = 'cocuidador' AND estado = 'pendiente';
CREATE UNIQUE INDEX uq_invitacion_correo_pendiente
    ON invitacion (familia_id, lower(correo)) WHERE estado = 'pendiente';

-- Catálogo versionado de avisos (privacidad, emergencias, sin respuesta, qué es DAFI).
CREATE TABLE aviso (
    id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo               codigo_aviso NOT NULL,
    version              integer      NOT NULL,
    texto                text         NOT NULL,
    requiere_aceptacion  boolean      NOT NULL DEFAULT false,
    -- Médico que revisó el texto (RD-05).
    revisado_por         varchar(80),
    publicado_en         timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_aviso_codigo_version UNIQUE (codigo, version),
    CONSTRAINT ck_aviso_version CHECK (version >= 1),
    CONSTRAINT ck_aviso_texto CHECK (char_length(btrim(texto)) >= 1)
);

-- Usuario "1" *-- "0..*" AceptacionAviso; AceptacionAviso "0..*" --> "1" Aviso.
CREATE TABLE aceptacion_aviso (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   uuid        NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    aviso_id     uuid        NOT NULL REFERENCES aviso (id) ON DELETE RESTRICT,
    aceptado_en  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_aceptacion_aviso UNIQUE (usuario_id, aviso_id)
);

CREATE INDEX ix_aceptacion_aviso_aviso ON aceptacion_aviso (aviso_id);

-- =============================================================================
-- 4. Pacientes
-- =============================================================================

-- Familia "1" *-- "0..*" PerfilPaciente.
CREATE TABLE perfil_paciente (
    id                         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    familia_id                 uuid        NOT NULL REFERENCES familia (id) ON DELETE CASCADE,
    tipo                       tipo_perfil NOT NULL,
    nombre                     varchar(80) NOT NULL,
    fecha_nacimiento           date        NOT NULL,
    alergias                   text[]      NOT NULL DEFAULT '{}',
    medicamentos               text[]      NOT NULL DEFAULT '{}',
    compartir_con_cocuidador   boolean     NOT NULL DEFAULT false,
    resumen_activo             boolean     NOT NULL DEFAULT true,
    -- Necesario para la FK compuesta de consentimiento_adulto.
    CONSTRAINT uq_perfil_id_tipo UNIQUE (id, tipo),
    CONSTRAINT ck_perfil_nombre CHECK (char_length(btrim(nombre)) >= 1),
    -- RF-04-AC-2: la fecha de nacimiento no puede ser futura.
    CONSTRAINT ck_perfil_fecha_nacimiento CHECK (
        fecha_nacimiento >= DATE '1900-01-01' AND fecha_nacimiento <= CURRENT_DATE
    ),
    CONSTRAINT ck_perfil_alergias CHECK (arreglo_texto_valido(alergias, 30, 100)),
    CONSTRAINT ck_perfil_medicamentos CHECK (arreglo_texto_valido(medicamentos, 30, 100)),
    -- «Compartir con el cocuidador» solo aplica a perfiles de adulto; los de
    -- menores los ve siempre el cocuidador (sección 3.0 del SRS).
    CONSTRAINT ck_perfil_compartir_cocuidador CHECK (tipo <> 'menor' OR NOT compartir_con_cocuidador)
);

CREATE INDEX ix_perfil_paciente_familia ON perfil_paciente (familia_id);
-- Un solo perfil del propio cuidador por familia.
CREATE UNIQUE INDEX uq_perfil_propio_por_familia
    ON perfil_paciente (familia_id) WHERE tipo = 'propio';

-- PerfilPaciente "1" *-- "0..1" ConsentimientoAdulto {solo si tipo = ADULTO_REPRESENTADO}.
-- La FK compuesta (perfil_id, perfil_tipo) con perfil_tipo fijo hace cumplir la
-- nota del diagrama sin trigger.
CREATE TABLE consentimiento_adulto (
    id            uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id     uuid                  NOT NULL,
    perfil_tipo   tipo_perfil           NOT NULL DEFAULT 'adulto_representado',
    correo        varchar(254)          NOT NULL,
    estado        estado_consentimiento NOT NULL DEFAULT 'pendiente',
    -- ConsentimientoAdulto "0..*" --> "0..1" Aviso (versión aceptada).
    aviso_id      uuid                  REFERENCES aviso (id) ON DELETE RESTRICT,
    -- No está en el diagrama: hash del enlace de consentimiento/revocación (RNF-05).
    token_hash    char(64)              NOT NULL,
    vence_en      timestamptz           NOT NULL,
    otorgado_en   timestamptz,
    revocado_en   timestamptz,
    CONSTRAINT uq_consentimiento_perfil UNIQUE (perfil_id),
    CONSTRAINT uq_consentimiento_token UNIQUE (token_hash),
    CONSTRAINT ck_consentimiento_perfil_tipo CHECK (perfil_tipo = 'adulto_representado'),
    CONSTRAINT fk_consentimiento_perfil FOREIGN KEY (perfil_id, perfil_tipo)
        REFERENCES perfil_paciente (id, tipo) ON DELETE CASCADE,
    CONSTRAINT ck_consentimiento_correo CHECK (correo ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    CONSTRAINT ck_consentimiento_token CHECK (token_hash ~ '^[a-f0-9]{64}$'),
    -- RF-05-AC-3: al otorgarse se guardan la fecha y la versión del aviso.
    CONSTRAINT ck_consentimiento_otorgado CHECK (
        estado <> 'otorgado' OR (otorgado_en IS NOT NULL AND aviso_id IS NOT NULL)
    ),
    CONSTRAINT ck_consentimiento_revocado CHECK (
        estado <> 'revocado' OR (revocado_en IS NOT NULL AND otorgado_en IS NOT NULL)
    ),
    CONSTRAINT ck_consentimiento_fechas CHECK (
        revocado_en IS NULL OR otorgado_en IS NULL OR revocado_en >= otorgado_en
    )
);

CREATE INDEX ix_consentimiento_aviso ON consentimiento_adulto (aviso_id);
CREATE INDEX ix_consentimiento_pendiente_vence
    ON consentimiento_adulto (vence_en) WHERE estado = 'pendiente';

-- Clase de asociación PermisoHistorial: PerfilPaciente "0..*" -- "0..*" Medico (RF-08).
CREATE TABLE permiso_historial (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id            uuid        NOT NULL REFERENCES perfil_paciente (id) ON DELETE CASCADE,
    medico_id            uuid        NOT NULL REFERENCES medico (id) ON DELETE CASCADE,
    compartir_historial  boolean     NOT NULL DEFAULT false,
    actualizado_en       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_permiso_historial UNIQUE (perfil_id, medico_id)
);

CREATE INDEX ix_permiso_historial_medico ON permiso_historial (medico_id);

-- =============================================================================
-- 5. Catálogos
-- =============================================================================

-- Las etiquetas son filas, no un enum, para agregar etiquetas sin cambiar el
-- esquema (RNF-11, RD-07).
CREATE TABLE etiqueta (
    id      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo  varchar(30) NOT NULL,
    nombre  varchar(80) NOT NULL,
    CONSTRAINT uq_etiqueta_codigo UNIQUE (codigo),
    -- Schema CodigoEtiqueta.
    CONSTRAINT ck_etiqueta_codigo CHECK (codigo ~ '^[a-z_]{2,30}$'),
    CONSTRAINT ck_etiqueta_nombre CHECK (char_length(btrim(nombre)) >= 1)
);

CREATE TABLE pregunta_contexto (
    id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo          varchar(3)     NOT NULL,
    texto           varchar(300)   NOT NULL,
    tipo_respuesta  tipo_respuesta NOT NULL,
    opciones        text[]         NOT NULL DEFAULT '{}',
    obligatoria     boolean        NOT NULL,
    es_general      boolean        NOT NULL DEFAULT false,
    CONSTRAINT uq_pregunta_codigo UNIQUE (codigo),
    -- Parámetro preguntaId del OpenAPI (G1, P2, F1...).
    CONSTRAINT ck_pregunta_codigo CHECK (codigo ~ '^[A-Z][0-9]{1,2}$'),
    CONSTRAINT ck_pregunta_texto CHECK (char_length(btrim(texto)) >= 1),
    CONSTRAINT ck_pregunta_opciones CHECK (arreglo_texto_valido(opciones, 30, 100)),
    -- Las preguntas de opción necesitan opciones; las de texto libre no las llevan.
    CONSTRAINT ck_pregunta_opciones_por_tipo CHECK (
        (tipo_respuesta = 'texto' AND cardinality(opciones) = 0)
        OR (tipo_respuesta IN ('opcion', 'opcion_con_texto') AND cardinality(opciones) >= 2)
        OR tipo_respuesta IN ('numero_u_opcion', 'zona_cuerpo')
    )
);

-- Etiqueta "0..*" o-- "0..*" PreguntaContexto (preguntas específicas; agregación).
CREATE TABLE etiqueta_pregunta (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    etiqueta_id  uuid NOT NULL REFERENCES etiqueta (id) ON DELETE CASCADE,
    pregunta_id  uuid NOT NULL REFERENCES pregunta_contexto (id) ON DELETE CASCADE,
    CONSTRAINT uq_etiqueta_pregunta UNIQUE (etiqueta_id, pregunta_id)
);

CREATE INDEX ix_etiqueta_pregunta_pregunta ON etiqueta_pregunta (pregunta_id);

-- =============================================================================
-- 6. Conversaciones
-- =============================================================================

-- PerfilPaciente "1" *-- "0..*" Conversacion.
-- Conversacion "0..*" --> "0..1" Medico (destinatario) y --> "0..1" Cuidador (abiertaPor).
CREATE TABLE conversacion (
    id                      uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id               uuid                NOT NULL REFERENCES perfil_paciente (id) ON DELETE CASCADE,
    medico_id               uuid                REFERENCES medico (id) ON DELETE SET NULL,
    -- SET NULL: las conversaciones del cocuidador se conservan si sale de la
    -- familia (RF-06-AC-4, RF-06-AC-5).
    abierta_por_id          uuid                REFERENCES cuidador (id) ON DELETE SET NULL,
    titulo                  varchar(80)         NOT NULL,
    estado                  estado_conversacion NOT NULL DEFAULT 'BORRADOR',
    prioridad_indicada      boolean             NOT NULL DEFAULT false,
    -- Versión para ETag / If-Match; la API la incrementa en cada escritura.
    version                 integer             NOT NULL DEFAULT 1,
    creada_en               timestamptz         NOT NULL DEFAULT now(),
    enviada_en              timestamptz,
    aviso_sin_respuesta_en  timestamptz,
    CONSTRAINT ck_conversacion_titulo CHECK (char_length(btrim(titulo)) >= 1),
    CONSTRAINT ck_conversacion_version CHECK (version >= 1),
    -- Fuera de BORRADOR la conversación ya se envió alguna vez.
    CONSTRAINT ck_conversacion_enviada_en CHECK (
        (estado = 'BORRADOR' AND enviada_en IS NULL)
        OR (estado <> 'BORRADOR' AND enviada_en IS NOT NULL)
    ),
    CONSTRAINT ck_conversacion_fechas CHECK (enviada_en IS NULL OR enviada_en >= creada_en),
    -- En los estados en que un médico la atiende debe haber destinatario.
    CONSTRAINT ck_conversacion_medico_por_estado CHECK (
        estado NOT IN ('ENVIADA', 'EN_REVISION', 'INFO_SOLICITADA', 'CON_INDICACIONES')
        OR medico_id IS NOT NULL
    ),
    -- RF-20: el aviso por falta de respuesta solo existe para conversaciones enviadas.
    CONSTRAINT ck_conversacion_aviso_sin_respuesta CHECK (
        aviso_sin_respuesta_en IS NULL OR enviada_en IS NOT NULL
    )
);

-- Historial del perfil, de la más reciente a la más antigua (RF-18-AC-1) y
-- filtro por médico (RF-18).
CREATE INDEX ix_conversacion_perfil_creada ON conversacion (perfil_id, creada_en DESC);
CREATE INDEX ix_conversacion_perfil_medico ON conversacion (perfil_id, medico_id);
-- Bandeja del médico por estado (RF-16).
CREATE INDEX ix_conversacion_medico_estado ON conversacion (medico_id, estado);
CREATE INDEX ix_conversacion_estado ON conversacion (estado);
CREATE INDEX ix_conversacion_abierta_por ON conversacion (abierta_por_id);
-- Procesos programados: aviso por falta de respuesta (RF-20).
CREATE INDEX ix_conversacion_pendiente_aviso
    ON conversacion (enviada_en)
    WHERE estado = 'ENVIADA' AND aviso_sin_respuesta_en IS NULL;

-- Conversacion "0..*" --> "1..3" Etiqueta.
CREATE TABLE conversacion_etiqueta (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id  uuid NOT NULL REFERENCES conversacion (id) ON DELETE CASCADE,
    etiqueta_id      uuid NOT NULL REFERENCES etiqueta (id) ON DELETE RESTRICT,
    CONSTRAINT uq_conversacion_etiqueta UNIQUE (conversacion_id, etiqueta_id)
);

-- Filtro del historial por etiqueta (RF-18-AC-2, parámetro etiqueta de la API).
CREATE INDEX ix_conversacion_etiqueta_etiqueta ON conversacion_etiqueta (etiqueta_id, conversacion_id);

-- Conversacion "1" *-- "0..*" Respuesta; Respuesta "0..*" --> "1" PreguntaContexto.
-- Valor vigente de cada pregunta; el historial de cambios queda en evento
-- (tipo 'respuesta').
CREATE TABLE respuesta (
    id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id  uuid         NOT NULL REFERENCES conversacion (id) ON DELETE CASCADE,
    pregunta_id      uuid         NOT NULL REFERENCES pregunta_contexto (id) ON DELETE RESTRICT,
    opcion           varchar(100),
    texto            varchar(2000),
    -- F1: temperatura en °C con un decimal (RespuestaEntrada.numero: 30 a 45).
    numero           numeric(3,1),
    version          integer      NOT NULL DEFAULT 1,
    registrada_en    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_respuesta_conversacion_pregunta UNIQUE (conversacion_id, pregunta_id),
    CONSTRAINT ck_respuesta_algun_valor CHECK (num_nonnulls(opcion, texto, numero) >= 1),
    CONSTRAINT ck_respuesta_numero CHECK (numero IS NULL OR numero BETWEEN 30 AND 45),
    CONSTRAINT ck_respuesta_version CHECK (version >= 1)
);

CREATE INDEX ix_respuesta_pregunta ON respuesta (pregunta_id);

-- Conversacion "1" *-- "0..6" Foto (MAX_FOTOS; el máximo lo vigila un trigger).
CREATE TABLE foto (
    id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id  uuid         NOT NULL REFERENCES conversacion (id) ON DELETE CASCADE,
    -- Clave del objeto en el almacenamiento privado de archivos (RNF-06).
    clave_archivo    varchar(255) NOT NULL,
    bytes            integer      NOT NULL,
    ancho_px         integer      NOT NULL,
    alto_px          integer      NOT NULL,
    zona_sensible    boolean      NOT NULL DEFAULT false,
    subida_en        timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_foto_clave_archivo UNIQUE (clave_archivo),
    -- RF-11-AC-5 y schema Foto: JPEG de hasta 1 048 576 bytes.
    CONSTRAINT ck_foto_bytes CHECK (bytes BETWEEN 1 AND 1048576),
    -- LADO_MAX_PX es configurable, así que aquí solo se exige que sea positivo.
    CONSTRAINT ck_foto_dimensiones CHECK (ancho_px > 0 AND alto_px > 0)
);

CREATE INDEX ix_foto_conversacion ON foto (conversacion_id, subida_en);

-- Superclase Evento y sus siete subclases en una sola tabla.
-- Conversacion "1" *-- "0..*" Evento {ordered}; Evento "0..*" --> "0..1" Usuario (autor).
CREATE TABLE evento (
    id                    uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id       uuid                NOT NULL REFERENCES conversacion (id) ON DELETE CASCADE,
    tipo                  tipo_evento         NOT NULL,
    -- Nulo en eventos del sistema (cierre automático, SIN_MEDICO) y cuando el
    -- autor borró su cuenta (el evento se conserva, RF-06-AC-5).
    autor_id              uuid                REFERENCES usuario (id) ON DELETE SET NULL,
    fecha                 timestamptz         NOT NULL DEFAULT now(),

    -- Mensaje, SolicitudInformacion, Indicacion
    texto                 text,
    -- Mensaje
    responde_a_solicitud  boolean,
    -- SolicitudInformacion
    tipo_solicitud        tipo_solicitud,
    -- Indicacion
    decision              decision_medica,
    plazo_dias            integer,
    vigente               boolean,
    -- CambioEstado
    estado_anterior       estado_conversacion,
    estado_nuevo          estado_conversacion,
    -- RespuestaRegistrada: RespuestaRegistrada "0..*" --> "1" PreguntaContexto
    pregunta_id           uuid                REFERENCES pregunta_contexto (id) ON DELETE RESTRICT,
    valor                 varchar(2000),
    -- FotoAgregada: FotoAgregada "0..1" --> "1" Foto
    foto_id               uuid                REFERENCES foto (id) ON DELETE CASCADE,
    -- CitaMarcada: huella de la cita marcada «No es correcto» (RF-17-AC-6)
    cita_id               char(64),

    CONSTRAINT uq_evento_foto UNIQUE (foto_id),

    -- Cada columna de subclase solo puede tener valor en su subclase.
    CONSTRAINT ck_evento_texto_por_tipo CHECK (
        texto IS NULL OR tipo IN ('mensaje', 'solicitud_informacion', 'indicacion')
    ),
    CONSTRAINT ck_evento_responde_por_tipo CHECK (responde_a_solicitud IS NULL OR tipo = 'mensaje'),
    CONSTRAINT ck_evento_solicitud_por_tipo CHECK (tipo_solicitud IS NULL OR tipo = 'solicitud_informacion'),
    CONSTRAINT ck_evento_indicacion_por_tipo CHECK (
        (decision IS NULL AND plazo_dias IS NULL AND vigente IS NULL) OR tipo = 'indicacion'
    ),
    CONSTRAINT ck_evento_estado_por_tipo CHECK (
        (estado_anterior IS NULL AND estado_nuevo IS NULL) OR tipo = 'cambio_estado'
    ),
    CONSTRAINT ck_evento_respuesta_por_tipo CHECK (
        (pregunta_id IS NULL AND valor IS NULL) OR tipo = 'respuesta'
    ),
    CONSTRAINT ck_evento_foto_por_tipo CHECK (foto_id IS NULL OR tipo = 'foto'),
    CONSTRAINT ck_evento_cita_por_tipo CHECK (cita_id IS NULL OR tipo = 'cita_marcada'),

    -- Atributos obligatorios de cada subclase.
    CONSTRAINT ck_evento_mensaje CHECK (
        tipo <> 'mensaje' OR (texto IS NOT NULL AND responde_a_solicitud IS NOT NULL)
    ),
    CONSTRAINT ck_evento_solicitud CHECK (
        tipo <> 'solicitud_informacion'
        OR (texto IS NOT NULL AND tipo_solicitud IS NOT NULL AND char_length(texto) <= 2000)
    ),
    CONSTRAINT ck_evento_indicacion CHECK (
        tipo <> 'indicacion' OR (texto IS NOT NULL AND vigente IS NOT NULL)
    ),
    -- CON_INDICACIONES -> CON_INDICACIONES no es cambio de estado: las
    -- indicaciones nuevas se registran como evento indicacion (RF-15-AC-4).
    CONSTRAINT ck_evento_cambio_estado CHECK (
        tipo <> 'cambio_estado'
        OR (estado_nuevo IS NOT NULL AND estado_anterior IS DISTINCT FROM estado_nuevo)
    ),
    CONSTRAINT ck_evento_respuesta CHECK (
        tipo <> 'respuesta' OR (pregunta_id IS NOT NULL AND valor IS NOT NULL)
    ),
    CONSTRAINT ck_evento_foto CHECK (tipo <> 'foto' OR foto_id IS NOT NULL),
    CONSTRAINT ck_evento_cita_marcada CHECK (tipo <> 'cita_marcada' OR cita_id IS NOT NULL),

    -- Dominios.
    CONSTRAINT ck_evento_texto CHECK (texto IS NULL OR char_length(texto) BETWEEN 1 AND 4000),
    CONSTRAINT ck_evento_plazo_dias CHECK (plazo_dias IS NULL OR plazo_dias BETWEEN 1 AND 90),
    -- RF-15-AC-2: el plazo es obligatorio con consulta presencial y solo con ella.
    CONSTRAINT ck_evento_plazo_consulta CHECK (
        (decision IS NOT DISTINCT FROM 'consulta_presencial') = (plazo_dias IS NOT NULL)
    ),
    CONSTRAINT ck_evento_cita_id CHECK (cita_id IS NULL OR cita_id ~ '^[a-f0-9]{64}$')
);

-- Línea de tiempo en orden cronológico ({ordered}, RF-18-AC-3) y cálculo de
-- /ultimoEventoEn (bandeja y cierre automático, RF-15-AC-3).
CREATE INDEX ix_evento_conversacion_fecha ON evento (conversacion_id, fecha);
CREATE INDEX ix_evento_conversacion_tipo ON evento (conversacion_id, tipo);
CREATE INDEX ix_evento_autor ON evento (autor_id);
CREATE INDEX ix_evento_pregunta ON evento (pregunta_id);
-- RF-15-AC-4: a lo más una indicación vigente por conversación.
CREATE UNIQUE INDEX uq_evento_indicacion_vigente
    ON evento (conversacion_id) WHERE tipo = 'indicacion' AND vigente;

-- =============================================================================
-- 7. Contexto para el médico
-- =============================================================================

-- Conversacion "1" *-- "0..*" ResumenContexto; ResumenContexto "0..*" --> "1" Medico.
CREATE TABLE resumen_contexto (
    id                uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id   uuid           NOT NULL REFERENCES conversacion (id) ON DELETE CASCADE,
    medico_id         uuid           NOT NULL REFERENCES medico (id) ON DELETE CASCADE,
    estado            estado_resumen NOT NULL,
    proveedor_modelo  varchar(80),
    version_modelo    varchar(80),
    generado_en       timestamptz    NOT NULL DEFAULT now(),
    -- RF-17: todo resumen generado registra proveedor y versión del modelo.
    CONSTRAINT ck_resumen_modelo CHECK (
        estado <> 'disponible' OR (proveedor_modelo IS NOT NULL AND version_modelo IS NOT NULL)
    )
);

-- Último resumen de la conversación para ese médico.
CREATE INDEX ix_resumen_conversacion_medico
    ON resumen_contexto (conversacion_id, medico_id, generado_en DESC);
CREATE INDEX ix_resumen_medico ON resumen_contexto (medico_id);

-- ResumenContexto "1" *-- "0..*" CitaTextual; CitaTextual "0..*" --> "1" Evento (origen).
CREATE TABLE cita_textual (
    id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    resumen_id  uuid          NOT NULL REFERENCES resumen_contexto (id) ON DELETE CASCADE,
    -- CASCADE: si se borra el evento de origen (RF-21), la cita deja de existir.
    evento_id   uuid          NOT NULL REFERENCES evento (id) ON DELETE CASCADE,
    -- /id del diagrama: SHA-256 en hex, estable entre regeneraciones (D5). Lo
    -- calcula la API; se guarda para buscar la cita por citaId.
    huella      char(64)      NOT NULL,
    grupo       grupo_resumen NOT NULL,
    inicio      integer       NOT NULL,
    fin         integer       NOT NULL,
    texto       text          NOT NULL,
    CONSTRAINT uq_cita_resumen_huella UNIQUE (resumen_id, huella),
    CONSTRAINT ck_cita_huella CHECK (huella ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_cita_rango CHECK (inicio >= 0 AND fin > inicio),
    CONSTRAINT ck_cita_texto CHECK (char_length(texto) >= 1)
);

CREATE INDEX ix_cita_textual_evento ON cita_textual (evento_id);
CREATE INDEX ix_cita_textual_huella ON cita_textual (huella);

-- =============================================================================
-- 8. Privacidad y confianza
-- =============================================================================

-- Conversacion "1" *-- "0..*" RegistroAcceso; --> "1" Medico; --> "0..1" Foto (RNF-08).
CREATE TABLE registro_acceso (
    id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id  uuid         NOT NULL REFERENCES conversacion (id) ON DELETE CASCADE,
    -- RESTRICT: el registro de accesos es auditoría; las cuentas de médico se
    -- desactivan (RF-22), no se borran (RF-21-AC-4).
    medico_id        uuid         NOT NULL REFERENCES medico (id) ON DELETE RESTRICT,
    recurso          tipo_recurso NOT NULL,
    foto_id          uuid         REFERENCES foto (id) ON DELETE CASCADE,
    fecha            timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT ck_registro_acceso_foto CHECK ((recurso = 'foto') = (foto_id IS NOT NULL))
);

CREATE INDEX ix_registro_acceso_conversacion ON registro_acceso (conversacion_id, fecha DESC);
CREATE INDEX ix_registro_acceso_medico ON registro_acceso (medico_id);
CREATE INDEX ix_registro_acceso_foto ON registro_acceso (foto_id);

-- Notificacion "0..*" --> "1" Usuario (destinatario); --> "0..1" Conversacion (sobre).
CREATE TABLE notificacion (
    id               uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
    destinatario_id  uuid              NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    -- SET NULL: el aviso «La familia eliminó una conversación» debe sobrevivir
    -- al borrado de la conversación (RF-21-AC-3).
    conversacion_id  uuid              REFERENCES conversacion (id) ON DELETE SET NULL,
    tipo             tipo_notificacion NOT NULL,
    texto            varchar(500)      NOT NULL,
    leida            boolean           NOT NULL DEFAULT false,
    creada_en        timestamptz       NOT NULL DEFAULT now(),
    CONSTRAINT ck_notificacion_texto CHECK (char_length(btrim(texto)) >= 1)
);

CREATE INDEX ix_notificacion_destinatario ON notificacion (destinatario_id, leida, creada_en DESC);
CREATE INDEX ix_notificacion_conversacion ON notificacion (conversacion_id);

-- Registro mínimo sin contenido de salud de una conversación enviada y borrada
-- (RF-21). Sin FK a propósito: la conversación ya no existe.
CREATE TABLE registro_borrado (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversacion_id  uuid        NOT NULL,
    enviada_en       timestamptz NOT NULL,
    borrada_en       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_registro_borrado_conversacion UNIQUE (conversacion_id),
    CONSTRAINT ck_registro_borrado_fechas CHECK (borrada_en >= enviada_en)
);

-- Superclase Reporte y subclases ReporteAbuso y ReporteTecnico en una sola tabla.
-- Reporte "0..*" --> "1" Usuario (reportante); ReporteAbuso --> "1" Usuario
-- (reportado) y --> "0..1" Conversacion (desde).
CREATE TABLE reporte (
    id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo                   tipo_reporte  NOT NULL,
    descripcion            varchar(2000) NOT NULL,
    -- Nulo solo si el reportante borró su cuenta después (RNF-07); el reporte
    -- se conserva para el administrador.
    reportante_id          uuid          REFERENCES usuario (id) ON DELETE SET NULL,
    -- No está en el diagrama: copia del rol al momento del reporte, que el
    -- schema Reporte exige (rolReportante) aunque la cuenta ya no exista.
    rol_reportante         rol_usuario   NOT NULL,
    creado_en              timestamptz   NOT NULL DEFAULT now(),
    atendido               boolean       NOT NULL DEFAULT false,
    -- ReporteAbuso
    reportado_id           uuid          REFERENCES usuario (id) ON DELETE SET NULL,
    conversacion_id        uuid          REFERENCES conversacion (id) ON DELETE SET NULL,
    -- ReporteTecnico
    pantalla               varchar(80),
    ultimo_correlacion_id  uuid,
    CONSTRAINT ck_reporte_descripcion CHECK (char_length(btrim(descripcion)) >= 1),
    CONSTRAINT ck_reporte_abuso CHECK (
        tipo <> 'abuso' OR (pantalla IS NULL AND ultimo_correlacion_id IS NULL)
    ),
    CONSTRAINT ck_reporte_tecnico CHECK (
        tipo <> 'tecnico'
        OR (pantalla IS NOT NULL AND reportado_id IS NULL AND conversacion_id IS NULL)
    ),
    CONSTRAINT ck_reporte_no_autorreporte CHECK (reportado_id IS NULL OR reportado_id <> reportante_id)
);

-- Lista del administrador: pendientes por tipo, más recientes primero.
CREATE INDEX ix_reporte_tipo_atendido ON reporte (tipo, atendido, creado_en DESC);
CREATE INDEX ix_reporte_reportante ON reporte (reportante_id);
CREATE INDEX ix_reporte_reportado ON reporte (reportado_id);
CREATE INDEX ix_reporte_conversacion ON reporte (conversacion_id);

-- =============================================================================
-- 9. Triggers para multiplicidades y reglas que un CHECK no alcanza
-- =============================================================================

-- 9.1 Familia "1" *-- "1..2" Cuidador: toda familia tiene su cuidador
-- principal al confirmar la transacción (registro de RF-01 en una sola
-- transacción: usuario, familia y cuidador).
CREATE FUNCTION verificar_cuidador_principal() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_familia_id uuid;
BEGIN
    IF TG_TABLE_NAME = 'familia' THEN
        v_familia_id := NEW.id;
    ELSE
        v_familia_id := OLD.familia_id;
    END IF;

    IF EXISTS (SELECT 1 FROM familia WHERE id = v_familia_id)
       AND NOT EXISTS (SELECT 1 FROM cuidador
                       WHERE familia_id = v_familia_id AND tipo = 'principal') THEN
        RAISE EXCEPTION 'La familia % no tiene cuidador principal', v_familia_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER tg_familia_con_principal
    AFTER INSERT ON familia
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION verificar_cuidador_principal();

CREATE CONSTRAINT TRIGGER tg_cuidador_principal_no_falta
    AFTER UPDATE OR DELETE ON cuidador
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION verificar_cuidador_principal();

-- 9.2 Borrar la familia borra las cuentas de sus cuidadores (RF-21-AC-4). La
-- composición Familia *-- Cuidador solo puede bajar en cascada a la tabla
-- cuidador; este trigger completa el borrado en la superclase usuario. Las
-- cuentas de médico se conservan.
CREATE FUNCTION borrar_cuentas_de_familia() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM usuario u
    USING cuidador c
    WHERE c.id = u.id
      AND c.familia_id = OLD.id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER tg_familia_borra_cuentas
    BEFORE DELETE ON familia
    FOR EACH ROW EXECUTE FUNCTION borrar_cuentas_de_familia();

-- 9.3 Conversacion --> "1..3" Etiqueta: máximo tres (RF-09-AC-2,
-- LIMITE_ALCANZADO). Se bloquea la conversación para evitar carreras.
CREATE FUNCTION verificar_maximo_etiquetas() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM 1 FROM conversacion WHERE id = NEW.conversacion_id FOR UPDATE;
    IF (SELECT count(*) FROM conversacion_etiqueta
        WHERE conversacion_id = NEW.conversacion_id) >= 3 THEN
        RAISE EXCEPTION 'LIMITE_ALCANZADO: una conversación admite como máximo tres etiquetas'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_conversacion_etiqueta_maximo
    BEFORE INSERT ON conversacion_etiqueta
    FOR EACH ROW EXECUTE FUNCTION verificar_maximo_etiquetas();

-- 9.4 Conversacion --> "1..3" Etiqueta: al menos una al confirmar la transacción.
CREATE FUNCTION verificar_minimo_etiquetas() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_conversacion_id uuid;
BEGIN
    IF TG_TABLE_NAME = 'conversacion' THEN
        v_conversacion_id := NEW.id;
    ELSE
        v_conversacion_id := OLD.conversacion_id;
    END IF;

    IF EXISTS (SELECT 1 FROM conversacion WHERE id = v_conversacion_id)
       AND NOT EXISTS (SELECT 1 FROM conversacion_etiqueta
                       WHERE conversacion_id = v_conversacion_id) THEN
        RAISE EXCEPTION 'La conversación % debe tener al menos una etiqueta', v_conversacion_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER tg_conversacion_con_etiqueta
    AFTER INSERT ON conversacion
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION verificar_minimo_etiquetas();

CREATE CONSTRAINT TRIGGER tg_conversacion_etiqueta_no_falta
    AFTER UPDATE OR DELETE ON conversacion_etiqueta
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION verificar_minimo_etiquetas();

-- 9.5 Conversacion *-- "0..6" Foto: máximo MAX_FOTOS = 6 (RF-11-AC-4). Si el
-- parámetro cambia, se cambia esta constante.
CREATE FUNCTION verificar_maximo_fotos() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM 1 FROM conversacion WHERE id = NEW.conversacion_id FOR UPDATE;
    IF (SELECT count(*) FROM foto WHERE conversacion_id = NEW.conversacion_id) >= 6 THEN
        RAISE EXCEPTION 'LIMITE_ALCANZADO: una conversación admite hasta 6 fotos'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_foto_maximo
    BEFORE INSERT ON foto
    FOR EACH ROW EXECUTE FUNCTION verificar_maximo_fotos();

-- 9.6 Nota del diagrama: {el médico pertenece al círculo de la familia del
-- perfil}. Se verifica al abrir, redirigir (RF-08-AC-4) o cambiar de médico.
-- Si el médico sale después del círculo, la conversación conserva la
-- referencia y la API la pasa a SIN_MEDICO (RF-08-AC-3).
CREATE FUNCTION verificar_medico_en_circulo() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.medico_id IS NULL THEN
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE'
       AND NEW.medico_id IS NOT DISTINCT FROM OLD.medico_id
       AND NEW.perfil_id = OLD.perfil_id THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM perfil_paciente p
        JOIN miembro_circulo m ON m.familia_id = p.familia_id
        WHERE p.id = NEW.perfil_id
          AND m.medico_id = NEW.medico_id
    ) THEN
        RAISE EXCEPTION 'El médico % no pertenece al círculo de la familia del perfil %',
            NEW.medico_id, NEW.perfil_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_conversacion_medico_en_circulo
    BEFORE INSERT OR UPDATE OF medico_id, perfil_id ON conversacion
    FOR EACH ROW EXECUTE FUNCTION verificar_medico_en_circulo();

-- =============================================================================
-- 10. Vistas con los atributos derivados del diagrama
-- =============================================================================

-- /edadAnios y /estado de PerfilPaciente (schema Perfil).
CREATE VIEW v_perfil_paciente AS
SELECT
    p.*,
    extract(year FROM age(CURRENT_DATE::timestamp, p.fecha_nacimiento::timestamp))::integer
        AS edad_anios,
    CASE
        WHEN p.tipo = 'adulto_representado'
             AND NOT EXISTS (SELECT 1 FROM consentimiento_adulto c
                             WHERE c.perfil_id = p.id AND c.estado = 'otorgado')
        THEN 'pendiente_consentimiento'::estado_perfil
        ELSE 'activo'::estado_perfil
    END AS estado
FROM perfil_paciente p;

-- /ultimoEventoEn de Conversacion (bandeja RF-16 y cierre automático RF-15-AC-3).
CREATE VIEW v_conversacion AS
SELECT
    c.*,
    COALESCE((SELECT max(e.fecha) FROM evento e WHERE e.conversacion_id = c.id), c.creada_en)
        AS ultimo_evento_en
FROM conversacion c;

COMMIT;
