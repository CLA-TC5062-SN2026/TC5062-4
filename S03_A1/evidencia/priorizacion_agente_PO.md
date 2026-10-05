# Priorización del Product Backlog de DAFI

**Rol:** Product Owner
**Insumos:** `vision_producto.md` (borrador v3), `SRS_equipo.md` (v3.0) y el backlog sin priorizar (HU-01 a HU-18).

---

## 1. Ranking

| # | ID | Historia | Prioridad | SP | Justificación de valor |
|---|---|---|---|---|---|
| 1 | HU-01 | Acceso a la cuenta familiar | Alta | 8 | Sin cuenta no hay usuario. Además recoge las tres declaraciones de consentimiento que la LFPDPPP exige antes de tratar un solo dato de salud (RD-02). |
| 2 | HU-02 | Perfiles de los hijos y del cuidador | Alta | 3 | Toda conversación pertenece a un perfil; cubre el caso de referencia (madre con hijos pequeños) y le da al médico alergias y medicamentos sin preguntarlos. Barata (3 SP). |
| 3 | HU-05 | Círculo médico y permisos de historial | Alta | 8 | El médico es la mitad del producto: sin invitarlo no hay a quién escribir. La regla de visibilidad es también el control de privacidad del que dependen bandeja, historial y resumen. |
| 4 | HU-06 | Abrir conversación con preguntas de contexto | Alta | 8 | Es la propuesta de valor central (el médico recibe de entrada lo que siempre pregunta) e incluye el aviso fijo de emergencias, que mitiga el principal riesgo regulatorio (RD-01). |
| 5 | HU-09 | Revisión y envío | Alta | 5 | Convierte el borrador en una conversación que llega al médico. La idempotencia evita duplicados con mala señal, que en celular son frecuentes y minan la confianza. |
| 6 | HU-12 | Bandeja y detalle para el médico | Alta | 5 | Sin bandeja el médico no ve lo que le envían. Es la pantalla que decide si el médico (que atiende por amistad) prefiere DAFI a WhatsApp. |
| 7 | HU-10 | Mensajes y solicitud de información | Alta | 5 | La entrevista confirma que la doctora siempre pide más fotos o datos; si no puede hacerlo dentro de DAFI, la conversación regresa a WhatsApp. |
| 8 | HU-11 | Indicaciones del médico y cierre | Alta | 5 | Cierra el ciclo: la familia obtiene la respuesta que vino a buscar y queda registrada en el historial. Sin esto no hay valor percibido por la familia. |
| 9 | HU-07 | Fotos desde la cámara o la galería | Alta | 8 | Las fotos son el hábito actual en WhatsApp (sobre todo en «Piel»). Aceptar HEIC y fotos reenviadas sin fricción es condición de adopción, y quitar EXIF protege la ubicación de la familia. |
| 10 | HU-16 | Notificaciones y aviso por falta de respuesta | Alta | 5 | Sin aviso nadie entra a la app a revisar; el ciclo de HU-09 a HU-11 se detiene. Los correos sin contenido clínico y el aviso de RF-20 reducen el riesgo de que la familia espere en silencio. |
| 11 | HU-17 | Eliminación de datos | Media | 5 | Derecho de cancelación (LFPDPPP) y requisito de confianza que la madre pidió en la entrevista. No bloquea el flujo de la primera conversación, pero debe estar antes de abrir el producto a familias reales. |
| 12 | HU-13 | Resumen de contexto: datos del perfil | Media | 3 | Primer paso visible del diferenciador con muy poco costo (3 SP, sin modelo de lenguaje). Le muestra al médico alergias y medicamentos arriba de cada conversación. |
| 13 | HU-15 | Historial del paciente | Media | 3 | Permite a la familia seguir la evolución y recordar indicaciones (P2 de la entrevista). Su valor crece con el uso, por eso no compite con el flujo base. |
| 14 | HU-14 | Resumen de contexto: citas verificadas | Media | 8 | Es el diferenciador frente a WhatsApp, pero solo aporta cuando ya hay historial acumulado, tiene la mayor incertidumbre técnica y añade riesgo regulatorio (transferencia a un proveedor externo, RD-06). |
| 15 | HU-03 | Perfil de otro adulto con consentimiento | Media | 5 | Abre el segmento del hijo que cuida a un padre mayor, pero el caso de referencia son menores. Sin el consentimiento del adulto no se puede ofrecer, así que entra completa o no entra. |
| 16 | HU-04 | Cocuidador | Baja | 5 | Útil cuando el cuidador principal no está, pero mientras tanto la familia puede compartir la cuenta o el cuidador reenviar. No cambia la decisión de adoptar DAFI. |
| 17 | HU-18 | Reportes de abuso y desactivación | Baja | 3 | Mitiga el riesgo de médicos sin verificar, pero con médicos que entran solo por invitación de la familia y un volumen inicial pequeño, el administrador puede desactivar cuentas a mano mientras tanto. |
| 18 | HU-08 | Validación de calidad de fotos y guía «Piel» | Baja | 5 | Mejora la calidad de las fotos, pero si una sale mal el médico la pide de nuevo con HU-10. Es optimización de algo que ya funciona, con costo de calibración alto. |

**Corte de MVP:** las historias 1 a 10 (Alta) suman 60 SP.

---

## 2. Por qué el tope y el fondo

### Tope (HU-01, HU-02, HU-05, HU-06, HU-09)

Estas cinco historias forman el camino mínimo para que una familia escriba a su médico en DAFI: entrar con consentimiento válido, registrar a la persona de quien habla, tener a un médico en su círculo, armar la conversación con contexto y enviarla. Si falta cualquiera, el producto no entrega nada.

HU-01 va primero aunque no sea la más visible porque las declaraciones de consentimiento son condición legal para tratar datos de salud; sin ellas ninguna otra historia puede probarse con usuarios reales. HU-05 sube antes que HU-06 porque el riesgo de negocio más grande de la visión es la adopción del médico, y ese riesgo empieza en la invitación. HU-06 lleva dentro el aviso fijo de emergencias, que es la respuesta del producto al principio «intermediario, no experto»; ponerlo temprano permite validar con la cliente que la app no juzga la gravedad (lo que ella dijo que la haría desinstalarla).

Justo debajo quedan HU-12, HU-10 y HU-11, que completan el lado del médico. Las separo del tope solo porque dependen de que exista una conversación enviada.

### Fondo (HU-03, HU-04, HU-18, HU-08)

HU-08 va al final porque su beneficio (menos fotos repetidas) ya lo cubre HU-10: el médico pide otra foto y la familia la manda. Cuesta 5 SP y requiere calibrar umbrales con un banco de imágenes, todo para ahorrar un mensaje.

HU-18 atiende un riesgo real (cualquiera puede presentarse como médico), pero la exposición inicial es baja: el médico solo entra si la familia lo invita y la app siempre dice «Contacto agregado por usted». Mientras el número de familias sea pequeño, el equipo puede atender un reporte por correo y desactivar la cuenta directamente.

HU-04 y HU-03 amplían a quién sirve DAFI (otro adulto que cuida, otro adulto que es paciente), pero no cambian si la madre del caso de referencia lo adopta o no. HU-03 queda por encima de HU-04 porque abre un segmento de mercado nuevo, mientras que el cocuidador tiene un sustituto informal (compartir el celular o reenviar el aviso).

---

## 3. Criterio de valor y supuestos

### Criterio

Entiendo el MVP como **el conjunto mínimo de historias con el que una familia puede completar una consulta real con su médico dentro de DAFI y preferir hacerla ahí antes que en WhatsApp, sin incumplir la LFPDPPP ni el principio de no diagnosticar.** Ese ciclo es: registrarse, registrar un perfil, agregar al médico, abrir y enviar la conversación con fotos, que el médico la vea, pregunte lo que falte, deje indicaciones, y que cada lado se entere a tiempo.

Para ordenar dentro y fuera de ese ciclo usé cuatro preguntas, en este orden:

1. ¿Sin esta historia el ciclo de consulta se rompe? (bloqueo funcional)
2. ¿Afecta la adopción del médico o de la familia frente a WhatsApp? (el riesgo principal de la visión)
3. ¿Reduce un riesgo legal o regulatorio (LFPDPPP, RD-01, RD-06)?
4. ¿Cuánto valor aporta por punto de historia y cuánta incertidumbre técnica trae?

Las dependencias técnicas pesaron cuando una historia de mucho valor no puede demostrarse sin otra (por ejemplo, HU-12 sin HU-09), pero el orden sigue al valor, no al orden de construcción.

### Supuestos

- El primer lanzamiento es con un grupo pequeño de familias conocidas (como la cliente entrevistada) y sus médicos, no una apertura al público. Eso justifica dejar abajo los reportes de abuso y la desactivación automatizada.
- El caso de referencia, madre con hijos menores y una médica de confianza, es el segmento que define la adopción; adultos representados y cocuidadores son ampliaciones.
- El médico abandona DAFI si en sus primeras conversaciones le cuesta más que WhatsApp. Por eso bandeja, mensajes e indicaciones van antes que el resumen con IA.
- El resumen con citas (HU-14) no aporta en las primeras semanas porque todavía no hay historial que resumir; su valor llega cuando la familia acumula conversaciones.
- Las notificaciones por correo funcionan como canal suficiente para que el ciclo no se detenga; no se requieren notificaciones push.
- La eliminación de datos (HU-17) puede atenderse a mano durante un piloto cerrado, pero debe estar lista antes de abrir el registro, porque es un derecho que la ley exige garantizar.
- Los story points del backlog son correctos y se usaron solo como desempate y para estimar el tamaño del MVP, no como criterio principal.
