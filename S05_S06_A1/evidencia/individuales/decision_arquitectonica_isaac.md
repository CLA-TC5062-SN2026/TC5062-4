# ADR-001: Selección del estilo arquitectónico

**Fecha:** 2026-10-09  
**Estado:** Aceptado

## Contexto

DAFI es una aplicación web orientada principalmente a dispositivos móviles que permite a una familia comunicarse con médicos que ya conoce para organizar conversaciones relacionadas con la salud de sus seres queridos.

El SRS establece como tecnologías principales Next.js para el cliente web, Node.js con Express para la API y MongoDB como base de datos. Además, las fotografías se almacenarán en un almacenamiento de archivos accesible únicamente desde la API y existe un módulo de resumen que utiliza un proveedor externo de modelo de lenguaje.

El sistema maneja datos personales sensibles, por lo que debe mantener controles estrictos de autorización, privacidad, cifrado, eliminación de datos y auditoría.

Entre los requerimientos no funcionales que influyen en esta decisión se encuentran:

- RNF-01: tiempos de respuesta definidos para fotografías, conversaciones y resúmenes.
- RNF-05: seguridad de las comunicaciones, datos, contraseñas y sesiones.
- RNF-06 y RNF-07: privacidad y eliminación de fotografías y datos.
- RNF-08 y RNF-13: trazabilidad y auditoría de accesos y eventos de seguridad.
- RNF-10: disponibilidad del 99 % mensual.
- RNF-11: facilidad para extender el catálogo de etiquetas.
- RNF-12: protección de datos antes de llamar al módulo externo de resumen.

También se considera que la primera versión será desarrollada durante el curso por un equipo pequeño y que la arquitectura debe ser posible de implementar y mantener sin introducir infraestructura innecesaria.

## Decisión

Se utilizará una arquitectura **cliente-servidor con un backend monolítico modular organizado en capas**.

El sistema tendrá los siguientes elementos principales:

1. Un cliente web desarrollado con Next.js.
2. Una API desarrollada con Node.js y Express.
3. Una capa de aplicación que coordinará los casos de uso.
4. Una capa de dominio que contendrá las reglas principales del sistema.
5. Una capa de infraestructura para MongoDB, almacenamiento de fotografías, correo y servicios externos.
6. Un módulo de integración con el servicio externo utilizado para generar el resumen de contexto.

Dentro del backend se separarán módulos por responsabilidades, por ejemplo:

- autenticación y cuentas;
- familias y perfiles;
- círculo médico;
- conversaciones e historial;
- fotografías;
- notificaciones;
- resumen de contexto;
- privacidad y auditoría;
- administración.

La API será el punto central de acceso a los datos y será responsable de aplicar las reglas de autorización antes de acceder a MongoDB, fotografías o información enviada al módulo de resumen.

Esta estructura permite mantener una separación clara de responsabilidades sin introducir la complejidad operacional de varios servicios independientes.

## Alternativas consideradas

### 1. Microservicios

Se consideró dividir el sistema en servicios independientes, por ejemplo autenticación, conversaciones, notificaciones y resumen.

**Ventajas:**
- Permite escalar individualmente cada servicio.
- Proporciona aislamiento entre diferentes funcionalidades.
- Puede facilitar la evolución independiente de módulos en un sistema de mayor tamaño.

**Desventajas:**
- Aumenta significativamente la complejidad de implementación y despliegue.
- Requiere manejar comunicación y errores entre servicios.
- Hace más compleja la consistencia de operaciones que afectan varios recursos.
- Requiere mayor trabajo de monitoreo, configuración y seguridad.
- Su complejidad no se justifica para el tamaño actual de DAFI ni para un desarrollador o equipo pequeño.

### 2. Arquitectura orientada a eventos

Se consideró utilizar eventos como principal mecanismo de comunicación entre módulos.

**Ventajas:**
- Permite desacoplar funcionalidades.
- Es adecuada para procesos asíncronos como notificaciones.
- Puede facilitar el procesamiento de tareas en segundo plano.

**Desventajas:**
- Aumenta la dificultad para seguir el flujo completo de una operación.
- Requiere mecanismos adicionales para manejar eventos fallidos, duplicados e idempotencia.
- Introduce infraestructura y complejidad que no son necesarias para la primera versión.

La arquitectura orientada a eventos podría utilizarse en el futuro para procesos específicos, pero no se utilizará como estilo principal de la versión 1.

## Consecuencias

### Ventajas

- La arquitectura coincide con las tecnologías definidas en el SRS.
- Existe un único punto de entrada en la API para aplicar autenticación y autorización.
- Se facilita proteger los datos sensibles antes de acceder a almacenamiento o servicios externos.
- La separación por módulos y capas mejora la mantenibilidad.
- El módulo de resumen queda aislado detrás de una interfaz, por lo que el proveedor externo puede cambiar sin afectar al resto del dominio.
- Resulta más sencilla de desarrollar, probar y desplegar que una arquitectura de microservicios.
- Permite evolucionar posteriormente algunos módulos hacia servicios independientes si la escala lo requiere.

### Desventajas

- Los módulos del backend comparten un mismo proceso y despliegue.
- Un crecimiento considerable del sistema podría requerir separar algunos módulos en servicios independientes.
- El escalamiento del backend inicialmente ocurre como una sola unidad y no módulo por módulo.

Se acepta este trade-off porque la simplicidad, mantenibilidad y facilidad de implementación tienen mayor importancia para la primera versión de DAFI que la capacidad de escalar cada módulo de manera independiente.


## Revisión crítica del diagrama de clases del dominio

Durante la revisión del modelo de dominio propuesto para DAFI, se identificaron dos aspectos que podían mejorarse para representar correctamente los requerimientos del SRS.

### Decisión 1: Separar los permisos del historial de la relación entre familias y médicos

**Propuesta inicial:** Representar la relación entre una familia y sus médicos mediante una asociación directa, almacenando los permisos de acceso dentro de la misma relación.

**Modificación realizada:** Se utilizaron las clases `CirculoMedico` y `PermisoHistorial` para representar por separado la pertenencia de un médico al círculo de una familia y la autorización para consultar el historial de un paciente específico.

**Justificación:** El SRS establece que cada médico puede tener permisos diferentes para consultar el historial de cada paciente. Separar estas responsabilidades permite administrar los permisos individualmente y evita que compartir el historial de un paciente conceda acceso a información de otros pacientes.

### Decisión 2: Utilizar herencia para representar los eventos de una conversación

**Propuesta inicial:** Utilizar clases independientes para mensajes, respuestas, fotografías e indicaciones, cada una con sus propios atributos de fecha y autor.

**Modificación realizada:** Se creó una clase abstracta `Evento`, que contiene los atributos comunes `id`, `fechaHora` y `autorId`. Las clases `Mensaje`, `RespuestaContexto`, `Fotografia` e `Indicacion` heredan de ella.

**Justificación:** El SRS establece que el historial de una conversación contiene distintos tipos de eventos ordenados cronológicamente, todos con fecha y autor. Utilizar herencia evita duplicar estos atributos y permite manejar los diferentes tipos de eventos de manera uniforme.

Además, esta estructura facilita que el módulo de resumen pueda relacionar cada cita textual con un evento original, respetando los requerimientos de trazabilidad y verificación de citas.

### Conclusión

Estas modificaciones buscan que el modelo represente mejor las reglas del dominio de DAFI. La primera fortalece el control de acceso a información sensible y la segunda mejora la organización y mantenibilidad de los eventos que forman el historial de conversaciones.