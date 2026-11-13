# Vista del profesor · V1.14.0

## Activar esta versión

1. Con SQL 14 ya aplicado, abrí Supabase → SQL Editor → New query y ejecutá todo el contenido de `setup/Entrenar_15_Ficha_Alumno.sql`. Copiá el archivo SQL, no este documento.
2. Subí todos los archivos actualizados del ZIP a GitHub y esperá el despliegue de Vercel.
3. Cerrá y reabrí la PWA. El pie debe mostrar **V1.14.0**.

No hace falta volver a desplegar `exercise-media`, crear otro bucket ni cambiar sus claves/permisos. El formulario por pasos también funciona en la demo; la ficha real requiere el SQL 15.

La migración y el despliegue remoto no se realizaron desde este chat. No se modificaron pagos, rutinas guardadas ni historiales.

## Ficha del alumno

Profesor → Alumnos → Ver ficha ahora muestra **Datos del alumno**:

- Edad informada por el alumno.
- Sexo seleccionado en su perfil.
- Último peso registrado y su fecha.
- Última altura registrada y su fecha.

Cada medida tiene su propia fecha porque el alumno puede actualizar el peso sin cambiar la altura. Si no completó un dato aparece **Sin completar**. Los datos se consultan; no se habilita al profesor a cambiarlos por el alumno.

La ficha conserva objetivo, días por semana, correo, WhatsApp, observaciones, rutinas asignadas y últimos entrenamientos.

La consulta nueva solo entrega el resumen de alumnos con vínculo aprobado y activo para ese profesor y con un plan de profesor vigente. No permite consultar alumnos de otro equipo. El administrador y otros alumnos tampoco pueden ejecutarla. Al desactivar el vínculo o vencer/suspender el plan, el resumen deja de estar disponible.

El historial completo de medidas sigue siendo del alumno. Se comparte únicamente el último valor disponible de peso y altura, con sus fechas. No se habilita lectura directa de la tabla de medidas al profesor. El sexo se obtiene en el servidor desde la selección ya existente del alumno; no se expone la tabla de usuarios de Auth ni otros metadatos.

Los cambios de medidas o sexo generan una señal privada de actualización para el profesor correspondiente, sin incluir esos datos en el mensaje de Realtime. Se conservan las protecciones de actualización automática mientras hay un formulario o entrenamiento abierto. Para comprobar inmediatamente un cambio puede usarse el gesto de actualizar.

## Crear o editar ejercicio en tres pasos

El formulario del profesor es el mismo para PC y celular:

1. **Datos:** nombre, grupo muscular o elegir un ejercicio del catálogo. El catálogo completa también los músculos sugeridos.
2. **Músculos:** elegir principales y secundarios desde la figura de frente/espalda o desde la lista. Los colores se actualizan al seleccionar. Un músculo no puede quedar en ambas categorías. La selección también admite teclado. Si no se conocen los músculos se pueden completar después.
3. **Video e indicaciones:** enlace de YouTube Shorts o demostración propia con cámara/galería, y observaciones opcionales. Se conservan los límites y controles de la V1.12.1 para los videos.

**Continuar** avanza; **Atrás** vuelve conservando lo cargado. También se pueden tocar las etapas superiores para revisar los datos. El nombre se valida antes de avanzar. El ejercicio y su video se guardan únicamente al tocar **Guardar ejercicio** en el último paso.

Volver a otra etapa conserva el video ya seleccionado y los textos. Si la cámara está abierta, se cierra al salir de su etapa; no queda grabando oculta. Los errores de video impiden confirmar hasta elegir un archivo válido o descartar la selección.

El selector de músculos muestra la figura neutra que ya utiliza la vista del profesor. No cambia la figura personal del alumno ni sus preferencias.

El formulario del catálogo administrativo conserva su funcionamiento anterior. No se agregan las pantallas de grabación al administrador.

## Verificación de esta entrega

- **41 comprobaciones del flujo:** etapas, catálogo, figura/lista, teclado, validación, Enter sin guardado prematuro, conservación de textos/video, un único guardado, consulta de la ficha e independencia del catálogo administrativo.
- **464 operaciones en PostgreSQL:** incluye las verificaciones anteriores y el resumen de medidas; separación entre profesores, alumno/administrador sin acceso, plan y vínculo vigentes, últimas medidas, señales de actualización y segunda ejecución del SQL.
- Se vuelven a comprobar el cliente de cuentas reales/demos y las operaciones de videos.
- Revisión visual en Chromium a 320/390 píxeles y PC, sin desbordamiento horizontal de los nuevos cuadros.

Después de desplegar, queda comprobar el recorrido con un profesor y un alumno reales: completar sexo/edad/medidas como alumno, aprobar su vínculo y abrir su ficha desde el profesor. Este chat no probó cuentas privadas en producción.
