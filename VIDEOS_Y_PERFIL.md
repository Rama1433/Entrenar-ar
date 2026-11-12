# Videos propios y datos opcionales del alumno · V1.12.0

Esta entrega incorpora una demostración propia por ejercicio del profesor y edad, peso y altura opcionales en el registro y perfil del alumno. El código está preparado y probado localmente; no se modificó la base real ni se desplegó la función desde el chat.

## Activar en tu proyecto

1. Con SQL 12 ya aplicado, abrí **Supabase → SQL Editor → New query** y ejecutá todo el contenido de `setup/Entrenar_14_Videos_y_Datos_Alumno.sql`. Copiá el archivo `.sql`, no este documento. El SQL crea el bucket privado y los permisos automáticamente. SQL 13 de avisos es independiente; no hace falta para estas funciones.
2. Abrí **Supabase → Edge Functions → Deploy a new function → Via Editor**. El nombre debe ser exactamente **exercise-media**. Reemplazá el ejemplo de `index.ts` por el contenido completo de `setup/exercise-media/index.ts` y desplegalo.
3. En la configuración de **esa función**, desactivá **Verify JWT / Enforce JWT verification**. El código valida explícitamente la sesión con `auth.getUser`, verifica el rol de profesor y vuelve a comprobar el plan y el ejercicio en las funciones de la base. No cambies la configuración de otras funciones.
4. Subí los archivos actualizados del ZIP al GitHub de Entrenar, esperá el despliegue de Vercel y cerrá/reabrí la PWA. El pie debe mostrar **V1.12.0**.

No se agregan claves a Vercel ni a GitHub. La función usa las variables de servidor predeterminadas de Supabase. Nunca copies `service_role` en código del navegador. El origen permitido es el dominio actual `https://entrenar-ar.vercel.app`; si cambiás de dominio también hay que ajustar `ORIGIN` en la función.

Para CLI, ubicar `index.ts` en `supabase/functions/exercise-media/index.ts` y agregar la sección del `config.toml` incluido al `supabase/config.toml` de tu proyecto. Las dependencias `mediainfo.js` y `ts-ebml` se importan desde npm con versiones fijadas; la función usa WebAssembly para inspeccionar el archivo. No es una dependencia que deba cargarse en la PWA ni hay que agregar archivos WASM al front-end.

## Uso del profesor

En **Ejercicios → Nuevo ejercicio / Editar → Demostración propia**:

- **Grabar demostración:** pide permiso de cámara únicamente al tocar. Muestra la cámara para acomodar la posición. Después hay que tocar **Comenzar grabación · 7 s**. No pide micrófono.
- La grabación corta automáticamente cerca de los siete segundos, con resolución y tasa de video acotadas. Tiene un margen técnico de hasta 250 milisegundos para el cierre del archivo.
- **Elegir video:** admite MP4, MOV o WebM existentes de hasta siete segundos, 3 MiB y resolución máxima 720p (lado corto hasta 720 y lado largo hasta 1280, horizontal o vertical). Admite video H.264/AVC, VP8 o VP9; otros códecs se rechazan para evitar problemas entre dispositivos. No recorta ni comprime archivos de galería; si son largos o grandes se explica el límite y se puede grabar desde Entrenar.
- **Reproducir vista previa:** permite revisar el clip antes de confirmar. El archivo se sube recién al tocar **Guardar ejercicio**.
- **Quitar demostración:** se aplica al guardar. Si el ejercicio conserva un enlace de YouTube Shorts, vuelve a usarse ese enlace.

Se conserva un video por ejercicio. Las distintas rutinas que usan ese mismo ejercicio reutilizan su archivo. Reemplazar la demostración no cambia rutinas, registros de entrenamientos ni sus datos históricos. Si el video falla al subirse, el formulario conserva la selección para reintentar; el ejercicio ya creado conserva su ID para que el reintento no lo duplique. Si se abandona o recarga la página antes de guardar, la selección de video no se conserva.

En equipos sin grabación compatible se ofrece el selector/cámara del dispositivo. El archivo resultante debe respetar los mismos límites. La cámara se cierra al salir del modal, cambiar de cuenta o dejar la app en segundo plano; no se graba en segundo plano.

## Uso del alumno

En la rutina, **Ver técnica** abre el video dentro de Entrenar, junto con los músculos del ejercicio. Se reproduce sin sonido y en loop, con botón **Pausar / Reproducir video**. Se detiene al cerrar y al ocultar la app. Si el navegador impide iniciar automáticamente, se muestra el botón para reproducir.

El archivo se obtiene una vez al abrir el reproductor y el loop se hace localmente. No vuelve a descargarse en cada vuelta del video. Abrirlo nuevamente puede generar otra descarga.

El enlace de YouTube Shorts sigue disponible como alternativa. Cuando el ejercicio tiene una demostración propia, se prioriza ese video.

## Edad, peso y altura opcionales

- Aparecen solo en el alta de **Alumno**, en la confirmación de sus datos después del correo y en **Mi perfil → Editar mis datos**.
- Todos pueden quedar vacíos. Peso y altura aceptan coma o punto y un decimal.
- Edad: de 1 a 120 años. Es un dato informado por el alumno; no se solicita fecha de nacimiento ni se incrementa la edad automáticamente cada cumpleaños.
- Peso y altura: se conservan los límites de carga de hasta 300 kg y 300 cm. No se deducen diagnósticos ni objetivos a partir de esos valores.
- Si se carga o cambia una medida, se guarda en **Mi progreso**, con la fecha del día. Si ya existe un registro de ese día, se completa/actualiza el mismo, preservando la otra medida cuando no se modifica. Editar solo el nombre o el sexo no crea otro registro de medidas.
- Dejar la edad vacía la quita del perfil. Dejar peso/altura vacíos no borra su historial; ese historial mantiene la edición por fecha que ya existía.
- La edad es visible para el alumno y su profesor vinculado en la ficha. Peso y altura conservan su privacidad anterior: solo el alumno puede consultar sus medidas. No se amplía el acceso del administrador ni del profesor a ese historial.

Durante el registro, los valores opcionales se mantienen para completar el recorrido después de confirmar el correo. Al confirmar y guardarlos se limpian los valores de alta de los metadatos de Auth; el perfil y las medidas son la fuente de datos de la aplicación.

## Espacio y permisos

El bucket **exercise-demos** es privado. No hay archivos con enlace público. La reproducción usa una descarga autenticada y un enlace temporal local del navegador; no se guardan esos enlaces en la base ni en el caché del service worker.

- Solo el profesor dueño, con plan vigente, puede cargar/reemplazar/quitar una demostración.
- Solo ese profesor y los alumnos con vinculación activa y una rutina asignada que incluya el ejercicio pueden descargarla. Se incluyen las rutinas de la semana vigente de Planificación.
- Ni otro profesor, ni alumnos de otros equipos, ni el rol administrador, ni una sesión sin ingresar pueden acceder al archivo.
- El navegador no tiene permiso de escritura directa al bucket ni puede inventar la ruta de un video en un ejercicio. La función valida tamaño, formato, duración y resolución antes de confirmarlo.
- Límite inicial por profesor: **100 MiB entre archivos vigentes y pendientes de borrar**, hasta **100 demostraciones** y **20 intentos de carga por hora**. El reemplazo necesita espacio temporal para conservar el video anterior hasta que el nuevo esté confirmado. Son límites técnicos iniciales, no cambios comerciales de los planes.
- Las versiones anteriores se borran de Storage al reemplazar o quitar. Si una eliminación falla, el archivo deja de ser accesible y queda registrado para reintentar la limpieza en una próxima operación de ese profesor. Sigue contando para la cuota mientras no se confirme el borrado.

A diferencia del enlace de YouTube, los videos propios consumen almacenamiento, transferencia e invocaciones en Supabase. El consumo depende de la cantidad de archivos y reproducciones; no se añade otro proveedor de pago ni se promete consumo gratuito ilimitado.

## Demos y verificación

Las demos pueden grabar, elegir y reproducir videos solo durante la sesión de esa pestaña. No suben archivos ni datos a Supabase. Al recargar o cambiar de cuenta se descartan esas grabaciones. Los datos opcionales del perfil demo siguen usando el almacenamiento local de la demo.

Verificado localmente:

- PostgreSQL: 444 operaciones, incluyendo las pruebas previas, edad y medidas, privacidad por roles, archivos por asignación, bloqueo de rutas inventadas y subidas directas, reemplazo, limpieza, cuotas y límite de intentos.
- Cliente simulado: registro, confirmación y perfil opcionales, decimales, no duplicación de medidas, grabación/vista previa, guardado explícito, pausa/loop y aislamiento de demos.
- Archivos reales MP4/WebM: aceptación de clips cortos y rechazo de duración/resolución fuera del límite; verificación de tipos y ejecución en Deno del inspector WebAssembly.
- Chromium: revisión visual de formularios y reproductor a 320/390 píxeles y PC; reproducción de un clip de prueba en loop y sin sonido.

Pendiente después de activar: probar la cámara física del iPhone/Android y la carga/descarga autenticada entre un profesor y un alumno reales en el proyecto Supabase. El despliegue remoto no se realizó desde este chat.

Referencias:
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/storage/security/access-control
- https://mediainfo.js.org/docs/getting-started/usage/
- https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
