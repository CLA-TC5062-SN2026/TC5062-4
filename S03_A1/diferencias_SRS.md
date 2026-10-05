# Diferencias entre los SRS individuales y resolución de conflictos

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A1, Parte 0

> **Pendiente:** las secciones marcadas con `[PENDIENTE]` se completan cuando tengamos los `SRS_final.md` de Armando e Isaac. Los de Daniel y Francisco ya están analizados.

---

## 1. Documentos de entrada

| Integrante | Versión | Alcance que describe |
|---|---|---|
| Armando Arredondo Valle | [PENDIENTE] | Idea original de `proyecto_base.md`. |
| Isaac González Trejo | [PENDIENTE] | Idea original de `proyecto_base.md`. |
| Daniel Ruán Aguilar | 1.2, «validado técnicamente» | Idea original: la persona sube una foto de su piel y recibe una clasificación orientativa del modelo, con resultado no concluyente bajo un umbral, historial, eliminación, consentimiento para mejorar el modelo, métricas y versiones del modelo para el administrador. 19 RF, 13 RNF y 9 RD. |
| Francisco Martínez Álvarez | 2.1 | Intermediario entre la familia y su médico de confianza para problemas de piel, con presuposición de la IA para el médico y primeros auxilios para lesiones menores. 23 RF, 11 RNF y 9 RD. |

Los SRS que parten del `proyecto_base.md` original describen una app en la que DAFI clasifica una imagen y le da a la persona una orientación sobre su lesión. El de Francisco cambió de alcance después de la entrevista con la cliente real, que dijo que no usaría una app que juzgue la salud de sus hijos sin un médico de por medio. La diferencia principal es de producto y la resolvimos primero (C-01); después revisamos requerimiento por requerimiento qué se podía conservar de cada SRS.

## 2. Análisis de diferencias

### 2.1 Consenso

Requerimientos presentes tanto en el SRS de Daniel como en el de Francisco, que pasaron al SRS de equipo. [PENDIENTE: confirmar con los SRS de Armando e Isaac.]

| Tema | Daniel | Francisco | SRS de equipo |
|---|---|---|---|
| Registro con correo y contraseña; rechazo de correo duplicado sin revelar la cuenta | RF-01 | RF-01 | RF-01 |
| Inicio de sesión sin indicar qué credencial falló | RF-02-AC-2 | RF-02-AC-2 | RF-02-AC-2 |
| Recuperación con la misma respuesta exista o no la cuenta, e invalidación de sesiones | RF-19 | RF-03 | RF-03 |
| Cierre de sesión que invalida el token | RF-17 | RF-02-AC-4 | RF-02-AC-4 |
| Aceptación registrada del aviso de privacidad con versión y fecha | RF-03 | RF-01 | RF-01 |
| Historial que muestra solo lo propio, con verificación de propiedad | RF-11, RNF-02 | RF-18, 3.0 | RF-18 y reglas de acceso de 3.0 |
| Eliminación de lo cargado y de la cuenta, con confirmación explícita | RF-12, RF-13 | RF-20 | RF-21 |
| Falla de la IA sin inventar un resultado | RF-07-AC-3 | RF-23-AC-1 | RF-23-AC-1 |
| Contraseñas con hash adaptativo | RNF-03 | RNF-05 | RNF-05 |
| El contenido clínico lo aprueba un especialista | RD-04 | RD-06 | RD-05 |
| DAFI no diagnostica ni prescribe | RD-01, RD-02 | RD-01 | RD-01 |
| Stack Next.js, Express y MongoDB | RD-06 | 2.4 | 2.4 |
| IDs `RF-XX-AC-Y` reutilizados en la API y en las pruebas | 5 | 1.1 | 1.1 |

### 2.2 Gaps

Requerimientos que solo uno o algunos integrantes identificaron, y lo que decidimos con cada uno.

| Requerimiento | Quién lo identificó | Decisión | Dónde quedó |
|---|---|---|---|
| Volver a aceptar el aviso cuando se publica una versión nueva | Daniel (RF-03-AC-3) | Se incorpora | RF-01-AC-5 |
| Cerrar sesión sin sesión válida no produce error interno | Daniel (RF-17-AC-3) | Se incorpora | RF-02-AC-5 |
| Enlace de recuperación de un solo uso, guardado de forma no reversible | Daniel (RF-19-AC-2, RNF-11) | Se incorpora | RF-03-AC-1, RF-03-AC-4, RNF-05 |
| Causa específica cuando se rechaza un archivo (formato, tamaño) | Daniel (RF-06-AC-1) | Se incorpora en el cliente | RF-11-AC-7 |
| Historial vacío como estado normal, no como error | Daniel (RF-11-AC-3) | Se incorpora | RF-18-AC-4 |
| Informar qué se borró y qué se retiene al eliminar la cuenta | Daniel (RF-13-AC-3) | Se incorpora | RF-21-AC-5 |
| TLS 1.2+ y cifrado en reposo | Daniel (RNF-04) | Se incorpora | RNF-05 |
| Logs sin datos sensibles y auditoría de eventos de seguridad | Daniel (RNF-05, RNF-10) | Se incorpora | RNF-13 |
| Accesibilidad con teclado, foco visible y sin depender del color | Daniel (RNF-08) | Se incorpora | RNF-14 |
| Errores con identificador de correlación y sin trazas internas | Daniel (RNF-13) | Se incorpora | 3.0 (contrato de errores) |
| Revocar sesiones al restablecer la contraseña o borrar la cuenta | Daniel (RNF-12) | Se incorpora | RNF-05 |
| Gestión de versiones del modelo con reversión | Daniel (RF-16) | Se adapta: ya no hay modelo de imágenes, pero cada resumen registra la versión del modelo de lenguaje para poder revertirla | RF-17 |
| Declarar autorización para procesar datos de terceros | Daniel (RD-09) | Ya cubierto con un flujo más fuerte: el adulto representado da su propio consentimiento | RF-05 |
| Métricas agregadas para el administrador | Daniel (RF-15) | Se pospone a la versión 2. La única métrica que necesita la versión 1 es la tasa de citas marcadas como incorrectas (RNF-09) | — |
| Consentimiento y revocación para mejorar el modelo | Daniel (RF-14, RF-18, RD-07) y Francisco (RF-21) | Se elimina: DAFI ya no entrena ningún modelo, y RD-06 prohíbe que el proveedor use los datos para entrenar | RD-06 |
| Cocuidador con acceso a los perfiles de la familia | Francisco | Se conserva | RF-06 |
| Preguntas de contexto antes de enviar | Francisco | Se conserva y se generaliza por etiqueta | RF-10 |
| Bandeja del médico y solicitud de información | Francisco | Se conserva | RF-14, RF-16 |
| Aviso a la familia si el médico no responde | Francisco | Se conserva con texto fijo | RF-20 |
| Registro de accesos del médico visible para la familia | Francisco | Se conserva | RNF-08 |
| Idempotencia y reintentos ante mala señal | Francisco | Se conserva | RF-23 |
| [PENDIENTE: gaps aportados por Armando] | Armando | | |
| [PENDIENTE: gaps aportados por Isaac] | Isaac | | |

### 2.3 Conflictos y su resolución

| ID | Conflicto | Versiones en conflicto | Resolución | Dónde quedó |
|---|---|---|---|---|
| C-01 | **Qué es DAFI.** Una app que le da a la persona una clasificación orientativa de su lesión, o un intermediario entre la familia y su médico. | Daniel (1.2) y [PENDIENTE: Armando e Isaac] frente a Francisco (2.1) | Intermediario. Mostrarle a la persona información médica sobre una lesión implica un riesgo alto (falsa tranquilidad ante algo grave), exige validación clínica del modelo y regulación que no caben en el curso, y la cliente entrevistada dijo que no usaría esa versión. El propio SRS de Daniel dejaba como pendientes las afecciones, el umbral, las métricas clínicas y el conjunto de validación, que son las piezas que hacían inviable esa versión. | 1.2, RD-01 |
| C-02 | **Rol de la IA.** Clasificar la imagen y mostrar clase y confianza a la persona (Daniel); presuposición para el médico y primeros auxilios para la familia (Francisco). | Daniel y Francisco | La IA ya no clasifica ni orienta. Su única función es el resumen de contexto: citas textuales del historial, verificadas por la API, sin texto propio. Desaparecen el umbral de confianza, el resultado no concluyente, la evaluación del modelo de imágenes y la gestión de versiones aprobadas. | RF-17, RNF-09, RNF-12 |
| C-03 | **Urgencia.** Reglas fijas de señales de alarma (Francisco) frente a recomendación profesional según el resultado (Daniel). | Daniel y Francisco | Se descartan las dos. DAFI muestra siempre el mismo aviso de emergencias, sin evaluar las respuestas. La prioridad la marca la familia y el médico decide. | RF-09, RF-13, RF-16 |
| C-04 | **Vigencia del enlace de recuperación.** 30 minutos (Daniel) frente a 60 (Francisco). | Daniel y Francisco | 30 minutos y de un solo uso. Recuperar la contraseña da acceso a datos de salud de menores; acortar la ventana reduce el riesgo y no afecta la experiencia, porque el correo llega en segundos. | RF-03, 3.4 |
| C-05 | **Expiración de la sesión por inactividad.** 30 minutos (Daniel) frente a 60 (Francisco). | Daniel y Francisco | 30 minutos. Es un celular que se presta o se queda desbloqueado y la app muestra datos sensibles. Se revisará en las pruebas de usabilidad de RNF-04: si los médicos pierden la sesión a mitad de una respuesta, se discute subirlo para su rol. | RNF-05, 3.4 |
| C-06 | **Tamaño máximo de foto.** 10 MB (Daniel) frente a 1 MB (Francisco). | Daniel y Francisco | No es un conflicto real, porque los valores aplican en capas distintas. El cliente acepta originales de hasta 10 MB y los reduce; la API solo recibe fotos ya reducidas de 1 MB o menos. Quedan los dos límites, cada uno con su mensaje. | RF-11, RF-11-AC-7, 3.4 |
| C-07 | **Navegadores soportados.** Chrome, Edge, Firefox y Safari de 360 a 1920 px (Daniel) frente a Chrome para Android y Safari para iOS a 360 px (Francisco). | Daniel y Francisco | Unión según el rol. La familia usa el celular (Chrome para Android y Safari para iOS); el médico, además, los cuatro navegadores de escritorio de 1280 a 1920 px. | RNF-03 |
| C-08 | **Cómo medir la usabilidad.** 4 de 5 usuarios completan el flujo sin ayuda (Daniel) frente a tiempo máximo de 4 minutos (Francisco). | Daniel y Francisco | Se miden las dos cosas en la misma sesión: al menos 4 de 5 completan el envío sin ayuda, con una mediana de 3 minutos o menos. | RNF-04 |
| C-09 | **Verificación de médicos.** Verificar la cédula en el Registro Nacional de Profesionistas (Francisco). | Francisco frente a la visión de equipo | Sin verificación. El médico entra solo por invitación de una familia que ya lo conoce, la interfaz lo presenta como «Contacto agregado por usted» y existe el reporte de abuso. | RF-07, RF-22, RD-03 |
| C-10 | **Tipos de consulta.** Solo piel (todos los SRS individuales) frente a cualquier tema de salud. | Todos frente a la visión de equipo | Cualquier tema, organizado con etiquetas de un catálogo. | 3.0, RF-10, RNF-11 |
| C-11 | **Un médico o varios.** Un médico de confianza por perfil (Francisco); ninguno (Daniel). | Daniel y Francisco frente a la visión de equipo | Varios médicos por familia; cada conversación se dirige a uno, y cada médico ve solo lo que le dirigen, salvo que la familia active «Compartir historial». | RF-07, RF-08, 3.0 |
| C-12 | **De quién se habla.** La propia persona usuaria, con declaración de autorización para imágenes de terceros (Daniel); menores de la familia (Francisco). | Daniel y Francisco | Las dos cosas, más otros adultos de la familia. Para terceros adultos no basta la declaración de quien sube los datos: el adulto da su propio consentimiento por correo y lo puede revocar. | RF-04, RF-05, RD-02 |
| C-13 | [PENDIENTE: conflictos de detalle con los SRS de Armando e Isaac] | | | |

## 3. Equivalencia de identificadores

Los RF se renumeraron por épica en el SRS de equipo. Estas tablas permiten rastrear cada RF individual.

### 3.1 SRS de Francisco (2.1)

| SRS 2.1 | SRS de equipo | Cambio |
|---|---|---|
| RF-01 a RF-03 | RF-01 a RF-03 | «Tutor» pasa a «cuidador principal»; se suman criterios de Daniel. |
| RF-04 | RF-04 | Se agregan medicamentos y el límite de edad para perfiles de menor. |
| (nuevo) | RF-05 | Perfil de otro adulto con consentimiento propio. |
| RF-05 | RF-06 | «Cotutor» pasa a «cocuidador». |
| RF-06, RF-07 | RF-07, RF-08 | Sin cédula; varios médicos; permisos de historial por médico. |
| RF-08 | RF-11 | Fotos opcionales, sin mínimo de tres. |
| RF-09 | RF-10 | Preguntas generales más preguntas por etiqueta. |
| RF-10 | RF-12 | Tres puntos de revisión en lugar de cuatro. |
| RF-11 | RF-13 | Reglas de alarma sustituidas por aviso fijo. |
| RF-12, RF-13 | (eliminados) | Sin presuposición ni primeros auxilios. |
| RF-14 | RF-16 | «Urgentes» pasa a «Prioridad indicada por la familia». |
| RF-15 | RF-14 | Sin cambios de fondo. |
| RF-16 | RF-15 | Indicaciones en texto libre; la decisión es opcional. |
| RF-17 | RF-20 | Texto fijo; plazo corto si la familia marcó prioridad. |
| RF-18 | RF-18 | Filtros por etiqueta y por médico. |
| (nuevo) | RF-17 | Resumen de contexto. |
| RF-19 | RF-19 | Eventos ajustados. |
| RF-20 | RF-21 | Sin presuposición que borrar. |
| RF-21 | (eliminado) | Ya no hay modelo que entrenar. |
| RF-22 | RF-22 | Reportes de abuso en lugar de verificación de cédula. |
| RF-23 | RF-23 | Falla del módulo de resumen en lugar del de inferencia. |

### 3.2 SRS de Daniel (1.2)

| SRS 1.2 | SRS de equipo | Cambio |
|---|---|---|
| RF-01 | RF-01 | Con las declaraciones de consentimiento de datos de salud. |
| RF-02, RF-17 | RF-02 | Inicio y cierre de sesión en un solo RF; RF-17-AC-3 pasa a RF-02-AC-5. |
| RF-03 | RF-01 | La aceptación del aviso ocurre en el registro; RF-03-AC-3 pasa a RF-01-AC-5. |
| RF-04, RF-05, RF-06 | RF-11, RF-23 | Carga y validación de fotos; las causas específicas pasan a RF-11-AC-7. |
| RF-07 a RF-10 | (eliminados) | Sin inferencia sobre imágenes ni presentación de clasificaciones. |
| RF-11 | RF-18 | Historial por perfil; RF-11-AC-3 pasa a RF-18-AC-4. |
| RF-12, RF-13 | RF-21 | RF-13-AC-3 pasa a RF-21-AC-5. |
| RF-14, RF-18 | (eliminados) | Sin entrenamiento de modelos (RD-06). |
| RF-15 | (versión 2) | Métricas agregadas pospuestas. |
| RF-16 | RF-17 | Se conserva la idea de registrar la versión del modelo. |
| RF-19 | RF-03 | 30 minutos y de un solo uso. |
| RNF-02 | 3.0 | Matriz de roles y regla de acceso indebido. |
| RNF-03, RNF-04, RNF-11, RNF-12 | RNF-05 | Seguridad de contraseñas, transporte, reposo, tokens y sesiones. |
| RNF-05, RNF-10 | RNF-13 | Logs y auditoría. |
| RNF-06 | RNF-03 | Navegadores por rol. |
| RNF-07 | RNF-04 | Tasa de éxito junto con el tiempo. |
| RNF-08 | RNF-14 | Accesibilidad. |
| RNF-13 | 3.0 | Contrato de errores con correlación. |
| RNF-01, RNF-09 | RNF-01 | Tiempos de la nueva versión; ya no hay inferencia de imágenes que escalar. |

## 4. Aportes de cada integrante al SRS de equipo

| Integrante | Aporte |
|---|---|
| Armando Arredondo Valle | [PENDIENTE] |
| Isaac González Trejo | [PENDIENTE] |
| Daniel Ruán Aguilar | La capa de seguridad y calidad transversal: enlaces de un solo uso, sesiones de 30 minutos con revocación, TLS y cifrado en reposo, logs sin datos sensibles con auditoría, accesibilidad, errores con correlación, reaceptación del aviso en versiones nuevas, el estado vacío del historial, el aviso de lo que se retiene al borrar la cuenta y la convención `x-acceptance-criteria` para trazar los criterios en OpenAPI. Su RF-16 (versiones del modelo) inspiró el registro de la versión del modelo de lenguaje en cada resumen. |
| Francisco Martínez Álvarez | La entrevista con la cliente real que motivó el cambio de alcance (C-01), el flujo familia-médico, la matriz de roles, la máquina de estados de la conversación, el contrato de errores y los criterios de aceptación de RF-04, RF-06, RF-14 a RF-16 y RF-18 a RF-23, heredados del SRS 2.1. |

## 5. Efecto en el backlog

Los cambios de esta consolidación que tocan historias ya creadas se reflejaron en `backlog_completo.md` y en GitHub: HU-01 usa ahora 30 minutos para el enlace de restablecimiento, y RNF-13 y RNF-14 se agregaron a la Definition of Done. Los demás criterios nuevos (RF-01-AC-5, RF-02-AC-5, RF-03-AC-4, RF-11-AC-7, RF-18-AC-4, RF-21-AC-5) quedan cubiertos por las historias que ya incluyen su RF y se probarán con su identificador.
