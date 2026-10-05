# Diferencias entre los SRS individuales y resolución de conflictos

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A1, Parte 0

> **Pendiente:** las secciones marcadas con `[PENDIENTE]` se completan cuando tengamos los `SRS_final.md` de Armando, Isaac y Daniel en la carpeta. Lo demás ya refleja las decisiones que llevaron a `SRS_equipo.md` 3.0.

---

## 1. Documentos de entrada

| Integrante | Documento | Versión | Alcance que describe |
|---|---|---|---|
| Armando Arredondo Valle | `SRS_final.md` (S02-A1) | [PENDIENTE] | Idea original: DAFI muestra a la persona información sobre manchas, lunares y problemas de la piel a partir de una foto. |
| Isaac González Trejo | `SRS_final.md` (S02-A1) | [PENDIENTE] | Idea original (ídem). |
| Daniel Ruán Aguilar | `SRS_final.md` (S02-A1) | [PENDIENTE] | Idea original (ídem). |
| Francisco Martínez Álvarez | `SRS_final.md` (S02-A1) | 2.1 | Intermediario entre la familia y su médico de confianza para problemas de piel, con presuposición de la IA para el médico y primeros auxilios para lesiones menores. |

Tres de los cuatro SRS parten del `proyecto_base.md` original, donde DAFI clasifica una imagen y le da a la persona una orientación sobre su lesión. El cuarto cambió de alcance a partir de la entrevista con la cliente real, que dijo que no usaría una app que juzgue la salud de sus hijos sin un médico de por medio.

## 2. Análisis de diferencias

### 2.1 Consenso

Requerimientos que aparecen en los cuatro documentos y pasaron al SRS de equipo con ajustes menores:

[PENDIENTE: confirmar con los cuatro SRS. Se esperan al menos estos:]

- Registro, inicio de sesión y recuperación de acceso → RF-01 a RF-03.
- Captura de fotos desde el celular, con reducción de tamaño y eliminación de EXIF → RF-11, RNF-02, RNF-06.
- Historial de consultas por usuario → RF-18.
- Borrado de datos a petición de la persona → RF-21, RNF-07.
- Aviso de privacidad y consentimiento para datos de salud conforme a la LFPDPPP → RF-01, RD-02.
- Stack Next.js, Express y MongoDB → 2.4.

### 2.2 Gaps

Requerimientos que solo uno o algunos integrantes identificaron:

| Requerimiento | Quién lo identificó | Decisión |
|---|---|---|
| Cocuidador con acceso a los perfiles de la familia | Francisco | Se conserva → RF-06 |
| Preguntas de contexto antes de enviar | Francisco | Se conserva y se generaliza por etiqueta → RF-10 |
| Bandeja del médico y solicitud de información | Francisco | Se conserva → RF-14, RF-16 |
| Aviso a la familia si el médico no responde | Francisco | Se conserva con texto fijo → RF-20 |
| Registro de accesos del médico visible para la familia | Francisco | Se conserva → RNF-08 |
| Idempotencia y reintentos ante mala señal | Francisco | Se conserva → RF-23 |
| [PENDIENTE: gaps aportados por Armando] | Armando | |
| [PENDIENTE: gaps aportados por Isaac] | Isaac | |
| [PENDIENTE: gaps aportados por Daniel] | Daniel | |

### 2.3 Conflictos y su resolución

| ID | Conflicto | Versiones en conflicto | Resolución | Dónde quedó |
|---|---|---|---|---|
| C-01 | **Qué es DAFI.** Una app que le dice a la persona qué podría tener en la piel, o un intermediario entre la familia y su médico. | SRS de Armando, Isaac y Daniel frente al de Francisco | Intermediario. Mostrarle a la persona información médica sobre una lesión implica un riesgo alto (falsa tranquilidad ante algo grave), exige validación clínica y regulación que no caben en el curso, y la cliente entrevistada dijo que no usaría esa versión. | 1.2, RD-01 |
| C-02 | **Rol de la IA.** Clasificar la imagen y mostrar el resultado a la persona; en el SRS 2.1, presuposición para el médico y primeros auxilios para la familia. | Los cuatro SRS | La IA ya no clasifica ni orienta. Su única función es el resumen de contexto: citas textuales del historial, verificadas por la API, sin texto propio. Con esto desaparecen la evaluación del modelo de imágenes y la dependencia de un conjunto de datos de lesiones. | RF-17, RNF-09, RNF-12 |
| C-03 | **Urgencia.** Reglas fijas de señales de alarma que mandan a la familia a urgencias (SRS 2.1) frente a mensajes de consulta según la clase predicha (idea original). | Los cuatro SRS | Ninguna de las dos. DAFI muestra siempre el mismo aviso de emergencias, sin evaluar las respuestas. La prioridad la marca la familia («Necesito respuesta pronto») y el médico decide. | RF-09, RF-13, RF-16 |
| C-04 | **Verificación de médicos.** Verificar la cédula en el Registro Nacional de Profesionistas (SRS 2.1). | SRS de Francisco frente a la visión de equipo | Sin verificación. El médico entra solo por invitación de una familia que ya lo conoce, la interfaz lo presenta como «Contacto agregado por usted» y existe el reporte de abuso. Se acepta el riesgo de suplantación a cambio de quitar fricción y un proceso manual de administración. | RF-07, RF-22, RD-03 |
| C-05 | **Tipos de consulta.** Solo piel (los cuatro SRS) frente a cualquier tema de salud. | Los cuatro SRS frente a la visión de equipo | Cualquier tema, organizado con etiquetas de un catálogo (Piel, Fiebre, Estómago, Respiratorio, Otro). Las preguntas de contexto dependen de la etiqueta. | 3.0, RF-10, RNF-11 |
| C-06 | **Un médico o varios.** Un médico de confianza por perfil (SRS 2.1) frente a un círculo de varios médicos. | SRS de Francisco frente a la visión de equipo | Varios médicos por familia; cada conversación se dirige a uno. Cada médico ve solo lo que le dirigen, salvo que la familia active «Compartir historial». | RF-07, RF-08, 3.0 |
| C-07 | **De quién se habla.** Persona adulta que consulta por sí misma (idea original) frente a menores de la familia (SRS 2.1). | Los cuatro SRS | Ambos, y además otros adultos de la familia (por ejemplo, un padre mayor) con su propio consentimiento por correo, que pueden revocar. | RF-04, RF-05, RD-02 |
| C-08 | [PENDIENTE: conflictos de detalle entre los SRS de Armando, Isaac y Daniel en lo que sí se conserva (contraseñas, tamaño de fotos, plazos, etc.)] | | | |

## 3. Equivalencia de identificadores

Los RF se renumeraron por épica. Esta tabla permite rastrear cada RF del SRS 2.1 de Francisco hasta el SRS de equipo.

| SRS 2.1 | SRS de equipo 3.0 | Cambio |
|---|---|---|
| RF-01 a RF-03 | RF-01 a RF-03 | Sin cambios de fondo; «tutor» pasa a «cuidador principal». |
| RF-04 | RF-04 | Se agregan medicamentos de uso continuo y el límite de edad para perfiles de menor. |
| (nuevo) | RF-05 | Perfil de otro adulto con consentimiento propio. |
| RF-05 | RF-06 | «Cotutor» pasa a «cocuidador». |
| RF-06, RF-07 | RF-07, RF-08 | Sin cédula; varios médicos; permisos de historial por médico. |
| RF-08 | RF-11 | Fotos opcionales, sin mínimo de tres. |
| RF-09 | RF-10 | Preguntas generales más preguntas por etiqueta. |
| RF-10 | RF-12 | Tres puntos de revisión en lugar de cuatro. |
| RF-11 | RF-13 | Reglas de alarma sustituidas por aviso fijo. |
| RF-12, RF-13 | (eliminados) | Sin presuposición ni primeros auxilios. |
| RF-14 | RF-16 | Sección «Urgentes» sustituida por «Prioridad indicada por la familia». |
| RF-15 | RF-14 | Sin cambios de fondo. |
| RF-16 | RF-15 | Indicaciones en texto libre; la decisión es opcional. |
| RF-17 | RF-20 | Texto fijo; plazo corto si la familia marcó prioridad. |
| RF-18 | RF-18 | Filtros por etiqueta y por médico. |
| (nuevo) | RF-17 | Resumen de contexto. |
| RF-19 | RF-19 | Eventos ajustados. |
| RF-20 | RF-21 | Sin presuposición que borrar. |
| RF-21 | (eliminado) | Ya no hay modelo que entrenar con fotos. |
| RF-22 | RF-22 | Reportes de abuso en lugar de verificación de cédula. |
| RF-23 | RF-23 | Falla del módulo de resumen en lugar del de inferencia. |

## 4. Aportes de cada integrante al SRS de equipo

| Integrante | Aporte |
|---|---|
| Armando Arredondo Valle | [PENDIENTE] |
| Isaac González Trejo | [PENDIENTE] |
| Daniel Ruán Aguilar | [PENDIENTE] |
| Francisco Martínez Álvarez | La entrevista con la cliente real que motivó el cambio de alcance (C-01), el flujo familia-médico, la matriz de roles, la máquina de estados de la conversación, el contrato de errores y los criterios de aceptación de RF-01 a RF-03, RF-06, RF-14 a RF-16 y RF-18 a RF-23, heredados del SRS 2.1. |
