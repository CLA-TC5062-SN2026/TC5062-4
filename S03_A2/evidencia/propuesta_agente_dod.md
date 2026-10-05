# Propuesta de Definition of Done: DAFI

**Curso:** (TC5062.10) Análisis, diseño y construcción de software
**Equipo 4**
**Fuentes:** `SRS_equipo.md` 3.0 y `backlog_completo.md` (sin considerar su sección «Definition of Done»)

---

## 1. Cómo se usa esta DoD

La Guía Scrum 2020 define la Definition of Done como la descripción formal del estado del Incremento cuando cumple las medidas de calidad del producto. Un elemento que no la cumple no se presenta en la Sprint Review como terminado y regresa al Product Backlog. Los criterios de aceptación dicen **qué** hace una historia; la DoD dice **con qué calidad** se entrega cualquier historia.

La propuesta tiene dos niveles:

- **DoD de historia (H1 a H16):** se revisa en cada Pull Request antes de mover la historia a «Terminada» en el tablero.
- **DoD de incremento (I1 a I6):** se revisa una vez por sprint, antes de la Sprint Review, sobre todo lo integrado.

Se agrega una tercera lista, **criterios de liberación**, que no forma parte de la DoD porque no se puede cumplir en cada sprint (sección 5).

**Roles que verifican.**

| Rol | Quién es en el equipo |
|---|---|
| Autor | Quien desarrolló la historia. Llena la lista de verificación del PR y adjunta la evidencia. |
| Revisor | Otro integrante, distinto del autor, que aprueba el PR. Se rota para que todos revisen código de todas las capas. |
| Product Owner (PO) | Confirma en el ambiente de pruebas que se cumplen los criterios de aceptación. |
| Scrum Master (SM) | Revisa la DoD de incremento antes de la Review y modera si hay desacuerdo sobre un punto. |

**Mientras no haya CI/CD completo**, cada punto que dice «check automático» se cumple con el comando correspondiente corrido por el autor y su salida pegada en el PR. Cuando exista el flujo de GitHub Actions (sección 4), la evidencia pasa a ser el check verde y el criterio no cambia.

**Costo.** Con 4 integrantes a 8 o 9 h por semana hay unas 68 h por sprint. La DoD consume tiempo (revisión, prueba en dispositivos, documentación) y ese tiempo **ya está dentro de los Story Points** de cada historia; no se estima aparte. Si un sprint no alcanza para cumplir la DoD, se sacan historias del sprint, no puntos de la DoD.

---

## 2. DoD de historia

### Código

**H1. Revisión por otro integrante.**
Todo cambio entra a `main` por un Pull Request enlazado al issue de la historia, con al menos una aprobación de alguien distinto del autor y sin comentarios pendientes.
*Verifica:* revisor. *Cómo:* `main` protegida en GitHub con «Require 1 approval»; el PR muestra la aprobación.
*Por qué:* en un equipo de cuatro con poco tiempo, la revisión es la única forma de que al menos dos personas conozcan cada parte del código, y es el punto donde se revisan los controles de privacidad de H11 a H13.

**H2. Estándares de código.**
ESLint y Prettier con la configuración compartida del repositorio pasan sin errores ni advertencias nuevas, en el cliente (Next.js) y en la API (Express). No quedan `console.log` de depuración, código comentado ni `TODO` sin issue asociado.
*Verifica:* autor y revisor. *Cómo:* `npm run lint` en ambos paquetes, salida en el PR.
*Por qué:* con cuatro personas escribiendo en las mismas capas, un formato uniforme hace que la revisión se enfoque en la lógica y no en el estilo.

**H3. Parámetros y reloj configurables.**
Los valores de la tabla 3.4 del SRS (`MAX_FOTOS`, `HORAS_SIN_RESPUESTA`, etc.) se leen de configuración y no aparecen como literales en el código. Toda lógica que depende de la hora usa el reloj inyectable.
*Verifica:* revisor. *Cómo:* revisa el diff buscando números que correspondan a un parámetro; las pruebas de la historia inyectan los valores declarados en el «Dado que».
*Por qué:* el SRS (3.0) exige cambiar parámetros sin cambiar código, y criterios como RF-15-AC-3 o RF-20-AC-1 no se pueden probar sin controlar el reloj.

**H4. Autorización y contrato de errores.**
Cada endpoint nuevo o modificado pasa por el middleware común de autorización basado en la matriz de roles (3.0), primero valida el rol (`SIN_PERMISOS`) y después la pertenencia del recurso (`NO_ENCONTRADO`). Los rechazos usan solo los códigos de la tabla del contrato de errores, incluyen identificador de correlación y no exponen trazas. Una falla a mitad de la operación no deja datos a medias (transacción o compensación).
*Verifica:* revisor. *Cómo:* revisa que el endpoint use el middleware y no una comprobación propia; las pruebas de H6 lo confirman.
*Por qué:* la fuga de datos más probable en DAFI es que un usuario pida por identificador un recurso de otra familia. Centralizar la regla evita que cada historia la implemente distinto.

### Pruebas

**H5. Un criterio, al menos una prueba con su identificador.**
Cada criterio de aceptación de la historia tiene al menos una prueba automatizada cuyo nombre empieza con su `RF-XX-AC-Y`, por ejemplo `it('RF-12-AC-3: envío sin G1 responde CONVERSACION_INCOMPLETA', ...)`. Si un criterio se cubre en parte (como RF-17-AC-1 en HU-13), el nombre lo dice: `RF-17-AC-1 (parcial): ...`.
*Verifica:* revisor. *Cómo:* compara la lista de criterios del issue con la salida de
`grep -rhoE "RF-[0-9]{2}-AC-[0-9]+" --include="*.test.*" . | sort -u`.
Ningún identificador de la historia puede faltar.
*Por qué:* el SRS (1.1) acordó que las pruebas de S09 se nombran con estos identificadores y que `openapi.yaml` los declara. Si la prueba no lleva el nombre, se pierde la trazabilidad entre requerimiento, API y prueba.

**H6. Pruebas negativas de acceso.**
Por cada endpoint nuevo hay, además de las de H5, una prueba con un rol que no tiene la operación (espera `SIN_PERMISOS`) y una con un recurso de otra familia o de una conversación que el médico no puede ver (espera `NO_ENCONTRADO`). Se nombran con el requerimiento y el sufijo `AUTZ`, por ejemplo `RF-14-AUTZ: médico no asignado no puede pedir información`.
*Verifica:* revisor. *Cómo:* las pruebas aparecen en el PR y pasan.
*Por qué:* los criterios de aceptación solo cubren algunos de estos casos (RF-04-AC-3, RF-08-AC-1, RF-22-AC-2). Con datos de salud de menores, cada endpoint debe probar que no entrega datos a quien no corresponde.

**H7. Suite completa en verde.**
Pasa la suite completa del repositorio (no solo las pruebas nuevas) sobre la rama actualizada con `main`. No hay pruebas desactivadas (`.skip`, `.only`, `xit`) sin un issue que lo explique. Las pruebas usan solo datos sintéticos: ningún nombre, foto ni historial de una persona real.
*Verifica:* autor y revisor. *Cómo:* `npm test` en cliente y API después de `git merge main`, salida en el PR (o check de Actions).
*Por qué:* las historias comparten el modelo de conversación y la máquina de estados; un cambio en HU-10 puede romper una transición de HU-09 sin que nadie lo note.

**H8. Verificación en dispositivo y accesibilidad básica (historias con pantallas).**
Un integrante distinto del autor recorre los criterios de aceptación en un celular real o emulado a 360 px en Chrome para Android y en Safari para iOS; si la pantalla es del médico, también en un navegador de escritorio a 1280 px. Comprueba que no hay desplazamiento horizontal, que el flujo se completa solo con teclado con foco visible y que ningún estado se indica solo con color.
*Verifica:* revisor u otro integrante. *Cómo:* capturas de pantalla en el PR, una por navegador.
*Por qué:* RNF-03 y RNF-14 aplican a todas las pantallas, y la cliente de referencia usa solo el celular. Safari en iOS se comporta distinto con HEIC y con la cámara (RF-11-AC-1), así que no basta con el emulador de Chrome.

### Documentación

**H9. `openapi.yaml` actualizado en el mismo PR.**
Cada operación nueva o modificada está descrita con sus esquemas de entrada y salida, los códigos de error que puede devolver, la cabecera `Idempotency-Key` cuando aplica, y la extensión `x-acceptance-criteria` con los identificadores que cubre. El archivo valida sin errores.
*Verifica:* revisor. *Cómo:* `npx @redocly/cli lint openapi.yaml` sin errores, y los identificadores de `x-acceptance-criteria` coinciden con los de H5.
*Por qué:* el cliente y la API se desarrollan en paralelo; si el contrato se documenta después, el cliente se construye contra suposiciones.

**H10. Configuración y datos de arranque documentados.**
Si la historia agrega una variable de entorno, un parámetro, una colección de MongoDB o un cambio en los catálogos (etiquetas, preguntas, avisos), se actualizan `.env.example`, el README y el script de carga de catálogos, y el script se puede correr dos veces sin duplicar datos.
*Verifica:* revisor. *Cómo:* clona la rama en limpio, sigue el README y levanta el proyecto.
*Por qué:* con poco tiempo por semana, perder una tarde porque «en mi máquina sí funciona» es caro. RNF-11 además exige que agregar etiquetas sea solo cargar el catálogo.

### Seguridad y privacidad

**H11. Nada sensible fuera de su lugar.**
Ni los registros (logs), ni los correos, ni las URL, ni los mensajes de error contienen contraseñas, tokens, texto de mensajes, respuestas de contexto, nombres de pacientes ni correos en texto claro. Los eventos de seguridad que toque la historia se registran con los campos de RNF-13.
*Verifica:* revisor. *Cómo:* revisa cada `logger`, plantilla de correo y ruta del diff; si la historia envía correos, una prueba automatizada comprueba asunto y cuerpo (como RF-19-AC-1).
*Por qué:* RNF-13 y RF-19 lo exigen, y es el tipo de fuga que no detecta ninguna prueba funcional si nadie la busca.

**H12. Sin secretos ni dependencias vulnerables.**
No hay claves, contraseñas ni cadenas de conexión en el repositorio (`.env` en `.gitignore`). Las dependencias nuevas no introducen vulnerabilidades altas o críticas.
*Verifica:* autor y revisor. *Cómo:* `npx gitleaks detect` y `npm audit --audit-level=high` sin hallazgos, o con la excepción justificada en el PR.
*Por qué:* el repositorio puede compartirse con profesores y evaluadores, y una clave del proveedor del modelo de lenguaje expuesta compromete datos de salud (RD-06).

**H13. Controles de dominio cuando la historia los toca.**
Según lo que modifique la historia, se cumple y se prueba el control correspondiente:

| Si la historia toca… | Debe cumplir | Evidencia |
|---|---|---|
| Fotos | Sin EXIF al guardar y al entregar, sin URL públicas, visor sin descarga para zona del pañal o genital (RNF-06) | Prueba que lee los metadatos de la foto guardada |
| Contraseñas, enlaces o sesiones | Argon2id o bcrypt, enlaces guardados de forma no reversible, expiración y revocación de sesiones (RNF-05) | Prueba de revocación y revisión del esquema |
| Módulo de resumen | Petición sin nombre, fecha de nacimiento ni correo; sin fotos sensibles; sin eventos que el médico no puede ver (RNF-12, RF-17-AC-3) | Prueba con módulo simulado que inspecciona la petición |
| Borrado | Borrado físico en base de datos y almacenamiento de archivos (RNF-07) | Prueba que consulta ambos después de borrar |
| Apertura de conversación o foto por el médico | Registro de quién, qué y cuándo (RNF-08) | Prueba del registro de accesos |

*Verifica:* revisor. *Cómo:* el autor marca en el PR qué filas aplican y enlaza la prueba de cada una.
*Por qué:* son los requerimientos que hacen que DAFI cumpla la LFPDPPP (RD-02). Ponerlos en la DoD evita que se traten como una historia de «seguridad» para el final.

**H14. Textos del sistema sin juicio clínico.**
Todo texto que muestra el sistema coincide literalmente con el SRS o con el catálogo. Ningún texto nuevo interpreta, califica ni sugiere algo sobre la salud del paciente. Los textos que requieren revisión médica (preguntas de contexto, avisos de RF-13 y RF-20) se marcan como «pendiente RD-05» en el catálogo hasta que esa revisión quede registrada.
*Verifica:* PO. *Cómo:* compara los textos en pantalla contra el SRS durante la aceptación (H16).
*Por qué:* RD-01 es la restricción que distingue a DAFI de una app de triaje; un texto improvisado del tipo «la fiebre parece alta» la rompe.

### Integración y despliegue

**H15. Integrada en `main`.**
El PR se fusiona a `main` sin conflictos, la suite completa pasa después de la fusión y la rama se borra.
*Verifica:* autor. *Cómo:* `npm test` sobre `main` actualizado (o check de Actions en `main`).
*Por qué:* una historia que vive en una rama no es parte del Incremento.

**H16. Desplegada y aceptada en el ambiente de pruebas.**
La versión de `main` que contiene la historia está desplegada en el ambiente de pruebas del curso, con datos sintéticos, y el PO recorrió ahí los criterios de aceptación. Solo entonces la historia pasa a «Terminada» en el tablero.
*Verifica:* PO. *Cómo:* comentario en el issue con la fecha, el commit desplegado y el resultado por criterio.
*Por qué:* las fotos, los correos y los procesos programados se comportan distinto en un servidor que en la máquina local; si no se prueba desplegado, el problema aparece en la Review.

---

## 3. DoD de incremento (cada sprint, antes de la Review)

**I1. Solo se presenta lo terminado.**
Todas las historias que se muestran en la Review cumplen H1 a H16. Las que no, regresan al Product Backlog con nota de lo que falta y no se muestran como terminadas.
*Verifica:* SM. *Cómo:* revisa el tablero contra los PR fusionados.
*Por qué:* es la regla de la Guía Scrum 2020, y evita que se acumule trabajo «casi terminado» de un sprint a otro.

**I2. Prueba de regresión del flujo construido.**
En el ambiente de pruebas se recorre el flujo de extremo a extremo construido hasta ese sprint (por ejemplo, desde el sprint 3: registro, perfil, invitar médico, abrir, enviar, bandeja, indicaciones), siguiendo un guion escrito que se amplía cada sprint.
*Verifica:* un integrante que no desarrolló historias de ese flujo en el sprint (se rota). *Cómo:* guion con resultado por paso, guardado en el repositorio.
*Por qué:* las pruebas automatizadas cubren cada historia por separado; el guion detecta lo que se rompe entre historias, como la máquina de estados.

**I3. Matriz de trazabilidad al día.**
Existe una tabla generada (por script) que relaciona cada `RF-XX-AC-Y` de las historias terminadas con su prueba y su operación de `openapi.yaml`. No hay identificadores sin prueba ni pruebas con identificadores que no existen en el SRS.
*Verifica:* SM. *Cómo:* corre el script y revisa que no haya huecos.
*Por qué:* es la evidencia que pedirá S09 y conviene construirla sprint a sprint, no al final.

**I4. Contrato y versión etiquetados.**
`openapi.yaml` valida y corresponde a la API desplegada; el commit desplegado lleva la etiqueta `sprint-N`.
*Verifica:* SM. *Cómo:* compara una muestra de endpoints desplegados con el archivo.
*Por qué:* permite volver a un incremento estable si algo falla en el siguiente.

**I5. Revisión de privacidad del ambiente de pruebas.**
Se revisa una muestra de los registros del ambiente de pruebas buscando correos, textos de mensajes o tokens, y se confirma que la base de datos solo contiene datos sintéticos. `npm audit` sobre todo el proyecto no muestra vulnerabilidades altas o críticas sin justificar.
*Verifica:* SM o el integrante que rote ese rol. *Cómo:* `grep` sobre los registros exportados (por ejemplo, el patrón `@` para correos) y `npm audit --audit-level=high`.
*Por qué:* H11 revisa cada cambio; esta revisión detecta lo que se filtró por la combinación de varios.

**I6. Deuda técnica visible.**
Cualquier atajo tomado en el sprint (prueba pendiente, excepción de `npm audit`, texto pendiente de RD-05) está registrado como elemento del Product Backlog con la etiqueta `deuda-tecnica`.
*Verifica:* SM. *Cómo:* revisa los PR del sprint contra los issues abiertos.
*Por qué:* el PO necesita verla para decidir cuándo pagarla; si queda en comentarios del código, nadie la prioriza.

---

## 4. Automatización gradual

Con 8 o 9 h por semana no conviene construir un CI/CD completo antes de entregar valor, pero sí automatizar lo que más se repite. Se propone agregar al Sprint 1 una tarea de unas 3 h:

- Flujo de GitHub Actions en cada PR: `npm run lint`, `npm test` (cliente y API, con MongoDB en contenedor) y `npx @redocly/cli lint openapi.yaml`.
- Protección de `main`: PR obligatorio, una aprobación y checks en verde.
- Plantilla de PR con la lista de H1 a H16 para marcar.

Con eso, H2, H5 (en parte), H7, H9, H12 y H15 pasan de evidencia manual a check automático. El despliegue automático a pruebas al fusionar en `main` puede esperar a S04, cuando se elija la infraestructura.

---

## 5. Criterios de liberación (fuera de la DoD)

Estos requisitos no se pueden cumplir sprint a sprint, pero deben estar listos antes de que una familia real use DAFI:

- HU-17 (eliminación de datos) terminada, como ya acordó el backlog.
- Revisión médica de RD-05 registrada con nombre y fecha.
- Evaluación de RNF-09 con al menos 20 historiales sintéticos, con el informe por grupo.
- Prueba de usabilidad de RNF-04 con al menos 5 personas.
- Medición de disponibilidad (RNF-10) y rendimiento (RNF-01) en el ambiente de producción.
- Aviso de privacidad vigente que declare al proveedor del modelo de lenguaje (RD-06).

RNF-10 se mide por mes y RNF-04 requiere usuarios externos; por eso no se pueden exigir a cada historia.

---

## 6. Lista para la plantilla de PR

```markdown
## Definition of Done (historia)
- [ ] H1 PR enlazado al issue, 1 aprobación de otro integrante
- [ ] H2 `npm run lint` sin errores (cliente y API)
- [ ] H3 Parámetros de 3.4 desde configuración; reloj inyectable
- [ ] H4 Middleware de autorización; errores del contrato con correlación
- [ ] H5 Cada RF-XX-AC-Y de la historia tiene prueba con ese nombre
- [ ] H6 Pruebas AUTZ: rol sin permiso y recurso ajeno
- [ ] H7 Suite completa en verde tras merge de main; sin .skip; datos sintéticos
- [ ] H8 Capturas en 360 px (Chrome Android, Safari iOS) [y escritorio si es del médico]; teclado y color
- [ ] H9 openapi.yaml actualizado, con x-acceptance-criteria, y valida
- [ ] H10 .env.example, README y catálogos actualizados si aplica
- [ ] H11 Sin datos sensibles en logs, correos, URL ni errores
- [ ] H12 gitleaks y npm audit sin hallazgos altos
- [ ] H13 Controles de dominio aplicables: (fotos / sesiones / resumen / borrado / accesos)
- [ ] H14 Textos idénticos al SRS o catálogo; ninguno interpreta salud
- [ ] H15 Fusionado en main con suite en verde
- [ ] H16 Desplegado en pruebas y aceptado por el PO (comentario en el issue)
```
