# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Cuidador principal** (usuario primario). Adulto que crea la familia: madre, padre, o hijo que cuida a un padre mayor. Abre la app **desde el teléfono, con prisa y a menudo con una sola mano**, en el momento en que algo le preocupa: el hijo amaneció con fiebre, apareció una marca en la piel. Su trabajo es contarle a un médico que ya conoce lo que está pasando, sin tener que repetir el historial cada vez.

**Cocuidador.** Otro adulto de la misma familia, invitado por el cuidador principal. Ve y abre conversaciones de los perfiles compartidos; no administra la familia. Sólo ve perfiles de menores y los que el cuidador principal marque como compartidos.

**Médico del círculo.** Contacto que la familia ya conoce e invita por correo: el pediatra de siempre, un amigo, un conocido. Responde conversaciones dirigidas a él, pide información y registra indicaciones. **Es el rol con trabajo de escritorio real**: revisa en lote y se beneficia de pantalla grande.

**Administrador.** Integrante del equipo durante el curso. Atiende reportes de abuso y desactiva cuentas. No ve conversaciones ni fotos.

El diseño es **móvil primero** para la familia (390 px) y contempla **escritorio real para el médico** (bandeja y conversación a dos columnas, 1440 px).

## Product Purpose

DAFI es el espacio donde una familia conversa sobre la salud de sus seres queridos con los médicos que ya conoce, fuera de WhatsApp.

El problema: hoy esas conversaciones viven mezcladas con todo lo demás en un chat personal. Las fotos se pierden entre memes, y el médico tiene que volver a preguntar lo mismo cada vez —desde cuándo, qué comió, si ya le pasó, si es alérgico— porque no tiene a la mano lo que se habló semanas antes. Si la familia consulta a dos médicos, el contexto queda partido en dos chats.

Éxito significa que el médico abre una conversación y **ya tiene delante lo que necesita** para dar una buena valoración, sin interrogar otra vez a la familia.

## Positioning

**Intermediario, no experto.** Es el principio rector y lo que un producto vecino no podría copiar sin dejar de ser otra cosa.

DAFI **sí**: ordena las conversaciones por paciente y por tema; hace preguntas de contexto fijas según la etiqueta, para que el médico no tenga que pedirlas; le muestra al médico un resumen de hechos del historial, **cada uno enlazado al mensaje de donde salió**; avisa a cada parte cuando la otra respondió.

DAFI **no**: diagnostica, sugiere categorías ni interpreta síntomas; da orientación de primeros auxilios ni evalúa la urgencia; recomienda tratamientos ni funciona como expediente clínico; **verifica credenciales** —los médicos son contactos que la familia ya conoce y agrega por su cuenta.

La única indicación de salud que muestra DAFI es un **aviso fijo de emergencias**, igual para todas las conversaciones, que no depende de lo que responda la familia.

Esto está validado, no supuesto: en la entrevista de S02-A1 la madre entrevistada dijo que **no** usaría una app que juzgue la gravedad por su cuenta, pero sí una que le ordene la conversación con su doctora.

## Operating Context

- **El momento de uso es de preocupación y prisa**, en el teléfono, a veces de noche. No es una sesión de trabajo tranquila.
- **Conversación** es la unidad central: un hilo sobre un problema de salud de un perfil, dirigido a un médico del círculo. Reemplaza al «caso» del SRS 2.1.
- Cada conversación lleva de **una a tres etiquetas** del catálogo (Piel, Fiebre, Estómago, Respiratorio, Otro), que determinan qué preguntas de contexto se le hacen a la familia.
- Las **preguntas de contexto** son un catálogo fijo que se carga al desplegar (G1–G4 generales, más las específicas de cada etiqueta). **No las genera un modelo de lenguaje.**
- Las fotos se convierten, reducen y se les quita el EXIF **en el dispositivo** antes de subirlas.
- El **módulo de resumen** recibe los eventos sin datos que identifiquen al paciente (RNF-12), y la API verifica cada cita contra el texto original antes de mostrarla.
- Las fechas se registran en UTC y se muestran en `America/Mexico_City`.

## Capabilities and Constraints

**Confirmado y funcionando** (backend de S05-S06-A2): registro con las tres declaraciones obligatorias, inicio de sesión con JWT HS256, perfiles de paciente, conversaciones con preguntas de contexto, envío de borrador, bitácora de eventos y mensajes. Autorización por rol verificada antes de buscar el recurso: rol sin permiso responde **403**; recurso de otra familia o que el médico no puede ver responde **404**, nunca 403, para no revelar que existe.

**Terminología que no se cambia:** cuidador y cocuidador (no tutor/cotutor, porque el producto ya no se limita a padres de menores); conversación (no caso); círculo médico; perfil; resumen de contexto.

**Estados de una conversación:** `BORRADOR`, `ENVIADA`, `EN_REVISION`, `INFO_SOLICITADA`, `CON_INDICACIONES`, `CERRADA`, `SIN_MEDICO`.

**Restricciones técnicas vigentes:** Next.js en el cliente y Node.js con Express en la API (SRS 2.4). La base pasó de MongoDB a **PostgreSQL** por ADR-002. Aplicación web únicamente.

**Límites del entregable académico, no del producto:**
- Uso local con datos ficticios; no debe exponerse públicamente ni usarse con información médica real.
- El backend cubre una parte del OpenAPI: faltan fotos, la máquina de estados completa, notificaciones, el resumen con IA y los procesos programados.
- El frontend tiene 12 pantallas con datos de demostración; sólo `/entrar` habla hoy con la API.
- CORS abierto y sin TLS en local; sin límite de intentos de inicio de sesión; `DELETE /sesiones/actual` especificado pero no implementado.
- El JWT se guarda en `sessionStorage` en vez de una cookie `httpOnly`, porque la API lo entrega en el cuerpo y no emite cookies.

**Explícitamente sin decidir:** el proveedor del modelo de lenguaje para el resumen; el servicio de PostgreSQL en la nube para el ambiente del curso.

## Brand Commitments

- **Nombre: DAFI.** Vinculante.
- **Idioma: español de México**, en toda la interfaz y en el código (rutas, identificadores y documentación del equipo están en español).
- **Texto literal del aviso de emergencias**, del catálogo aprobado (RD-05), que no se reescribe: «DAFI no atiende emergencias. Si la persona tiene dificultad para respirar, pierde el conocimiento o la situación le preocupa, llame al 911 o acuda a urgencias.» Va acompañado de un botón «Llamar al 911».
- **Voz:** sobria y sin alarmismo. DAFI nunca califica la gravedad ni tranquiliza sobre un síntoma; la valoración es siempre del médico.
- **Símbolo provisional.** El logotipo actual (un pulso dentro de un cuadrado turquesa) se creó al montar el sistema en Figma y **no es vinculante**: el trabajo visual futuro puede sustituirlo. La paleta de marca turquesa tampoco está fijada por el cliente.

## Evidence on Hand

- **Entrevista real de S02-A1** con una madre, origen del principio «intermediario, no experto». Es la única investigación de usuario que existe.
- **SRS de equipo v3.0** (`S03_A1/SRS_equipo.md`): requisitos funcionales con criterios Given-When-Then, catálogo de etiquetas y preguntas, contrato de errores y matriz de roles.
- **Contrato de API** (`S05_S06_A1/openapi_equipo.yaml`, 50 rutas) y **esquema de base de datos** (`esquema_bd.sql`, ~30 tablas con triggers y vistas).
- **Backend funcionando** en `backend/` con autenticación y autorización verificadas.
- **Sistema de diseño en Figma** del equipo: 55 variables, 22 componentes, 18 pantallas (12 móviles, 6 de escritorio), replicado en `frontend/`.
- **Auditoría de contraste reproducible** (`S07_S08_A1/evidencia/contraste.mjs`).

**No existe y no debe inventarse:** ningún usuario real, testimonio, caso de éxito, métrica de uso, cliente, precio, acuerdo con instituciones de salud ni despliegue público. Tampoco hay logotipo encargado ni identidad de marca aprobada.

## Product Principles

1. **El médico decide; DAFI ordena.** Ninguna pantalla puede sugerir gravedad, urgencia ni interpretación clínica. Ante la duda, mostrar el hecho y callar.
2. **Preguntar una vez.** Todo lo que la familia ya contó debe llegarle al médico sin que lo vuelva a pedir. Repetir una pregunta es un defecto del producto.
3. **Cada hecho, con su origen.** Lo que DAFI le muestre al médico como contexto debe poder rastrearse hasta el mensaje exacto de donde salió.
4. **La familia controla quién ve qué.** Perfiles compartidos, permisos de historial y pertenencia al círculo son decisiones de la familia, y la interfaz debe hacerlas visibles y reversibles.
5. **Diseñar para el peor momento.** Teléfono, una mano, poca luz, preocupación. Objetivos táctiles grandes, texto legible y la acción principal siempre a la vista.

## Accessibility & Inclusion

**WCAG 2.1 nivel AA** es el estándar adoptado y ya auditado: 24 pares de color verificados contra 1.4.3 y 1.4.11, foco visible, errores de formulario asociados por `aria-describedby`, controles con nombre accesible y respeto a `prefers-reduced-motion`.

Dos compromisos propios del producto:

- **La población usuaria incluye adultos mayores** (perfiles de adulto representado, cuidadores que atienden a un padre). El tamaño de texto y los objetivos táctiles se dimensionan para eso: mínimo 44 px de alto en controles, por encima de los 24 px que pide WCAG 2.2.
- **Se usa en condiciones malas**: de noche, con prisa, con el brillo bajo. Por eso los bordes de los controles cumplen 3:1 y el texto secundario 4.5:1, aunque la paleta original de Figma no lo hacía.

El aviso de emergencias nunca puede quedar oculto tras una interacción ni depender de color para entenderse.
