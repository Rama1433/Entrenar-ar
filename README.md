# Entrenar · V1.5.1

PWA independiente para profesores y alumnos. Funciona sin compilación, dependencias ni base de datos.

## Publicar en Vercel

1. Subir estos archivos en la raíz de un repositorio nuevo de GitHub.
2. En Vercel, elegir Add New → Project e importar el repositorio.
3. Framework Preset: Other. Root Directory: raíz del proyecto. No requiere Install Command ni Build Command. Output Directory: `.`.
4. Publicar y abrir el enlace HTTPS generado.

No reutilizar el proyecto de Barber Manager. No requiere variables de entorno.

## Probar

El selector superior permite alternar Profesor, Alumno y Administrador. Es una demostración local, sin autenticación. Los cambios se guardan en localStorage del navegador. Las pestañas de prueba comparten esos datos dentro del mismo origen.

- Profesor: cargar y editar alumnos; activar/inactivar conservando historial; crear ejercicios con enlaces a videos; crear y editar rutinas; asignarlas sin duplicados; publicar avisos; probar planes de 10 y 30 alumnos y el plan Equipo.
- Alumno: seleccionar alumno de prueba; ver rutinas asignadas; registrar carga y repeticiones; marcar ejercicios; usar descanso; finalizar una sesión y consultar historial/progreso.
- Administrador: consultar y editar registros de profesores y planes; exportar/importar una copia JSON; restablecer datos de ejemplo.

Equipo tiene capacidad comercial a definir y no impone un límite numérico en esta versión. Los profesores adicionales son registros administrativos: no tienen todavía espacios de datos propios. Los precios quedan por definir. No se procesan pagos.

Los datos iniciales son ficticios; el historial comienza vacío. Alumnos inactivos no ocupan cupo y conservan su historial. La edición de una rutina se aplica a todos sus alumnos asignados y reinicia sus sesiones pendientes, conservando sesiones finalizadas.

## Instalación

- Android / Chrome: menú → Instalar aplicación o Agregar a pantalla principal.
- iPhone / Safari: Compartir → Agregar a pantalla de inicio.
- PC / Chrome o Edge: instalar desde la barra de direcciones o el menú.

Carga inicial con internet. Después, los archivos principales quedan disponibles sin conexión. Los videos externos requieren internet. El navegador puede eliminar almacenamiento local; exportar copias desde Administrador → Ajustes. Una copia importada reemplaza los datos locales luego de confirmar.

## Próxima etapa

Conectar Supabase: autenticación, roles verificados, espacios separados por profesor, permisos, invitaciones y sincronización. Reemplazar el selector de prueba por acceso real; incorporar el control de suscripciones desde el servidor. No usar esta versión para datos personales reales.

## Desarrollo local

Servir la carpeta mediante HTTP en localhost (por ejemplo `python3 -m http.server 8000`) y abrir http://localhost:8000. En producción requiere HTTPS. No abrir index.html directamente con file://.

Archivos principales: index.html, styles.css, app.js, manifest.webmanifest, sw.js, icons/, vercel.json. Para actualizaciones, incrementar la versión de caché en sw.js.

## Actualización 1.1

- Profesor en celular: menú inferior reducido a Inicio, Alumnos y Rutinas; Más reúne Ejercicios, Avisos y Mi plan. El selector de vista de prueba está dentro de Más en celular. En PC se conserva el menú lateral.
- Nuevo alumno junto al saludo en móvil; acceso también disponible en Alumnos. La creación de rutinas se concentra en Rutinas.
- WhatsApp requerido al crear o editar un alumno; los registros anteriores siguen disponibles sin ese dato hasta su edición. Campo de teléfono con código de país y enlace de contacto desde la ficha, sin envío automático.
- Selector de varios días de lunes a sábado. Si una rutina anterior tenía otro día, el formulario lo conserva como opción adicional para no perderlo.
- Frases diarias originales para profesor y alumno; dependen de la fecha local del dispositivo y no cambian al navegar o recargar.
- Se conservan el guardado local y la compatibilidad con copias de V1. Aún no se conectaron cuentas ni base de datos.

## Actualización 1.2

- Logo de Entrenar incluido como archivo SVG y en la caché de la PWA; visible en menú lateral de PC y cabecera de celular.
- Profesor en móvil: Inicio, Alumnos, Rutinas y Ejercicios. El nombre/avatar abre Perfil, reemplazando Más.
- Perfil: datos editables (nombre, correo y WhatsApp), plan actual, cupos y acceso a planes. El estado y vencimiento siguen siendo de prueba, sin cobros.
- Avisos para alumnos desde el perfil, con revisión y confirmación antes de publicar.
- La campanita del profesor muestra exclusivamente comunicados del administrador, con indicador de no leídos. Administrador tiene sección Comunicados. La del alumno muestra los avisos de su profesor.
- Son mensajes dentro de esta demostración local. No son push, WhatsApp ni correo; la entrega entre dispositivos requerirá conectar la base.
- Copias y registros anteriores compatibles; los campos nuevos se agregan al cargar, sin borrar historial.

## Corrección 1.2.1

El logo se integra como SVG dentro de la interfaz y el HTML inicial. Ya no solicita /icons/entrenar-logo.svg para mostrarse. Se conserva el resto de la app. Actualizar app.js, index.html y sw.js o subir el paquete completo.

## Corrección 1.2.2

Favicon integrado en index.html: símbolo de Entrenar en verde y lima para la pestaña del navegador, sin solicitar un PNG externo. Para este cambio visual basta actualizar index.html; el paquete completo también incrementa la versión y caché a 1.2.2.

## Actualización 1.3

- Frases diarias en el cuadro verde de Inicio para profesor y alumno; se elimina su repetición al pie.
- Alumno: navegación Inicio / Mi rutina / Progreso, perfil desde nombre/avatar, avisos solo desde campanita. Selector de alumno y cambio de rol de demostración dentro de Perfil.
- Perfil editable del alumno y datos de contacto de su profesor. Los objetivos y rutinas los configura el profesor.
- Rutinas con días, vista previa de ejercicios y avance guardado. Pantalla de entrenamiento con tarjetas, indicaciones, último registro real, descanso y completar cada ejercicio.
- Progreso con peso y altura opcionales, fecha e historial editable. Un registro por día; los registros quedan asociados al alumno. Sin IMC, valoraciones médicas ni objetivos automáticos de peso. Esta demo no comparte medidas con el profesor.
- Guardado de datos anteriores compatible. No hay conexión a relojes, HealthKit ni Health Connect. No se solicitan permisos de sensores. No hay sincronización entre dispositivos.

## Corrección 1.3.1

El formulario de peso y altura limita el ancho intrínseco del selector de fecha de iOS, mantiene los campos en una columna en celular, compacta espacios y permite desplazar verticalmente el modal. No cambia registros ni cálculos. La integración de relojes sigue pospuesta.

## Corrección 1.3.2

Peso y altura usan campos de texto con teclado decimal para aceptar coma o punto en iPhone/Android/PC. Hasta un decimal. Validación explícita de formato (sin exponentes ni separadores de miles), positivos y límite de carga de 300 kg / 300 cm. Los registros históricos anteriores no se eliminan; se marca Revisar dato si exceden los límites nuevos. Estos límites son controles de ingreso de esta versión, no criterios médicos.

## Ajuste 1.3.3

El acceso al perfil de profesor y alumno saluda con Hola, nombre 👋 en PC y celular. En pantalla pequeña el saludo se acomoda en dos líneas cuando hace falta; el nombre puede abreviarse visualmente y la mano queda visible.


## Actualización 1.4.0 · Acceso y registro visual

- Nueva bienvenida responsive con logo integrado, Soy alumno, Soy profesor y Ya tengo cuenta. Las vistas previas existentes siguen disponibles mediante Demo alumno y Demo profesor; Volver al acceso regresa a la bienvenida.
- Alumno: código de prueba ENT-DEMO, confirmación del profesor actual, formulario de nombre, WhatsApp y correo, y vista previa de aprobación pendiente. Un enlace /?profesor=ENT-DEMO abre directamente la confirmación; este es el destino que podrá codificarse en un QR de prueba. Todavía no se generan invitaciones ni QR personales.
- Profesor: selección de plan y formulario. Los precios están por definir; seleccionar no contrata un plan.
- Inicio de sesión y recuperación maquetados. Las contraseñas están deshabilitadas y no se almacenan. El registro solo muestra una previsualización; no modifica los perfiles existentes, no crea cuentas ni envía solicitudes o correos.
- No se modificó el formato ni la clave del guardado local existente.
- Próximo paso: conectar autenticación y base de datos, verificar correo, guardar perfiles, verificar roles en servidor, generar invitaciones seguras con vencimiento y QR, aprobar vinculaciones y habilitar sesiones/recuperación. La interfaz actual no protege datos ni rutas y no debe usarse con datos reales.
- Para publicar esta actualización, subir todos los archivos del ZIP a la raíz del repositorio, incluido access.js. La caché PWA se incrementa a 1.4.0.


## Ajuste 1.4.1 · Bienvenida móvil y planes

- Bienvenida de celular con bloque verde, espacios compactos y pie cercano al contenido. Se conserva la composición de bienvenida de PC.
- Todas las pantallas de acceso respetan safe-area-inset-top/bottom/left/right en iPhone PWA con viewport-fit=cover. La barra de estado queda fuera del contenido. Validación visual en navegador a 320 y 390 px; queda pendiente la comprobación en iPhone instalado real.
- Al elegir Soy profesor aparece un comparador de planes con cupo, descripción, las cuatro funciones actuales y abono mensual. Tres columnas en PC y tarjetas apiladas en celular. El plan seleccionado se resalta en verde; la elección mantiene foco y posición de desplazamiento y se conserva al continuar/volver.
- El agregado diferencial del plan Profesional de 30 alumnos queda pendiente de definición. No se anuncian funciones nuevas ni se fijan precios.
- Actualización visual de la demo. Registro real y cobros continúan pendientes. No se modifica el guardado de alumnos, rutinas, medidas ni historial.
- Subir el contenido completo del ZIP al repositorio, en particular access.js, styles.css, app.js, index.html y sw.js. Caché incrementada a 1.4.1.


## Ajuste 1.4.2 · Entrada animada y distribución móvil

- Entrada escalonada de logo, presentación, tarjetas y accesos inferiores. Termina a los 700 ms; no bloquea botones ni usa animaciones continuas. El símbolo decorativo acompaña la entrada y queda quieto.
- La animación se aplica una sola vez por apertura/recarga de la página; no se repite al navegar hacia atrás o regresar desde la demo. No agrega claves ni registros de almacenamiento.
- Con prefers-reduced-motion: reduce se desactivan todas las animaciones de entrada.
- Bienvenida móvil distribuida en altura: presentación y tarjetas más amplias, accesos cerca del borde inferior y aviso/pie unificados. Se conservan los márgenes seguros de iPhone. Pantallas bajas o contenido ampliado pueden desplazarse normalmente.
- Comprobados navegador a 390 × 844 y 320 × 640, ausencia de desborde horizontal, botones habilitados y regreso sin repetir la entrada. Pendiente prueba en iPhone instalado real.
- Publicar todos los archivos del ZIP. Caché 1.4.2. Sin cambios al historial, planes ni autenticación de demostración.


## Actualización 1.5.0 · Invitar alumno

- Inicio y Alumnos del profesor ahora muestran Invitar alumno. Abren el mismo panel con nombre del profesor, capacidad actual del plan, QR, código ENT-DEMO, copiar código, copiar enlace y compartir por WhatsApp. El alta manual deja de ser la entrada desde estos botones; editar alumnos existentes se conserva.
- El QR se calcula en el navegador con qr.js incluido, sin servicios externos. Codifica la raíz del dominio actual con ?profesor=ENT-DEMO; cambia automáticamente al publicar en Vercel. Mantiene cuatro módulos blancos de margen. No escanear la vista interna de revisión desde otro dispositivo: para probar en un teléfono usar la versión publicada.
- Copiar código/enlace usa el portapapeles y ofrece selección manual si el navegador lo impide. WhatsApp abre un borrador para que el usuario elija a quién enviarlo; no envía automáticamente.
- El panel explica el circuito futuro de solicitud y aprobación, y que el cupo se ocupa al aceptar. Si el profesor ya alcanzó el límite, muestra un aviso.
- Esta versión solo presenta invitaciones de demostración. ENT-DEMO es compartido por esta prueba, no identifica una cuenta verificada. Las solicitudes pendientes, aprobación/rechazo, invitaciones personales y control de cupos del servidor quedan para la conexión de la base. No se crea ni vincula un alumno real con este panel.
- Se conserva todo el guardado local anterior. No hay cambios al historial ni las medidas.
- Verificación: panel revisado visualmente en PC antes de interrumpirse la sesión; pruebas de código de generación SVG, margen, enlace por dominio, borrador WhatsApp, copiado y cupo. La revisión visual móvil y escaneo con cámara real quedan pendientes porque el navegador de prueba bloqueó el acceso al reanudar.
- Subir TODOS los archivos a GitHub, incluidos qr.js y QR-LICENSE.txt. Caché PWA incrementada a 1.5.0.


## Ajuste 1.5.1 · Mensaje para compartir

Se actualiza el borrador de WhatsApp con el saludo personal del profesor, invitación al equipo, enlace precedido por Sumarme al equipo, código y cierre motivador. Conserva saltos de línea y emojis. WhatsApp muestra la URL; no permite convertir el texto del borrador en un enlace con etiqueta distinta. El envío lo confirma el usuario en WhatsApp. Se mantienen los avisos de demostración dentro de la app. La bandeja Alumnos → Solicitudes pendientes, su contador y las aprobaciones reales siguen pendientes de la conexión de cuentas/base. La campanita del profesor continúa reservada a los comunicados del administrador.
