# Definition of Done: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4:** Armando Arredondo Valle (A01424709), Isaac González Trejo (A01274193), Francisco Martínez Álvarez (A01840483) y Daniel Ruán Aguilar (A01731921)
**Actividad:** S03-A2, Parte 3
**Vigente desde:** Sprint 1 (5 de octubre de 2026). Sustituye a la lista preliminar de `S03_A1/backlog_completo.md`.

Le pedimos a una sesión de agente, sin mostrarle la lista preliminar del backlog, que propusiera una Definition of Done para DAFI. Propuso 22 puntos (16 por historia y 6 por incremento), todos atados al SRS. La tomamos como base y la ajustamos a nuestro contexto: cuatro personas con 8 a 9 horas por semana, sin CI/CD completo todavía (GitHub Actions con lint y pruebas llega con HAB-01 en el Sprint 1; el despliegue automático depende de los servicios gratuitos que elijamos) y sin equipo de QA aparte. La propuesta completa está en `evidencia/propuesta_agente_dod.md` y los cambios en la sección 5.

---

## 1. Cómo se usa

Los criterios de aceptación dicen qué hace una historia, y la DoD, con qué calidad se entrega cualquier historia. Una historia que no cumple la DoD no se presenta en la Sprint Review como terminada y regresa al Product Backlog (Guía de Scrum, 2020).

| Rol | Qué verifica |
|---|---|
| **Autor** (Developer que hizo la historia) | Llena la lista de la plantilla de pull request y adjunta la evidencia. |
| **Revisor** (otro Developer, se rota) | Aprueba el pull request solo si los puntos de código, pruebas, documentación y seguridad se cumplen. |
| **Product Owner** | Acepta la historia en el ambiente desplegado contra sus criterios y revisa que los textos no tengan juicio clínico (D14, D15). Es el único que mueve una historia a «Terminada». |
| **Scrum Master** | Revisa la DoD de incremento antes de la Sprint Review y modera si hay desacuerdo sobre un punto. No acepta historias. |

El tiempo de cumplir la DoD ya está dentro de los story points de cada historia (la equivalencia de 2 h/SP lo considera). Si un sprint no alcanza, se sacan historias del sprint, no puntos de la DoD.

---

## 2. DoD de historia

### Código

**D1. Pull request revisado.** Todo cambio entra a `main` por un pull request enlazado al issue de la historia, con al menos una aprobación de un Developer distinto del autor y sin comentarios pendientes.
*Cómo se verifica:* `main` protegida en GitHub con «Require 1 approval».

**D2. Lint sin errores.** ESLint y Prettier pasan en `web/` y en `api/`. No quedan `console.log` de depuración ni `TODO` sin issue.
*Cómo se verifica:* check de GitHub Actions en el pull request.

**D3. Parámetros y reloj configurables.** Los valores de la tabla 3.4 del SRS se leen de configuración y no aparecen como números en el código; la lógica que depende de la hora usa el reloj inyectable.
*Cómo se verifica:* el revisor busca en el diff números que correspondan a un parámetro.

**D4. Autorización y errores centralizados.** Cada endpoint nuevo usa el middleware común de autorización (primero el rol, `SIN_PERMISOS`; después la pertenencia, `NO_ENCONTRADO`) y responde errores solo con los códigos del contrato del SRS, con identificador de correlación y sin trazas internas.
*Cómo se verifica:* el revisor confirma que no hay comprobaciones propias en el endpoint; las pruebas de D6 lo confirman.

### Pruebas

**D5. Cada criterio de aceptación tiene su prueba con su identificador.** El nombre de la prueba empieza con el `RF-XX-AC-Y` que cubre, por ejemplo `it('RF-04-AC-2: fecha de nacimiento futura responde DATOS_INVALIDOS', …)`. Si la cubre en parte, lo dice: `RF-17-AC-1 (parcial): …`.
*Cómo se verifica:* el revisor compara los criterios del issue con `grep -rhoE "RF-[0-9]{2}-AC-[0-9]+" --include="*.test.*" . | sort -u`.

**D6. Pruebas negativas de acceso en endpoints con datos de la familia.** Además de D5, cada endpoint que devuelve o modifica datos de una familia tiene una prueba con un rol sin permiso (espera `SIN_PERMISOS`) y otra con un recurso de otra familia (espera `NO_ENCONTRADO`), con el sufijo `AUTZ` en el nombre.
*Cómo se verifica:* las pruebas aparecen en el pull request y pasan.

**D7. Suite completa en verde, integrada en `main`.** Toda la suite pasa sobre la rama actualizada con `main` y después de fusionar. No hay pruebas desactivadas sin issue. Las pruebas usan solo datos sintéticos.
*Cómo se verifica:* check de GitHub Actions en el pull request y en `main`.

**D8. Verificación en celular.** Otro Developer recorre los criterios de la historia con el navegador emulando 360 px de ancho, sin desplazamiento horizontal, solo con teclado y sin estados indicados únicamente con color. Si la historia toca la cámara, las fotos o la sesión, también lo prueba en un iPhone real con Safari. Las pantallas del médico se prueban además a 1280 px.
*Cómo se verifica:* una captura por navegador en el pull request.

### Documentación

**D9. Contrato de la API actualizado.** Desde que exista `openapi.yaml` (S04), cada operación nueva o modificada se documenta en el mismo pull request, con sus esquemas, sus códigos de error y la extensión `x-acceptance-criteria` con los identificadores que cubre, y el archivo valida sin errores. Antes de S04, el endpoint se describe en el README de `api/`.
*Cómo se verifica:* `npx @redocly/cli lint openapi.yaml` en GitHub Actions.

**D10. Configuración documentada.** Si la historia agrega una variable de entorno, una colección o un catálogo, se actualizan `.env.example` y el README, y el proyecto se levanta en limpio siguiendo el README.
*Cómo se verifica:* el revisor clona la rama y la levanta.

### Seguridad y privacidad

**D11. Nada sensible fuera de su lugar.** Ni los logs, ni los correos, ni las URL, ni los mensajes de error contienen contraseñas, tokens, texto de mensajes, nombres de pacientes ni correos en texto claro (RNF-13, RF-19).
*Cómo se verifica:* el revisor revisa cada `logger`, plantilla de correo y ruta del diff.

**D12. Sin secretos ni dependencias vulnerables.** No hay claves ni cadenas de conexión en el repositorio (`.env` en `.gitignore`) y las dependencias nuevas no traen vulnerabilidades altas o críticas.
*Cómo se verifica:* el escaneo de secretos de GitHub, activo en el repositorio público, y `npm audit --audit-level=high` en GitHub Actions.

**D13. Controles de dominio cuando la historia los toca.**

| Si la historia toca… | Debe cumplir y probar |
|---|---|
| Contraseñas, enlaces o sesiones | Argon2id o bcrypt, enlaces guardados de forma no reversible, expiración y revocación de sesiones (RNF-05) |
| Fotos | Sin EXIF al guardar y al entregar, sin URL públicas, visor sin descarga para zona del pañal o genital (RNF-06) |
| Módulo de resumen | La petición no lleva nombre, fecha de nacimiento ni correo, ni eventos que el médico no pueda ver (RNF-12, RF-17-AC-3) |
| Borrado | Borrado físico en la base y en el almacenamiento de archivos (RNF-07) |
| Apertura de conversación o foto por el médico | Registro de quién, qué y cuándo (RNF-08) |

*Cómo se verifica:* el autor marca en el pull request qué filas aplican y enlaza la prueba de cada una.

### Aceptación

**D14. Textos sin juicio clínico.** Todo texto que muestra el sistema coincide con el SRS o con el catálogo. Ningún texto nuevo interpreta o califica la salud del paciente (RD-01). Los textos que requieren revisión médica se marcan «pendiente RD-05» en el catálogo.
*Cómo se verifica:* el PO compara los textos en pantalla con el SRS durante la aceptación.

**D15. Desplegada y aceptada por el PO.** La versión de `main` con la historia está desplegada en el ambiente público con datos sintéticos, y el PO recorrió ahí cada criterio de aceptación. Solo entonces la historia pasa a «Terminada» en el tablero.
*Cómo se verifica:* comentario del PO en el issue con la fecha, el commit desplegado y el resultado por criterio.

---

## 3. DoD de incremento (antes de cada Sprint Review)

**I1. Solo se presenta lo terminado.** Toda historia que se muestra en la Review cumple D1 a D15; las demás regresan al Product Backlog con una nota de lo que falta. *Verifica:* el SM, comparando el tablero con los pull requests fusionados.

**I2. Regresión del flujo construido.** En el ambiente desplegado se recorre de extremo a extremo el flujo construido hasta ese sprint, con un guion escrito en el repositorio que crece cada sprint. *Verifica:* un Developer que no programó historias de ese flujo en el sprint.

**I3. Privacidad del ambiente desplegado.** Se revisa una muestra de los logs buscando correos, textos de mensajes o tokens, y se confirma que la base solo tiene datos sintéticos. *Verifica:* el SM.

**I4. Versión etiquetada.** El commit desplegado lleva la etiqueta `sprint-N`. *Verifica:* el SM.

**I5. Deuda técnica visible.** Todo atajo del sprint (prueba pendiente, excepción de `npm audit`, texto pendiente de RD-05) está registrado como issue con la etiqueta `deuda-tecnica`. *Verifica:* el SM; el PO decide cuándo se paga.

---

## 4. Criterios de liberación (fuera de la DoD)

No se pueden cumplir sprint a sprint, pero deben estar listos antes de que una familia real use DAFI:

- HU-17 (eliminación de datos) y HU-01b (verificación de correo y recuperación de acceso) terminadas.
- Revisión médica de RD-05 registrada con nombre y fecha.
- Evaluación de RNF-09 con al menos 20 historiales sintéticos, por grupo.
- Prueba de usabilidad de RNF-04 con al menos 5 personas.
- Medición de disponibilidad (RNF-10) y rendimiento (RNF-01) en el ambiente público.
- Aviso de privacidad final que declare al proveedor del modelo de lenguaje (RD-06).

---

## 5. Cambios a la propuesta del agente

| # | Propuesta del agente | Ajuste | Por qué |
|---|---|---|---|
| D-01 | Prueba en Chrome para Android y Safari para iOS reales en **cada** historia con pantallas (H8) | Emulación a 360 px en todas; iPhone real solo si la historia toca cámara, fotos o sesión | Pedir dos dispositivos reales por historia consumiría horas que no tenemos y dependería de que quien revisa tenga ambos a la mano. Safari solo se comporta distinto en lo que el agente mismo señaló: HEIC, la cámara y las cookies. |
| D-02 | `gitleaks` como herramienta adicional para detectar secretos (H12) | El escaneo de secretos que GitHub ya activa en repositorios públicos | Cumple el mismo propósito sin instalar ni mantener otra herramienta. |
| D-03 | Pruebas negativas de acceso para **todo** endpoint nuevo (H6) | Solo para endpoints que devuelven o modifican datos de una familia | Endpoints como el de salud o «Qué es DAFI» no tienen datos que proteger; la regla queda donde está el riesgo. |
| D-04 | `openapi.yaml` actualizado en cada pull request desde el Sprint 1 (H9) | Desde que el archivo exista (S04); antes, en el README de `api/` | `openapi.yaml` es el entregable de S04 y todavía no existe. Exigirlo antes obligaría a inventar el contrato. |
| D-05 | H7 (suite en verde) y H15 (integrada en `main`) por separado | Unidos en D7 | Con GitHub Actions corriendo en el pull request y en `main`, es una sola verificación. |
| D-06 | Matriz de trazabilidad generada por script cada sprint (I3) | Se pospone a S09 | El script es útil para la entrega de pruebas, pero construirlo ahora quita horas del goal. Mientras tanto, D5 ya garantiza que cada prueba lleva su identificador, que es lo que la matriz necesita. |
| D-07 | Verificación de `npm audit` en el incremento (I5) además de por historia | Solo por historia (D12) | Con el check en GitHub Actions, repetirlo en el incremento no aporta. |
| D-08 | Roles de verificación: autor, revisor, PO y SM | Sin cambio; agregamos que solo el PO mueve una historia a «Terminada» | Separa con claridad la responsabilidad del PO (aceptar el valor) de la de los Developers (la calidad técnica) y del SM (que se respete la DoD). |
| D-09 | Criterios de liberación con HU-17 | Agregamos HU-01b | Al dividir HU-01 en el Sprint Planning, la verificación de correo y la recuperación de acceso quedaron para el Sprint 2 y también son condición para usuarios reales. |

La DoD quedó en 15 puntos de historia y 5 de incremento. La lista para la plantilla de pull request está en la sección 6.

---

## 6. Lista para la plantilla de pull request

```markdown
## Definition of Done
- [ ] D1 PR enlazado al issue, aprobado por otro Developer
- [ ] D2 Lint sin errores (Actions)
- [ ] D3 Parámetros desde configuración; reloj inyectable
- [ ] D4 Middleware de autorización; errores del contrato con correlación
- [ ] D5 Cada RF-XX-AC-Y tiene prueba con ese nombre
- [ ] D6 Pruebas AUTZ (si el endpoint toca datos de una familia)
- [ ] D7 Suite completa en verde tras actualizar con main
- [ ] D8 Capturas a 360 px [+ iPhone si toca cámara, fotos o sesión] [+ 1280 px si es del médico]
- [ ] D9 openapi.yaml (desde S04) o README de api/ actualizado
- [ ] D10 .env.example y README actualizados si aplica
- [ ] D11 Sin datos sensibles en logs, correos, URL ni errores
- [ ] D12 Sin secretos; npm audit sin hallazgos altos
- [ ] D13 Controles de dominio aplicables: (sesiones / fotos / resumen / borrado / accesos)
- [ ] D14 Textos idénticos al SRS o catálogo (lo revisa el PO)
- [ ] D15 Desplegada y aceptada por el PO (comentario en el issue)
```
