# Especificación de Requisitos de Software (SRS) - DAFI

## 1. Introducción

### 1.1 Propósito del documento

Este documento especifica los requerimientos funcionales, no funcionales y de dominio de DAFI (Dermatological Analysis From Images). Su propósito es establecer de manera clara las funcionalidades, restricciones y características que deberá cumplir el sistema durante su desarrollo.

El documento también incluye los criterios de aceptación asociados a cada requerimiento funcional utilizando el formato Given-When-Then. Estos criterios permitirán verificar posteriormente el cumplimiento de los requerimientos y mantener la trazabilidad con el diseño de la API y los casos de prueba.

Algunos valores técnicos todavía no fueron definidos durante la elicitación, por ejemplo, el tamaño máximo permitido para las imágenes, el tiempo máximo de respuesta o el umbral de confianza del modelo. Estos elementos se mantienen identificados como pendientes para evitar establecer valores que todavía no han sido validados.

### 1.2 Alcance del sistema

DAFI será una plataforma web que permitirá a los usuarios seleccionar imágenes de posibles afecciones visibles de la piel y solicitar una clasificación mediante un modelo de inteligencia artificial previamente entrenado e integrado en la infraestructura del sistema.

DAFI proporcionará recomendaciones para obtener una imagen adecuada, permitirá revisar la imagen seleccionada, validará si cumple con las condiciones necesarias para ser procesada y comunicará al usuario el estado del análisis. Cuando sea posible obtener una clasificación válida, el sistema presentará el resultado de manera comprensible junto con sus limitaciones. En caso contrario, podrá rechazar la imagen o presentar el resultado como inconcluso.

Los usuarios registrados podrán utilizar las funcionalidades asociadas a su cuenta, incluyendo consultar su historial, revisar el detalle de análisis anteriores, eliminar análisis y gestionar la información de su cuenta. El sistema también proporcionará mecanismos para consultar información relacionada con privacidad y reportar problemas técnicos.

DAFI funcionará únicamente como una herramienta de orientación inicial. El sistema no proporcionará diagnósticos médicos definitivos, no sustituirá la valoración de un profesional de la salud y no recomendará medicamentos, tratamientos ni automedicación. Las clasificaciones estarán limitadas a las categorías soportadas por el modelo de inteligencia artificial utilizado.

### 1.3 Definiciones y acrónimos

| Término | Definición |
|---|---|
| **DAFI** | Dermatological Analysis From Images, sistema para obtener una clasificación inicial de posibles afecciones dermatológicas mediante imágenes. |
| **IA** | Inteligencia artificial. En este documento se refiere al modelo utilizado para procesar y clasificar las imágenes. |
| **Clasificación** | Estimación generada por el modelo dentro de las categorías que este puede reconocer. No equivale a un diagnóstico médico. |
| **Resultado inconcluso** | Resultado que indica que el sistema no pudo producir una clasificación con las condiciones o nivel de confianza requeridos. |
| **RF** | Requerimiento funcional. |
| **RNF** | Requerimiento no funcional. |
| **RD** | Requerimiento de dominio. |
| **SRS** | Software Requirements Specification o Especificación de Requisitos de Software. |
| **Criterio de aceptación** | Condición verificable utilizada para determinar si un requerimiento funcional fue implementado correctamente. |

---

## 2. Descripción general

### 2.1 Perspectiva del producto

DAFI se plantea como una aplicación web compuesta por una interfaz para los usuarios, un backend encargado de la lógica y comunicación del sistema, una base de datos para almacenar la información necesaria y un modelo de inteligencia artificial encargado de procesar las imágenes.

Las tecnologías establecidas inicialmente para el proyecto son:

- **Frontend:** Next.js.
- **Backend:** Node.js con Express.
- **Persistencia:** MongoDB.
- **Clasificación:** modelo de inteligencia artificial integrado en la infraestructura de DAFI.

El modelo de inteligencia artificial no se considera un actor externo debido a que, de acuerdo con la arquitectura planteada actualmente, formará parte de la infraestructura del sistema y será utilizado internamente durante el procesamiento de las imágenes.

### 2.2 Funciones del producto

DAFI permitirá:

- Consultar información sobre el propósito, funcionamiento y limitaciones de la plataforma.
- Crear una cuenta e iniciar sesión para utilizar las funcionalidades asociadas a un usuario registrado.
- Mostrar recomendaciones para obtener una fotografía adecuada.
- Seleccionar, revisar y reemplazar una imagen antes de solicitar su análisis.
- Mostrar y solicitar la aceptación del aviso de privacidad correspondiente.
- Validar las condiciones necesarias de las imágenes antes de procesarlas.
- Procesar las imágenes aptas mediante el modelo de inteligencia artificial.
- Informar al usuario sobre el estado del análisis y posibles errores.
- Presentar una clasificación estimada o informar que el resultado fue inconcluso.
- Permitir realizar un nuevo intento utilizando otra imagen.
- Almacenar los análisis asociados a las cuentas de los usuarios.
- Consultar el historial y detalle de análisis anteriores.
- Eliminar análisis e imágenes asociadas.
- Gestionar la información de la cuenta.
- Consultar información relacionada con privacidad y conservación de datos.
- Reportar problemas técnicos.
- Proporcionar herramientas administrativas de acuerdo con los permisos definidos.

Durante la elicitación no se determinó de manera definitiva si será obligatorio tener una cuenta para solicitar un análisis. Esta decisión permanece pendiente y deberá definirse antes de implementar completamente ese flujo.

### 2.3 Características del usuario

**Persona usuaria:** persona que utiliza DAFI para obtener información inicial sobre una posible afección visible de la piel. No se asume que tenga conocimientos médicos o técnicos, por lo que las instrucciones y resultados deberán presentarse de manera comprensible.

**Usuario registrado:** persona que cuenta con una cuenta dentro de DAFI. Además de las funcionalidades generales disponibles, podrá acceder a las funciones asociadas a su cuenta, como consultar su historial, eliminar análisis y gestionar sus datos.

**Administrador:** usuario encargado de utilizar las herramientas de administración de la plataforma. Las operaciones y permisos administrativos específicos todavía deberán definirse.

Las personas pertenecientes al ámbito académico o de salud también pueden utilizar DAFI; sin embargo, durante la elicitación no se identificó la necesidad de proporcionarles resultados clínicos o funcionalidades diferentes.

### 2.4 Restricciones

- DAFI será una herramienta de orientación inicial y no sustituirá una valoración profesional.
- Los resultados generados por el modelo no deberán presentarse como diagnósticos médicos.
- DAFI no recomendará medicamentos, tratamientos ni automedicación.
- Las clasificaciones estarán limitadas a las categorías soportadas por el modelo de inteligencia artificial.
- El sistema deberá permitir rechazar una imagen o generar un resultado inconcluso cuando no existan las condiciones necesarias para proporcionar una clasificación válida.
- Las imágenes, resultados y datos asociados deberán considerarse información potencialmente sensible.
- El acceso a la información deberá limitarse de acuerdo con la cuenta y los permisos correspondientes.
- Las tecnologías establecidas para el proyecto son Next.js, Node.js con Express y MongoDB.
- Permanecen pendientes de definición los formatos y tamaños máximos de las imágenes, el periodo de conservación de la información, el tiempo máximo aceptable para completar un análisis, el umbral de confianza del modelo, las métricas mínimas de desempeño y las acciones administrativas específicas.

---

## 3. Requerimientos específicos

### 3.1 Requerimientos funcionales

### RF-01 — Información sobre DAFI

El sistema deberá mostrar información sobre el propósito de DAFI y aclarar que los resultados proporcionados son orientativos y no sustituyen una valoración médica.

#### RF-01-AC-1

**Dado que** una persona ingresa a DAFI,  
**cuando** consulta la información general de la plataforma,  
**entonces** el sistema muestra el propósito de DAFI e indica que funciona como una herramienta de orientación inicial.

#### RF-01-AC-2

**Dado que** una persona consulta la información de DAFI,  
**cuando** revisa las limitaciones del sistema,  
**entonces** se indica que los resultados son orientativos y no sustituyen la valoración de un profesional de la salud.

---

### RF-02 — Gestión de acceso a la cuenta

El sistema deberá permitir a los usuarios crear una cuenta e iniciar sesión para acceder a las funcionalidades asociadas a su perfil.

#### RF-02-AC-1

**Dado que** una persona no posee una cuenta,  
**cuando** proporciona los datos requeridos para registrarse,  
**entonces** el sistema crea una cuenta y permite utilizar las funcionalidades correspondientes a un usuario registrado.

#### RF-02-AC-2

**Dado que** un usuario posee una cuenta registrada,  
**cuando** proporciona credenciales válidas,  
**entonces** el sistema permite iniciar sesión y acceder a las funcionalidades correspondientes a su perfil.

#### RF-02-AC-3

**Dado que** un usuario intenta iniciar sesión,  
**cuando** proporciona credenciales inválidas,  
**entonces** el sistema rechaza el acceso y muestra un mensaje de error sin exponer información sensible.

---

### RF-03 — Selección y preparación de la imagen

El sistema deberá permitir al usuario seleccionar una imagen de una posible afección de la piel, mostrar recomendaciones para obtener una imagen adecuada y permitir revisar o reemplazar la imagen antes de solicitar su análisis.

#### RF-03-AC-1

**Dado que** el usuario desea solicitar un análisis,  
**cuando** accede al proceso de selección de imagen,  
**entonces** el sistema muestra recomendaciones para obtener una fotografía adecuada y permite seleccionar una imagen.

#### RF-03-AC-2

**Dado que** el usuario seleccionó una imagen,  
**cuando** revisa la imagen antes de solicitar el análisis,  
**entonces** el sistema permite visualizarla y reemplazarla por otra imagen.

---

### RF-04 — Aviso de privacidad y aceptación

El sistema deberá informar al usuario sobre el tratamiento de la imagen y solicitar la aceptación del aviso de privacidad antes de enviarla para su análisis.

#### RF-04-AC-1

**Dado que** el usuario ha seleccionado una imagen,  
**cuando** se prepara para enviarla para análisis,  
**entonces** el sistema muestra información sobre el tratamiento de la imagen y solicita la aceptación del aviso de privacidad.

#### RF-04-AC-2

**Dado que** el aviso de privacidad ha sido presentado,  
**cuando** el usuario no lo acepta,  
**entonces** el sistema impide que la imagen sea enviada para su procesamiento.

#### RF-04-AC-3

**Dado que** el aviso de privacidad ha sido presentado,  
**cuando** el usuario lo acepta,  
**entonces** el sistema permite continuar con el proceso de análisis.

---

### RF-05 — Validación de imágenes

El sistema deberá validar que la imagen cumpla con las condiciones necesarias para ser analizada, considerando aspectos como formato, tamaño, calidad, iluminación, visibilidad de la zona de interés y correspondencia con el tipo de imagen esperado.

#### RF-05-AC-1

**Dado que** el usuario ha seleccionado una imagen,  
**cuando** DAFI realiza su validación,  
**entonces** el sistema verifica el formato, tamaño, calidad, iluminación, visibilidad de la zona de interés y correspondencia de la imagen con el dominio esperado.

#### RF-05-AC-2

**Dado que** una imagen no cumple con las condiciones establecidas,  
**cuando** el sistema finaliza su validación,  
**entonces** la imagen es rechazada y se informa al usuario el motivo cuando este pueda determinarse.

---

### RF-06 — Procesamiento de imágenes aptas

El sistema deberá procesar las imágenes consideradas aptas utilizando el modelo de inteligencia artificial integrado en DAFI para obtener una clasificación dentro de las categorías soportadas por el modelo.

#### RF-06-AC-1

**Dado que** una imagen ha superado las validaciones establecidas,  
**cuando** el usuario solicita su análisis,  
**entonces** DAFI procesa la imagen utilizando el modelo de inteligencia artificial integrado.

#### RF-06-AC-2

**Dado que** el modelo termina de procesar una imagen,  
**cuando** existe una clasificación válida,  
**entonces** DAFI utiliza únicamente una categoría soportada por el modelo para generar el resultado.

---

### RF-07 — Estado y errores del análisis

El sistema deberá informar al usuario sobre el estado del análisis y comunicar los errores que ocurran durante su procesamiento.

#### RF-07-AC-1

**Dado que** una imagen está siendo procesada,  
**cuando** el análisis todavía no ha finalizado,  
**entonces** DAFI informa al usuario que el análisis se encuentra en curso.

#### RF-07-AC-2

**Dado que** ocurre un error que impide completar el procesamiento de una imagen,  
**cuando** el sistema detecta que el análisis no puede finalizar correctamente,  
**entonces** DAFI informa al usuario que el análisis no pudo completarse, no almacena ni presenta el proceso fallido como una clasificación válida y permite iniciar un nuevo intento.

---

### RF-08 — Presentación del resultado

El sistema deberá presentar el resultado del análisis de manera comprensible, mostrando la clasificación estimada y, cuando el modelo lo permita, el nivel de confianza, junto con las limitaciones del resultado y una orientación para acudir con un profesional de la salud.

#### RF-08-AC-1

**Dado que** el modelo produjo una clasificación válida,  
**cuando** DAFI presenta el resultado,  
**entonces** muestra al usuario la clasificación estimada y el nivel de confianza cuando se encuentre disponible.

#### RF-08-AC-2

**Dado que** el usuario recibe el resultado de un análisis,  
**cuando** consulta la información presentada,  
**entonces** DAFI muestra las limitaciones del resultado y aclara que la clasificación no constituye un diagnóstico médico.

#### RF-08-AC-3

**Dado que** existe un resultado válido,  
**cuando** DAFI presenta el resultado al usuario,  
**entonces** muestra una orientación indicando que puede acudir con un profesional de la salud para obtener una valoración.

---

### RF-09 — Rechazo, resultado inconcluso y reintento

El sistema deberá informar al usuario cuando una imagen no pueda ser analizada o cuando el resultado sea inconcluso, indicando el motivo cuando sea posible y permitiendo realizar un nuevo intento con otra imagen.

#### RF-09-AC-1

**Dado que** una imagen no puede analizarse,  
**cuando** DAFI determina que no cumple las condiciones necesarias,  
**entonces** informa al usuario que no fue posible completar el análisis e indica el motivo cuando este pueda determinarse.

#### RF-09-AC-2

**Dado que** el modelo no alcanza el umbral de confianza definido para producir una clasificación,  
**cuando** finaliza el procesamiento,  
**entonces** DAFI presenta el resultado como inconcluso y no muestra una clasificación como resultado válido.

#### RF-09-AC-3

**Dado que** el análisis fue rechazado o resultó inconcluso,  
**cuando** el usuario decide volver a intentarlo,  
**entonces** el sistema permite seleccionar otra imagen e iniciar un nuevo análisis.

---

### RF-10 — Almacenamiento de análisis

El sistema deberá almacenar los análisis asociados a una cuenta, incluyendo al menos la fecha, el resultado y la imagen correspondiente, de acuerdo con las políticas de privacidad y conservación definidas.

#### RF-10-AC-1

**Dado que** un usuario registrado completa un análisis,  
**cuando** el resultado es almacenado,  
**entonces** DAFI guarda el análisis asociado a su cuenta incluyendo la fecha, el resultado y la imagen correspondiente.

#### RF-10-AC-2

**Dado que** un análisis se encuentra asociado a una cuenta,  
**cuando** DAFI almacena la imagen y el resultado,  
**entonces** conserva la información durante el periodo definido por la política de conservación vigente y la protege de acuerdo con las políticas de privacidad del sistema.

---

### RF-11 — Consulta del historial y detalle

El sistema deberá permitir a los usuarios registrados consultar su historial de análisis y acceder al detalle de los resultados almacenados.

#### RF-11-AC-1

**Dado que** un usuario registrado posee análisis almacenados,  
**cuando** consulta su historial,  
**entonces** DAFI muestra los análisis asociados a su cuenta.

#### RF-11-AC-2

**Dado que** un usuario está consultando su historial,  
**cuando** selecciona uno de sus análisis,  
**entonces** DAFI muestra el detalle y resultado correspondiente.

#### RF-11-AC-3

**Dado que** un usuario ha iniciado sesión,  
**cuando** consulta su historial,  
**entonces** el sistema no muestra análisis pertenecientes a otras cuentas.

---

### RF-12 — Eliminación de análisis

El sistema deberá permitir a los usuarios registrados eliminar un análisis de su historial junto con la imagen asociada.

#### RF-12-AC-1

**Dado que** un usuario registrado posee un análisis almacenado,  
**cuando** solicita eliminarlo,  
**entonces** DAFI elimina el análisis de su historial junto con la imagen asociada de acuerdo con las políticas de conservación aplicables.

#### RF-12-AC-2

**Dado que** un usuario intenta eliminar un análisis,  
**cuando** el análisis pertenece a otra cuenta,  
**entonces** el sistema rechaza la operación.

---

### RF-13 — Gestión de cuenta

El sistema deberá permitir a los usuarios registrados gestionar su cuenta, incluyendo la actualización de los campos del perfil definidos como editables, el cambio de contraseña y la eliminación de su cuenta y datos asociados.

#### RF-13-AC-1

**Dado que** un usuario registrado accede a la gestión de su cuenta,  
**cuando** modifica uno o más campos del perfil definidos como editables y guarda los cambios,  
**entonces** DAFI actualiza esos datos y muestra la información modificada.

#### RF-13-AC-2

**Dado que** un usuario registrado desea cambiar su contraseña,  
**cuando** proporciona la información de verificación requerida y una nueva contraseña que cumple con las reglas de seguridad definidas,  
**entonces** DAFI actualiza la contraseña asociada a su cuenta.

#### RF-13-AC-3

**Dado que** un usuario registrado solicita eliminar su cuenta,  
**cuando** confirma la operación,  
**entonces** DAFI elimina la cuenta y los datos asociados de acuerdo con las políticas de conservación aplicables.

---

### RF-14 — Consulta de información de privacidad

El sistema deberá proporcionar al usuario un mecanismo para consultar qué información personal e imágenes son almacenadas y las condiciones aplicables a su conservación.

#### RF-14-AC-1

**Dado que** un usuario desea conocer el tratamiento de su información,  
**cuando** accede a la sección de privacidad,  
**entonces** DAFI muestra qué información personal e imágenes son almacenadas.

#### RF-14-AC-2

**Dado que** un usuario consulta la información de privacidad,  
**cuando** revisa las condiciones de conservación,  
**entonces** DAFI muestra las políticas vigentes relacionadas con la conservación y eliminación de sus datos.

---

### RF-15 — Reporte de problemas técnicos

El sistema deberá proporcionar un mecanismo para reportar problemas técnicos relacionados con el funcionamiento de DAFI.

#### RF-15-AC-1

**Dado que** un usuario encuentra un problema técnico,  
**cuando** accede al mecanismo de reporte y proporciona una descripción del problema,  
**entonces** el sistema permite enviar el reporte.

#### RF-15-AC-2

**Dado que** el usuario envía un reporte técnico,  
**cuando** el sistema procesa la solicitud,  
**entonces** confirma que el reporte fue recibido o informa al usuario si no pudo enviarse.

---

### RF-16 — Gestión administrativa

El sistema deberá proporcionar a los administradores herramientas para gestionar la plataforma de acuerdo con los permisos definidos.

#### RF-16-AC-1

**Dado que** un usuario autenticado posee el rol de administrador,  
**cuando** intenta utilizar una función administrativa para la cual tiene permiso,  
**entonces** DAFI permite ejecutar dicha función.

#### RF-16-AC-2

**Dado que** un usuario no cuenta con los permisos administrativos correspondientes,  
**cuando** intenta acceder a una función administrativa,  
**entonces** DAFI rechaza el acceso.

---

### 3.2 Requerimientos no funcionales

#### RNF-01 — Seguridad y privacidad de la información

Las imágenes, resultados de análisis y datos personales deberán protegerse durante su transmisión, almacenamiento y acceso.

**Verificación:** se comprobará que la información protegida se transmite, almacena y consulta utilizando los mecanismos de seguridad definidos durante el diseño e implementación del sistema.

#### RNF-02 — Seguridad y control de acceso

El sistema deberá garantizar que cada usuario únicamente pueda acceder a la información asociada a su propia cuenta y deberá limitar los permisos administrativos a las funciones autorizadas.

**Verificación:** se realizarán pruebas para comprobar que un usuario no puede consultar, modificar o eliminar información perteneciente a otra cuenta y que las funciones administrativas respetan los permisos definidos.

#### RNF-03 — Protección de registros técnicos

Los registros técnicos del sistema no deberán exponer imágenes, credenciales ni datos personales sensibles que no sean necesarios para su funcionamiento.

**Verificación:** se revisarán los registros generados durante operaciones y errores representativos para comprobar que no contienen información sensible innecesaria.

#### RNF-04 — Rendimiento

El sistema deberá proporcionar un tiempo de respuesta adecuado durante el análisis de imágenes. El tiempo máximo aceptable se definirá después de realizar pruebas con el modelo de inteligencia artificial y la infraestructura utilizada.

**Verificación:** una vez establecido el tiempo máximo aceptable, se realizarán pruebas utilizando imágenes representativas y se compararán los tiempos observados con el valor definido.

#### RNF-05 — Usabilidad

La interfaz deberá ser comprensible para personas sin conocimientos especializados, utilizando instrucciones, resultados y mensajes de error claros.

**Verificación:** se realizarán pruebas de usabilidad con personas representativas del público objetivo para comprobar que puedan seleccionar una imagen, solicitar un análisis, comprender el resultado y localizar las funciones principales sin requerir conocimientos médicos o técnicos.

#### RNF-06 — Compatibilidad y validación de entradas

El sistema deberá definir y restringir los formatos, tamaños máximos y condiciones permitidas para las imágenes utilizadas durante el análisis.

**Verificación:** una vez definidos estos límites, se comprobará que las imágenes compatibles sean aceptadas y que aquellas que no cumplan las condiciones sean rechazadas correctamente.

#### RNF-07 — Calidad y confiabilidad del modelo

El desempeño del modelo de inteligencia artificial deberá evaluarse por cada categoría soportada y no únicamente mediante una métrica global. También deberá evaluarse su capacidad para rechazar imágenes no adecuadas o producir resultados inconclusos.

**Verificación:** se documentarán y revisarán las métricas obtenidas para cada categoría, además de pruebas con imágenes que deban ser rechazadas o generar resultados inconclusos. Los umbrales mínimos de aceptación deberán definirse antes de considerar validado el modelo.

#### RNF-08 — Comunicación responsable de precisión y confianza

La interfaz y la documentación de DAFI no deberán presentar la precisión o el nivel de confianza del modelo como una certeza médica.

**Verificación:** se revisarán los mensajes relacionados con clasificaciones, precisión y confianza para comprobar que los resultados se presentan como estimaciones y no como diagnósticos.

---

### 3.3 Requerimientos de dominio

#### RD-01 — Propósito de apoyo

DAFI funcionará únicamente como una herramienta de apoyo para proporcionar una clasificación inicial de posibles afecciones dermatológicas y no sustituirá la valoración de un profesional de la salud.

#### RD-02 — Categorías soportadas

Las clasificaciones proporcionadas por DAFI estarán limitadas a las categorías y capacidades soportadas por el modelo de inteligencia artificial utilizado.

#### RD-03 — Naturaleza de los resultados

Los resultados generados por el modelo deberán considerarse estimaciones y no diagnósticos médicos, incluso cuando se proporcione un nivel de confianza.

#### RD-04 — Posibilidad de resultado inconcluso

Cuando una imagen no corresponda al dominio esperado, no tenga la calidad suficiente o el modelo no pueda producir un resultado con el umbral de confianza definido, DAFI deberá presentar un resultado inconcluso en lugar de forzar una clasificación.

#### RD-05 — No prescripción

DAFI no deberá recomendar tratamientos, medicamentos ni automedicación como resultado del análisis realizado.

#### RD-06 — Tratamiento de información sensible

Las imágenes y resultados de los usuarios deberán tratarse como información potencialmente sensible. Su recopilación, utilización, conservación y eliminación deberán limitarse a lo necesario e informarse al usuario.

#### RD-07 — Información esencial para los usuarios

Los usuarios recibirán la misma información esencial sobre la clasificación y sus limitaciones. No se proporcionarán resultados clínicos diferentes a usuarios académicos o del área de salud mientras esa necesidad no haya sido validada.

#### RD-08 — Tecnologías establecidas

DAFI será desarrollado utilizando Next.js para el frontend, Node.js con Express para el backend y MongoDB para la persistencia de datos.