# Biblioteca y editor de rutinas · V1.9.19

## Profesor

Rutinas tiene Mis rutinas y Plantillas de Entrenar. Las cuatro plantillas iniciales son Cuerpo completo, Tren superior, Tren inferior y core y Entrenamiento en casa. Muestran ejercicios, equipamiento, días y valores sugeridos. El profesor revisa la propuesta antes de asignarla. No son planes personalizados ni se asignan automáticamente.

Ver plantilla permite consultar sus detalles sin guardar nada. Usar plantilla abre un borrador editable. Guardarlo crea una rutina propia; no cambia la plantilla ni las rutinas de otros profesores. Las plantillas están definidas en routineTemplates dentro de app.js; ampliar el catálogo es una actualización de la app, no una operación del panel de administrador en esta versión.

El editor permite buscar por nombre o grupo, agregar ejercicios propios o del catálogo inicial, ajustar series/repeticiones/descanso, reordenar y quitar ejercicios. Copiar series y descanso a todos aplica solamente esos dos valores. Es posible seleccionar varios alumnos activos para asignar al guardar o hacerlo después.

Duplicar abre una copia sin asignaciones previas. Editar una rutina existente mantiene el comportamiento anterior: modifica la rutina para sus alumnos asignados y limpia borradores pendientes de ese profesor; los entrenamientos finalizados se conservan.

Ejercicios tiene Mis ejercicios y Catálogo de Entrenar. Se presentan filas compactas; el catálogo lleva al formulario con músculos completos. Se avisa al intentar crear otro ejercicio con el mismo nombre y grupo. Se permite editar los registros duplicados que ya existían sin renombrarlos obligatoriamente. No se elimina ningún ejercicio anterior.

## Supabase

Ejecutar setup/Entrenar_09_Plantillas_Rutinas.sql después de los SQL 07 y 08, antes de publicar V1.9.19. Crea una operación autenticada para guardar la rutina, los ejercicios de catálogo que falten y las asignaciones elegidas en una sola transacción. Si falla cualquier parte, todo revierte. Reutiliza ejercicios propios por nombre y grupo sin sobrescribir sus videos o indicaciones. Una operación estable mantiene el ID de la rutina al reintentar, evitando copias duplicadas.

Solo un profesor con suscripción vigente puede ejecutarla. Comprueba propiedad de rutinas y ejercicios, y que los alumnos elegidos sean miembros aprobados de su equipo. No cambia las políticas RLS ni habilita acceso entre cuentas. Las demos mantienen el flujo local sin llamadas de escritura a Supabase.

## Correcciones adicionales

El anuncio redundante de descanso ahora queda oculto visualmente; continúa disponible para lectores de pantalla. Se conservan el contador, la alarma y el botón Detener.

La invitación utiliza un enlace de api.whatsapp.com con codificación UTF-8 de una sola pasada. Los símbolos de saludo y fuerza se construyen con puntos de código Unicode explícitos. Se comprobó que el texto recuperado del enlace conserva acentos, emojis y saltos de línea; el envío final debe verificarse en el cliente de WhatsApp del usuario.
