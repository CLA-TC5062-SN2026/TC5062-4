# Especificación de Requerimientos de Software (SRS)

## Proyecto: DAFI (Dermatological Analysis From Images)

**Versión:** 1.2  
**Estado:** SRS validado técnicamente  
**Responsable:** Daniel Ruán Aguilar  
**Estructura:** IEEE 830 simplificada

# 1. Introducción

## 1.1 Propósito del documento

Establecer una base verificable para diseñar, construir, probar y aceptar DAFI. Los identificadores de aceptación deberán reutilizarse en `openapi.yaml` y en las pruebas automatizadas.

## 1.2 Alcance del sistema

DAFI será una aplicación web que permitirá a usuarios autenticados cargar imágenes visibles de la piel y recibir una clasificación inicial mediante un modelo de IA aprobado. Incluye validación, resultados orientativos o no concluyentes, historial, eliminación, consentimiento y trazabilidad. No sustituye una valoración médica ni prescribe tratamientos.

El MVP excluye aplicación móvil nativa, chat médico, integración hospitalaria, recomendaciones de tratamiento, edición manual de resultados y reentrenamiento automático.

## 1.3 Definiciones y acrónimos

- **DAFI:** Dermatological Analysis From Images.
- **SRS:** Especificación de Requerimientos de Software.
- **MVP:** Producto mínimo viable.
- **RF / RNF / RD:** Requerimiento funcional / no funcional / de dominio.
- **Inferencia:** ejecución del modelo sobre una imagen.
- **Resultado no concluyente:** resultado que no alcanza los criterios configurados para mostrar una clasificación orientativa.
- **Modelo aprobado:** versión que superó las métricas acordadas sobre el conjunto de validación.
- **Sesión válida:** sesión autenticada, no expirada y no revocada.
- **Carga normal:** 25 usuarios concurrentes, cada uno con una solicitud activa y una imagen de hasta 10 MB.

# 2. Descripción general

## 2.1 Perspectiva del producto

DAFI empleará Next.js en frontend, Node.js con Express en backend, MongoDB para persistencia y un componente de inferencia con un modelo previamente entrenado.

## 2.2 Funciones del producto

Registro, autenticación, consentimientos, carga y validación, inferencia, presentación de resultados, historial, eliminación, métricas administrativas y control de versiones del modelo.

## 2.3 Características del usuario

El usuario general puede carecer de conocimientos médicos o técnicos y acceder desde teléfono o computadora. El administrador consulta métricas y gestiona versiones aprobadas, pero no modifica resultados ni navega libremente por imágenes.

## 2.4 Restricciones

DAFI es orientativo, no diagnostica ni prescribe. Solo muestra categorías validadas. El contenido clínico requiere aprobación especializada. El uso de imágenes para entrenamiento exige consentimiento separado. La solución debe usar la arquitectura tecnológica definida.

# 3. Requerimientos específicos

## 3.1 Requerimientos funcionales
### RF-01. Registro de cuenta

**Descripción:** El sistema deberá permitir crear una cuenta con correo y contraseña.

**Criterios de aceptación:**
- **RF-01-AC-1:** **Dado que** no existe una cuenta con el correo y el correo tiene formato válido y la contraseña cumple la política vigente, **cuando** la persona envía el registro, **entonces** el sistema crea la cuenta y confirma la operación.
- **RF-01-AC-2:** **Dado que** ya existe una cuenta con el correo, **cuando** la persona intenta registrarlo de nuevo, **entonces** el sistema rechaza el registro sin revelar datos de la cuenta existente.
- **RF-01-AC-3:** **Dado que** faltan datos obligatorios o incumplen las reglas configuradas, **cuando** la persona envía el formulario, **entonces** el sistema no crea la cuenta e identifica los campos por corregir.

### RF-02. Inicio de sesión

**Descripción:** El sistema deberá autenticar usuarios y crear una sesión cuando las credenciales sean válidas.

**Criterios de aceptación:**
- **RF-02-AC-1:** **Dado que** existe una cuenta activa y las credenciales son válidas, **cuando** el usuario solicita iniciar sesión, **entonces** el sistema crea una sesión y habilita las funciones protegidas.
- **RF-02-AC-2:** **Dado que** las credenciales son inválidas, **cuando** el usuario solicita iniciar sesión, **entonces** el sistema deniega el acceso sin indicar cuál credencial falló.
- **RF-02-AC-3:** **Dado que** no existe una sesión válida, **cuando** se intenta acceder a carga, historial o eliminación, **entonces** el sistema bloquea el acceso y solicita iniciar sesión.

### RF-03. Aviso y aceptación previa

**Descripción:** El sistema deberá mostrar y registrar la aceptación del aviso de privacidad y la limitación de uso antes del análisis.

**Criterios de aceptación:**
- **RF-03-AC-1:** **Dado que** el usuario no aceptó la versión vigente, **cuando** el usuario intenta iniciar un análisis, **entonces** el sistema bloquea la carga y muestra los documentos pendientes.
- **RF-03-AC-2:** **Dado que** se muestra la versión vigente, **cuando** el usuario la acepta, **entonces** el sistema registra usuario, versión, fecha y hora.
- **RF-03-AC-3:** **Dado que** existe una versión nueva que requiere aceptación, **cuando** el usuario intenta analizar otra imagen, **entonces** el sistema solicita aceptar la versión vigente.

### RF-04. Carga de imagen

**Descripción:** El sistema deberá permitir que un usuario autenticado cargue una imagen para análisis.

**Criterios de aceptación:**
- **RF-04-AC-1:** **Dado que** el usuario tiene sesión y consentimientos vigentes, **cuando** selecciona un archivo permitido, **entonces** el sistema muestra la selección y habilita su envío.
- **RF-04-AC-2:** **Dado que** existe una imagen seleccionada sin enviar, **cuando** el usuario la sustituye, **entonces** el sistema reemplaza la selección sin crear dos solicitudes.
- **RF-04-AC-3:** **Dado que** la transferencia no se completa, **cuando** el sistema detecta la falla, **entonces** el sistema informa el error y no crea un análisis concluido.

### RF-05. Validación de imagen

**Descripción:** El sistema deberá validar formato, tamaño y calidad básica antes de la inferencia.

**Criterios de aceptación:**
- **RF-05-AC-1:** **Dado que** la imagen fue cargada, **cuando** el sistema ejecuta las validaciones configuradas, **entonces** la marca como válida solo si cumple todos los criterios.
- **RF-05-AC-2:** **Dado que** la imagen incumple al menos un criterio, **cuando** termina la validación, **entonces** el sistema la marca como inválida y no la envía al modelo.
- **RF-05-AC-3:** **Dado que** la validación termina, **cuando** se guarda el resultado, **entonces** el resultado queda asociado al identificador de la solicitud.

### RF-06. Manejo de imagen inválida

**Descripción:** El sistema deberá explicar el rechazo y permitir cargar otra imagen.

**Criterios de aceptación:**
- **RF-06-AC-1:** **Dado que** la imagen fue marcada como inválida, **cuando** se presenta el resultado de validación, **entonces** el sistema muestra una causa específica: formato no admitido, archivo mayor a 10 MB, resolución insuficiente o calidad insuficiente.
- **RF-06-AC-2:** **Dado que** la imagen fue rechazada, **cuando** el usuario elige intentar de nuevo, **entonces** el sistema permite otra carga en la sesión vigente.
- **RF-06-AC-3:** **Dado que** la imagen es inválida, **cuando** el flujo intenta continuar, **entonces** el sistema no invoca el modelo y conserva la solicitud con estado `rechazada`.

### RF-07. Ejecución de inferencia

**Descripción:** El sistema deberá procesar imágenes válidas con la versión activa y aprobada del modelo.

**Criterios de aceptación:**
- **RF-07-AC-1:** **Dado que** la imagen es válida y existe modelo activo aprobado, **cuando** se solicita inferencia, **entonces** el sistema obtiene clasificación y confianza vinculadas al análisis.
- **RF-07-AC-2:** **Dado que** no existe modelo activo aprobado, **cuando** se intenta inferir, **entonces** el sistema cancela, registra la falla y no genera clasificación.
- **RF-07-AC-3:** **Dado que** el modelo falla o no responde, **cuando** el sistema procesa la falla, **entonces** marca el análisis como fallido y no fabrica un resultado.

### RF-08. Manejo de baja confianza

**Descripción:** El sistema deberá presentar como no concluyente un resultado inferior al umbral configurado.

**Criterios de aceptación:**
- **RF-08-AC-1:** **Dado que** la confianza es inferior al umbral, **cuando** el sistema evalúa la respuesta, **entonces** almacena y presenta el análisis como no concluyente.
- **RF-08-AC-2:** **Dado que** el análisis es no concluyente, **cuando** el usuario consulta el resultado, **entonces** el sistema etiqueta el resultado como `no concluyente`, omite afirmaciones diagnósticas y muestra el texto aprobado.
- **RF-08-AC-3:** **Dado que** el análisis es no concluyente, **cuando** se muestra el resultado, **entonces** el sistema presenta la recomendación profesional aprobada.

### RF-09. Presentación del resultado

**Descripción:** El sistema deberá mostrar clasificación, confianza, explicación, limitación de uso y orientación aprobada.

**Criterios de aceptación:**
- **RF-09-AC-1:** **Dado que** el análisis concluyó con una clase permitida, **cuando** el usuario abre el resultado, **entonces** el sistema muestra clase, confianza, fecha y versión del modelo.
- **RF-09-AC-2:** **Dado que** se visualiza cualquier resultado, **cuando** el sistema muestra la pantalla, **entonces** muestra junto al resultado, sin interacción adicional, la advertencia “Este resultado es orientativo y no constituye un diagnóstico médico”.
- **RF-09-AC-3:** **Dado que** se presenta la orientación, **cuando** el usuario revisa el contenido, **entonces** no contiene medicamentos, tratamientos ni afirmaciones clínicas definitivas.

### RF-10. Registro del análisis

**Descripción:** El sistema deberá almacenar identificador, propietario, fecha, estado, resultado, confianza y versión del modelo.

**Criterios de aceptación:**
- **RF-10-AC-1:** **Dado que** se acepta una solicitud, **cuando** se crea su registro, **entonces** el sistema asigna ID único y guarda propietario, fecha, estado y versión.
- **RF-10-AC-2:** **Dado que** el modelo responde, **cuando** se registra el resultado, **entonces** se almacenan clase y confianza vinculadas a la versión.
- **RF-10-AC-3:** **Dado que** el análisis falla o es no concluyente, **cuando** se actualiza el registro, **entonces** el estado refleja la condición real y no aparece como exitoso.

### RF-11. Consulta de historial

**Descripción:** El sistema deberá permitir consultar exclusivamente el historial propio.

**Criterios de aceptación:**
- **RF-11-AC-1:** **Dado que** el usuario tiene sesión y análisis, **cuando** abre el historial, **entonces** el sistema muestra solo sus análisis con fecha, estado y resumen.
- **RF-11-AC-2:** **Dado que** existe un análisis propio, **cuando** el usuario lo selecciona, **entonces** el sistema verifica propiedad y muestra el detalle.
- **RF-11-AC-3:** **Dado que** no existen análisis propios, **cuando** el usuario abre el historial, **entonces** el sistema muestra un estado vacío y no un error técnico.

### RF-12. Eliminación de análisis e imagen

**Descripción:** El sistema deberá permitir eliminar un análisis propio y su imagen.

**Criterios de aceptación:**
- **RF-12-AC-1:** **Dado que** el usuario selecciona un análisis propio, **cuando** solicita eliminarlo, **entonces** el sistema identifica el análisis y exige una acción afirmativa antes de eliminarlo.
- **RF-12-AC-2:** **Dado que** el usuario confirma, **cuando** el sistema procesa la solicitud, **entonces** el análisis y la imagen dejan de estar disponibles conforme a la política vigente.
- **RF-12-AC-3:** **Dado que** el análisis pertenece a otra cuenta, **cuando** se intenta eliminar, **entonces** el sistema deniega la operación y no modifica datos.

### RF-13. Eliminación de cuenta

**Descripción:** El sistema deberá permitir eliminar la cuenta y tratar sus datos conforme a la política vigente.

**Criterios de aceptación:**
- **RF-13-AC-1:** **Dado que** el usuario tiene sesión válida, **cuando** solicita eliminar la cuenta, **entonces** el sistema exige confirmación explícita.
- **RF-13-AC-2:** **Dado que** el usuario confirma, **cuando** se completa la operación, **entonces** el sistema cierra la sesión y deshabilita la autenticación.
- **RF-13-AC-3:** **Dado que** algún dato queda sujeto a retención autorizada, **cuando** se confirma la eliminación, **entonces** el sistema informa qué se eliminó y qué se retiene y por cuánto tiempo.

### RF-14. Consentimiento para mejora del modelo

**Descripción:** El sistema deberá registrar autorización separada, explícita y opcional para usar imágenes en mejora del modelo.

**Criterios de aceptación:**
- **RF-14-AC-1:** **Dado que** el usuario no otorgó esa autorización, **cuando** utiliza el análisis ordinario, **entonces** el sistema permite completar el análisis.
- **RF-14-AC-2:** **Dado que** se muestra el consentimiento separado, **cuando** el usuario acepta o rechaza, **entonces** el sistema registra decisión, versión, fecha y hora.
- **RF-14-AC-3:** **Dado que** una imagen no tiene autorización afirmativa vigente, **cuando** se intenta seleccionar para entrenamiento, **entonces** el sistema la excluye del conjunto autorizado.

### RF-15. Consulta de métricas agregadas

**Descripción:** El sistema deberá permitir consultar métricas agregadas a administradores autorizados.

**Criterios de aceptación:**
- **RF-15-AC-1:** **Dado que** un administrador tiene sesión válida, **cuando** consulta un periodo, **entonces** el sistema muestra análisis, errores, rechazos, tiempos y confianza agregados.
- **RF-15-AC-2:** **Dado que** una cuenta no administrativa solicita métricas, **cuando** se evalúa la autorización, **entonces** el sistema deniega el acceso.
- **RF-15-AC-3:** **Dado que** se generan las métricas, **cuando** el administrador las visualiza, **entonces** se indica periodo y versión aplicable sin imágenes ni identificadores directos.

### RF-16. Gestión de versiones del modelo

**Descripción:** El sistema deberá permitir activar una versión aprobada o restaurar una anterior.

**Criterios de aceptación:**
- **RF-16-AC-1:** **Dado que** existe una versión aprobada inactiva, **cuando** el administrador solicita activarla, **entonces** el sistema la deja como única activa y registra el cambio.
- **RF-16-AC-2:** **Dado que** la versión no está aprobada, **cuando** se intenta activar, **entonces** el sistema rechaza la operación y conserva la versión actual.
- **RF-16-AC-3:** **Dado que** hay una versión problemática y otra anterior aprobada, **cuando** el administrador solicita restaurar, **entonces** el sistema activa la anterior, audita el cambio y conserva resultados históricos.

### RF-17. Cierre de sesión
**Descripción:** El sistema deberá invalidar la sesión cuando el usuario la cierre.
- **RF-17-AC-1:** **Dado que** existe una sesión válida, **cuando** el usuario cierra sesión, **entonces** el sistema invalida la sesión y muestra una vista pública.
- **RF-17-AC-2:** **Dado que** la sesión fue cerrada, **cuando** se reutiliza su token, **entonces** el sistema rechaza el acceso protegido.
- **RF-17-AC-3:** **Dado que** no existe sesión válida, **cuando** se solicita cerrar sesión, **entonces** el sistema no crea una sesión ni produce un error interno.

### RF-18. Revocación del consentimiento
**Descripción:** El sistema deberá permitir revocar para usos futuros el consentimiento de mejora del modelo.
- **RF-18-AC-1:** **Dado que** existe consentimiento vigente, **cuando** el usuario lo revoca, **entonces** el sistema registra revocación, fecha y versión.
- **RF-18-AC-2:** **Dado que** fue revocado, **cuando** se seleccionan imágenes para entrenamiento, **entonces** el sistema excluye las imágenes asociadas.
- **RF-18-AC-3:** **Dado que** no existe consentimiento vigente, **cuando** se consulta privacidad, **entonces** el sistema muestra `no autorizado`.

### RF-19. Recuperación de acceso
**Descripción:** El sistema deberá restablecer contraseñas mediante token de un solo uso.
- **RF-19-AC-1:** **Dado que** se proporciona un correo, **cuando** se solicita recuperación, **entonces** el sistema muestra la misma respuesta exista o no una cuenta.
- **RF-19-AC-2:** **Dado que** existe la cuenta, **cuando** se genera la recuperación, **entonces** el sistema emite un token de un solo uso por 30 minutos.
- **RF-19-AC-3:** **Dado que** el token es válido, **cuando** se establece una contraseña conforme a la política, **entonces** el sistema actualiza la contraseña, invalida el token y revoca sesiones activas.

## 3.2 Requerimientos no funcionales
- **RNF-01:** Bajo carga normal, 95 % de solicitudes responderá en menos de 10 segundos. | **Categoría:** rendimiento
- **RNF-02:** El backend verificará autenticación, rol y propiedad para cada recurso protegido. | **Categoría:** seguridad
- **RNF-03:** Las contraseñas se almacenarán con Argon2id o bcrypt y sal individual. | **Categoría:** seguridad
- **RNF-04:** Las comunicaciones usarán TLS 1.2+ y los datos sensibles se cifrarán en reposo. | **Categoría:** seguridad y privacidad
- **RNF-05:** Los logs no contendrán contraseñas, tokens, imágenes completas ni correo en texto claro. | **Categoría:** privacidad
- **RNF-06:** La interfaz funcionará en las dos versiones recientes de Chrome, Edge, Firefox y Safari, entre 360 y 1920 px. | **Categoría:** compatibilidad
- **RNF-07:** Cuatro de cinco usuarios representativos completarán el flujo principal sin asistencia. | **Categoría:** usabilidad
- **RNF-08:** El flujo principal funcionará con teclado, foco visible y sin depender solo del color. | **Categoría:** accesibilidad
- **RNF-09:** La inferencia podrá escalarse sin cambiar el contrato público de la API. | **Categoría:** escalabilidad
- **RNF-10:** Los eventos de seguridad registrarán fecha UTC, actor, acción, recurso, resultado y correlación sin datos sensibles. | **Categoría:** auditoría
- **RNF-11:** Los tokens de recuperación expirarán en 30 minutos, serán de un solo uso y se almacenarán de forma no reversible. | **Categoría:** seguridad
- **RNF-12:** Las sesiones expirarán tras 30 minutos de inactividad y se revocarán al cerrar sesión, eliminar cuenta o restablecer contraseña. | **Categoría:** seguridad
- **RNF-13:** Una falla devolverá error controlado con correlación, sin trazas internas, y conservará estado consistente. | **Categoría:** confiabilidad

## 3.3 Requerimientos de dominio

- **RD-01:** DAFI deberá presentarse únicamente como una herramienta de orientación inicial y no como sustituto del diagnóstico de un profesional de la salud.
- **RD-02:** El sistema no deberá prescribir medicamentos, tratamientos ni acciones clínicas específicas.
- **RD-03:** El modelo solo deberá mostrar clasificaciones correspondientes a afecciones incluidas en un conjunto previamente validado y aprobado para la versión desplegada.
- **RD-04:** Las señales de alerta, recomendaciones de valoración profesional y demás contenido de carácter clínico deberán ser revisados y aprobados por una persona con conocimiento especializado antes de su publicación.
- **RD-05:** Una nueva versión del modelo solo podrá habilitarse después de superar las métricas de aceptación acordadas sobre un conjunto de validación definido.
- **RD-06:** La implementación del proyecto deberá utilizar Next.js para el frontend, Node.js con Express para el backend y MongoDB para el almacenamiento, conforme a la arquitectura académica establecida.
- **RD-07:** Las imágenes no podrán usarse para mejorar el modelo sin autorización separada, explícita y vigente; revocarla impedirá usos futuros.
- **RD-08:** La confianza es una salida técnica, no una probabilidad de diagnóstico.
- **RD-09:** Para procesar imágenes de terceros, el usuario deberá declarar autorización.


# 4. Pendientes de validación
- Afecciones, umbral por modelo y criterios objetivos de calidad.
- Retención, borrado físico y respaldos.
- Métricas clínicas, conjunto de validación y texto clínico.
- Canal de recuperación y artefactos derivados tras revocar consentimiento.

# 5. Convención de trazabilidad
- Se conservaron los 48 IDs previos y se agregaron `RF-17-AC-1` a `RF-19-AC-3`.
- Cada operación OpenAPI declarará sus IDs mediante `x-acceptance-criteria`.
- Cada prueba automatizada incorporará el ID aplicable en su nombre.
