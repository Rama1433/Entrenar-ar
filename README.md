# Entrenar · V1.16.1 · Supabase

**V1.16.1:** guardado/edición con indicador enlazado al formulario; lectura y anuncio de mensajes del alumno persistentes en Supabase (SQL 18 ya aplicado al proyecto conectado). Publicar este ZIP para completar la corrección.

**V1.16.0:** botones con texto y spinner durante operaciones asíncronas, restauración tras errores y consultas independientes en paralelo para reducir las esperas. Solo actualizar archivos en GitHub, sin SQL nuevo.

**V1.15.1:** flotante sutil «Mensaje nuevo» que desaparece en 4 segundos y no vuelve a anunciar mensajes vistos en la sesión.

**V1.15.0:** aviso en Inicio desde 7 días antes del vencimiento, campanita con contador y mensajes del profesor que caducan a las 24 horas. SQL 17 incorpora la limpieza automática (ya aplicada al proyecto conectado). Publicar los archivos de este ZIP en GitHub; no requiere cambiar las funciones de Mercado Pago. Detalles en AVISOS.md.

**V1.14.2:** validación de las dos convenciones documentadas de firma del ID y diagnóstico seguro del webhook; para instalar sobre V1.14.0/1.14.1, actualizar `mercadopago-webhook/index.ts` en Supabase y desplegar. No cambia SQL ni claves.

**V1.14.0:** Mercado Pago Checkout Pro / Orders, pago manual mensual, primer mes gratis para nuevas activaciones y registro de comisión/neto. Modo prueba por defecto, sin activar cobros reales. Ejecutar SQL 16 y desplegar las dos funciones según `MERCADO_PAGO.md`.

**Versión anterior V1.13.0:** ficha del profesor con edad, sexo, último peso y altura del alumno y sus fechas; creación/edición de ejercicios en tres pasos con selección muscular en la figura. Requiere SQL 15 después del 14. No cambia la función exercise-media. Guía: `FICHA_Y_EJERCICIOS.md`. No se aplicó la migración remota desde el chat.

PWA para PC, Android e iPhone. Sitio estático, sin compilación. Conserva el diseño aprobado e incorpora acceso real, datos en Supabase y demos independientes.

## Instalar V1.14.2 sobre tu versión actual

Seguí primero `MERCADO_PAGO.md`: SQL 16, las dos Edge Functions y actualización del sitio. Las instrucciones siguientes son la configuración original del proyecto; no hace falta repetir los pasos ya completados.

## Configuración inicial del proyecto

1. En el proyecto Supabase de Entrenar, con los SQL 01, 02 y 03 ya aplicados, ejecutá **Entrenar_04_Invitaciones_Cortas.sql** en SQL Editor. Se entrega aparte. Si venís de V1.9.2, solo necesitás este SQL 04. **No vuelvas a ejecutar los SQL 01 y 02**: ya están aplicados y tu administrador está creado.
2. En Supabase → Authentication → URL Configuration:
   - Site URL: `https://entrenar-ar.vercel.app/`
   - Redirect URLs: `https://entrenar-ar.vercel.app/` y `https://entrenar-ar.vercel.app/?recuperar=1`.
   - Si cambiás el dominio, actualizá ambas direcciones. No hace falta permitir todos los dominios de Vercel.
3. En Authentication → Sign In / Providers → Email, mantené habilitado el acceso por email y la confirmación de correo. La contraseña mínima de la interfaz es de 10 caracteres; configurá también el mínimo en Supabase para que se aplique fuera de la interfaz.
4. Reemplazá los archivos del repositorio GitHub por los de este ZIP. `index.html` debe quedar en la raíz. Vercel: Framework Other, sin build command, output `.`. `vercel.json` ya contiene esa configuración y las cabeceras de seguridad.
5. Esperá a que termine el despliegue. Cerrá y volvé a abrir Entrenar si la PWA tenía una versión anterior. Verificá V1.14.2.
6. En **Ya tengo cuenta**, ingresá con el correo y contraseña del usuario administrador que creaste en Supabase. La app elige el rol desde la base; no hay selector de roles en las cuentas reales.

La URL y la clave publishable están configuradas en `cloud.js`. Es una clave pública para el navegador; las restricciones las aplican Auth, RLS y las funciones de la base. No agregues contraseñas de base, claves secret ni service_role al repositorio. No expongas el esquema `ent_private` en Data API.

## Correo: necesario para abrir registros al público

Antes de invitar personas externas, configurá un proveedor SMTP en Supabase. El servicio predeterminado de Supabase solo envía correos a integrantes del equipo del proyecto y tiene límites para pruebas. Sin SMTP propio, la confirmación de cuentas nuevas, recuperación y cambio de correo de usuarios externos pueden fallar. No desactives la confirmación de correo para evitar este paso.

Tu administrador, creado y confirmado desde el panel, puede probar el ingreso sin esperar esta configuración. Para probar el resto antes del SMTP, el titular puede crear sus propias cuentas de prueba confirmadas en Authentication → Users; al ingresar, completan su perfil. La app no crea cuentas ni envía correos por su cuenta durante las pruebas automatizadas.

Referencias: https://supabase.com/docs/guides/auth/auth-smtp y https://supabase.com/docs/guides/auth/redirect-urls.

## Recorrido real

- Profesor: elige plan, crea cuenta y confirma correo. Completa nombre y WhatsApp. Aparece en **Profesores**, pendiente de activación.
- Administrador: abre la ficha del profesor → **Editar plan y estado** → En prueba o Activo y fecha de vencimiento. No se cobra automáticamente. Puede suspender conservando el historial.
- Profesor activo: **Invitar alumno** obtiene un código corto y QR válidos por 7 días. La invitación vigente se recupera desde cualquier dispositivo del profesor; si venció, se genera una nueva al abrir el panel. Generar otro manualmente invalida el anterior. Comparte por WhatsApp o copia el enlace/código.
- Alumno: revisa el nombre del profesor, crea y confirma su cuenta (o ingresa si ya tiene cuenta). Completa su perfil. La vinculación queda pendiente.
- Profesor: ve las solicitudes en **Inicio y Alumnos**, y aprueba o rechaza. El cupo se ocupa al aprobar y se controla en la base. Un alumno tiene una sola vinculación pendiente/aprobada a la vez.
- Profesor: crea ejercicios, guarda rutinas completas en una operación y las asigna a sus alumnos aprobados. Puede actualizar objetivo, días y notas de la ficha. El alumno edita su propio nombre y contacto.
- Alumno: consulta rutinas asignadas, registra entrenamientos y medidas. Solo él puede leer sus medidas; tampoco el administrador tiene acceso a ellas.
- Administrador: configura precios, registra pagos manuales con revisión y ve historial por profesor/mes. Los pagos conservan nombres, plan e importe del momento. Se bloquean pagos por cero, períodos superpuestos y reintentos duplicados de una misma operación.
- Comunicados del administrador: solo los profesores seleccionados; no se agregan a los avisos de alumnos. Los avisos del profesor llegan solo a sus alumnos aprobados con vinculación vigente.
- Perfil: permite editar nombre/WhatsApp y solicitar cambio de correo. El cambio se confirma por email y conserva el identificador y el rol de la cuenta.

## Datos, conexión y demos

Las cuentas reales arrancan sin alumnos, ejercicios, rutinas ni pagos de ejemplo. No se importan automáticamente los datos de la demo.

Los registros reales se guardan en Supabase. Los datos cargados permanecen en memoria de la pestaña; no se exportan a la clave local de las demos ni al caché del service worker. Auth conserva su sesión en este navegador para mantener el acceso. Los borradores de entrenamiento y los avisos leídos del alumno usan sessionStorage separado por identificador de usuario; se limpian al salir. El entrenamiento completado se guarda en la base.

La app actualiza al volver a la pestaña y periódicamente; en celulares permite deslizar hacia abajo desde el inicio de la pantalla para actualizar. En PC podés recargar desde el navegador. Los registros reales necesitan Internet. Sin conexión no confirma guardados ni usa la demo como reemplazo. El borrador no se sincroniza entre dispositivos y se pierde si se cierra la pestaña o se sale de la cuenta.

**Demo alumno / Demo profesor** conservan su guardado local anterior. El selector de vistas y las copias JSON corresponden exclusivamente a las demos. Para cambiar de cuenta real usá **Salir**. La navegación no autoriza roles ni restaura datos de otra cuenta.

## Validación de esta entrega

- Comprobación de sintaxis de todos los JS propios.
- PostgreSQL local (PGlite): aislamiento entre dos profesores y tres alumnos, permisos de administrador, restricciones de medidas, cupos, actualización atómica de rutinas, avisos segmentados, pagos e historial inmutable.
- Interfaz y repositorio con Supabase simulado: acceso, invitación, cada rol, errores de guardado, prevención de doble clic, separación de demo y datos reales, historial de navegación y limpieza al salir.
- Navegador: formulario de ingreso/registro y navegación de la demo.

No se ingresó a tu cuenta, no se crearon usuarios remotos ni se aplicó el SQL 03 desde aquí. Quedan por comprobar en tu despliegue el primer ingreso real y la entrega de correos con tu configuración SMTP.

SDK de navegador incluido: @supabase/supabase-js 2.119.0, sin CDN en ejecución. Licencia en SUPABASE-LICENSE.txt. QR local, sin servicio externo; licencia en QR-LICENSE.txt.

## Cambios V1.9.1

- Bienvenida: “Registrarme como alumno”, “Registrarme como profesor” y botón verde grande “Ingresar a mi cuenta”.
- Se quitó el botón Actualizar de la franja de cuenta conectada y de Ajustes.
- Celular: desde arriba de la pantalla, arrastrá hacia abajo y soltá al ver “Soltá para actualizar”. Un indicador muestra la carga y el resultado. Funciona para administrador, profesor y alumno.
- El gesto actualiza los datos sin recargar toda la app. Conserva la pestaña y el avance del entrenamiento. No se activa en formularios, modales, tablas desplazables ni durante un guardado. El gesto lateral para volver se conserva.
- Los botones “Comprobar estado” y “Comprobar activación” se mantienen en las pantallas de espera para que ese paso siga siendo claro y accesible.
- No requiere cambios de SQL ni de configuración de Supabase.

## Cambios V1.9.2

- Celular: Salir pasa al perfil del profesor/alumno; para administrador, a Ajustes tocando su avatar. Conserva la confirmación. En PC se mantiene arriba.
- El saludo recupera el espacio del botón y muestra el nombre con mejor ancho.
- La comprobación inicial de sesión ya no reemplaza la bienvenida recién dibujada ni interrumpe su animación.
- Entrada breve del panel cuando se abre con sesión iniciada o se entra a una demo. Solo una vez por apertura, sin repetirse al navegar ni al actualizar los datos. Respeta la preferencia de reducir movimiento.
- Sin cambios de base de datos ni SQL.

## Cambios V1.9.3 · Invitaciones

- Código de 8 caracteres aleatorios después de ENT-, sin los caracteres 0, 1, O e I para evitar confusiones.
- El panel muestra QR, código, Copiar código, Compartir por WhatsApp y Copiar invitación. Se oculta el campo con el enlace largo.
- Copiar invitación copia el mensaje completo con nombre del profesor, enlace y código. Si el navegador no permite copiar, ofrece el texto para seleccionarlo manualmente.
- La vigencia real y la reutilización se resuelven en Supabase, no con la hora del celular. Abrir el panel no reinicia los 7 días de una invitación todavía vigente. Después de vencer se genera otra al abrir el panel, sin tareas programadas ni cargos.
- Generar otro código pide confirmación dentro de la app; invalida el QR/código anteriores y conserva los alumnos y solicitudes ya recibidas.
- Los códigos anteriores de 32 caracteres siguen funcionando hasta su vencimiento o hasta que el profesor obtenga la primera invitación corta. Ese cambio no altera las vinculaciones existentes.
- El SQL 04 agrega el código compartible en la tabla privada de invitaciones para recuperarlo desde otros dispositivos. Ningún cliente tiene SELECT sobre esa tabla; la función solo devuelve la invitación del profesor autenticado con plan vigente. El código no inicia sesión ni permite consultar datos de alumnos.
- Se mantiene oculta la franja Cuenta conectada, conforme al ajuste solicitado.
- Aplicar SQL 04 antes de publicar este ZIP. No repetir SQL 01, 02 ni 03 si ya están aplicados.

## Cambios V1.9.4 · Panel de invitación mínimo

- Solo QR, código de vinculación, Copiar código y Compartir por WhatsApp, tanto en cuenta real como en demo.
- Se quitaron Copiar enlace/Copiar invitación, el campo con la dirección y los bloques adicionales del panel.
- La validez de 7 días y la renovación al abrir el panel después de vencer siguen funcionando en la base.
- La regla `.cloud-live .demo-strip { display: none; }` está al final de styles.css.
- No requiere otro SQL: se mantiene el SQL 04 de la versión anterior.

## Cambios V1.9.5

- QR centrado dentro de su tarjeta, limitado al ancho disponible en PC y celular.
- Administrador: Salir visible en la cabecera también en celular; el avatar abre Mi cuenta y mantiene su salida con confirmación. Profesor/alumno mantienen Salir en Perfil en celular.
- Las demos solo permiten alternar entre Profesor y Alumno. Se quita Administrador del selector y se descartan las restauraciones de antiguas demos de administrador. El administrador real sigue accediendo mediante Auth y el rol de la base.
- Los cambios de las demos se guardan únicamente en la clave local del navegador, sin escrituras en Supabase. Los datos públicos de planes e invitaciones del registro se consultan por separado.
- Sin SQL adicional. Se mantiene al final de styles.css la regla que oculta la franja de cuenta conectada.

## Cambios V1.9.6

- Confirmación después del correo: conserva el perfil Profesor/Alumno elegido al registrarse. El envío toma el rol de la cuenta verificada, no un selector editable.
- El alumno no ve planes de profesor. Para cuentas antiguas sin un rol solicitado se conserva la elección inicial de perfil.
- Profesor: Ver planes y beneficios despliega Inicial, Profesional y Equipo, con cupos, beneficios y precios configurados. Elegir un plan conserva nombre y WhatsApp. No realiza cobros.
- Sin migraciones SQL nuevas. No modifica roles ya asignados, cuentas ni historial.

## Cambios V1.9.7

- Se elimina el desplegable de plan al completar la cuenta. Ver planes y beneficios es el único acceso para elegir otro plan; se conserva el resumen del plan elegido. Sin SQL nuevo.

## Cambios V1.9.8

- Mensajes de revisión de cuenta y equipo de Entrenar para alumnos/profesores, sin referencias al administrador. Estados de vencimiento o suspensión conservados.
- Agregá Entrenar a tu pantalla de inicio en confirmación de correo, finalización del registro y cuentas pendientes de ambos roles. Usa la instalación nativa cuando el navegador la ofrece; instrucciones para iPhone/iPad, Android o PC en los demás casos. No instala sin confirmación del usuario.
- La ayuda aparece dentro de la pantalla sin perder datos del registro. Se oculta si se detecta la app instalada. Sin SQL nuevo.

## Cambios V1.9.9

- Ejercicios: solo enlaces HTTPS de YouTube con ruta /shorts/ e identificador de video de 11 caracteres. Acepta youtube.com, www.youtube.com y m.youtube.com; normaliza al dominio www y elimina parámetros de compartir. El enlace sigue siendo opcional.
- Videos comunes, youtu.be, archivos y otras plataformas se rechazan tanto en demo como en cuenta real. La app no transforma enlaces comunes en Shorts.
- Aplicar Entrenar_05_Solo_Shorts.sql en Supabase antes de publicar. Agrega un CHECK para futuras altas/actualizaciones sin borrar enlaces históricos. Los ejercicios antiguos con enlaces distintos requieren reemplazarlos o quitarlos al editar.
- Se valida el formato de la dirección, no la existencia, clasificación, contenido ni duración real del video en YouTube. Verificar eso requiere un servicio adicional. No hay carga de archivos ni consumo de Supabase Storage.

## Cambios V1.9.10

- Ver técnica en la rutina y Ver video en Ejercicios abren el reproductor oficial de YouTube en un diálogo adaptable dentro de Entrenar. El video se carga solo al tocar el botón.
- Cerrar/Volver al ejercicio/Escape destruyen el iframe para detener la reproducción. No se modifica la rutina, sus registros ni el temporizador.
- Se mantiene a la vista Abrir en YouTube como alternativa para videos restringidos, privados o no disponibles y problemas de conexión. La app no detecta automáticamente restricciones dentro del reproductor de otro dominio.
- CSP permite únicamente el dominio www.youtube.com para frames y mantiene los demás permisos; el iframe envía la referencia de origen requerida. No se agregan scripts externos ni claves.
- Sin SQL nuevo; conservar aplicado el SQL 05 de Shorts de la versión anterior. Se sigue almacenando únicamente el enlace.

## Cambios V1.9.11

- Alumno: los ejercicios pendientes quedan primero; los completados pasan a un bloque desplegable inferior. Al completar o volver a pendiente se enfoca el ejercicio correspondiente con desplazamiento suave y animación (respeta movimiento reducido).
- Descanso: panel visible al desplazarse, anillo de progreso y animación, texto de estado, sonido opcional al llegar a cero. El sonido se prepara con la pulsación de Descansar; depende de volumen, permisos y de que el navegador mantenga la app activa. No se garantiza sonido con pantalla bloqueada o en segundo plano.
- Tiempo de entrenamiento: desde Comenzar hasta marcar el último ejercicio; incluye descansos y tiempo fuera de la pantalla. Se congela al completar y se conserva ante un error al guardar. Volver un ejercicio a pendiente reanuda el conteo desde el comienzo original. Sesiones antiguas sin tiempo siguen sin duración. Los borradores antiguos cuentan desde que se retoman.
- Aplicar Entrenar_06_Duracion_Entrenamiento.sql antes de subir este ZIP. Guarda un entero de segundos por sesión. No agrega archivos ni historial de ticks a la base, ni modifica permisos.

## Cambios V1.9.12

- El tiempo total se calcula en silencio, sin cronómetro visible durante la rutina. Al marcar el último ejercicio aparece una felicitación con la duración. Ver resumen permite volver a abrirla; no dice que la sesión esté guardada antes de confirmarlo.
- Al llegar a cero, el descanso emite una alarma de tres tonos cada 1,3 segundos hasta tocar Detener o desactivar el sonido. También se detiene al iniciar otro descanso, finalizar la rutina o salir de la pantalla. Se conserva la limitación de sonido en segundo plano/pantalla bloqueada.
- Sin SQL nuevo. Se mantiene el SQL 06 de duración y su historial.

## Cambios V1.9.13

- Campana elegida como sonido de descanso para todos los alumnos, tanto en demo como en cuentas reales.
- Se repite hasta Detener o desactivar sonido; se corta al salir de la rutina.
- Audio incluido y precargado en la PWA. No requiere SQL ni ocupa espacio en Supabase.

## Cambios V1.9.14

- Campana integrada dentro del código: no depende de un MP3 externo ni de una carpeta adicional.
- Se conserva exactamente el audio elegido y la repetición hasta Detener.
- Desbloqueo del audio durante el toque en Descansar para compatibilidad móvil.
- Sin cambios en la base de datos.

## Cambios V1.9.15

- Historial de entrenamientos: últimos 5 registros, con Ver más para mostrar otros 5 cada vez.
- Más recientes primero; contador de registros visibles; aplicado en Progreso, recorrido y ficha del alumno.
- Se conserva el historial completo y las métricas totales. Sin cambios en Supabase.

## Cambios V1.9.16

- Siluetas propias de frente y espalda con músculos principales y secundarios.
- Panel junto al Short en PC y debajo en celular, más botón Músculos para ejercicios sin video.
- Catálogo inicial de seis ejercicios, con referencias en MUSCULOS.md.
- Selección editable por el profesor en ejercicios nuevos y existentes.
- SQL 07 incluido en setup/: campos opcionales con validación y permisos existentes.
- Conserva la campana integrada, los tiempos de rutina y el historial con Ver más.

## Cambios V1.9.17

- Figuras anatómicas masculina y femenina, de frente y espalda, con licencia MIT incluida.
- Sexo opcional al registrarse como alumno, completar la cuenta y editar el perfil. Símbolos con selección rosa o celeste suave; opción de quitar selección.
- Preferencia asociada a la cuenta propia en Supabase Auth. Sin nuevo SQL y sin incluirla en las fichas para profesores o administradores.
- La elección cambia la figura y conserva los mismos músculos y rutinas.
- Ver FIGURAS.md para los detalles y la procedencia de las ilustraciones.

## Cambios V1.9.18

- SQL 08 incluye el campo de duración del SQL 06, que impedía guardar cuando faltaba la migración.
- No se solicita una nueva vinculación automáticamente al ingresar con una cuenta inactiva.
- Las solicitudes explícitas al mismo profesor reutilizan la ficha inactiva y requieren aprobación.
- Una sola ficha visible por alumno, priorizando la vinculación aprobada, luego pendiente y luego inactiva. Las filas históricas de Supabase se conservan.
- Reactivación compatible con vinculaciones anteriores del mismo equipo; sigue respetando cupos y el bloqueo si hay otro profesor.
- Se corrige la etiqueta de alumno sin objetivo, que aparecía como Profesor.
- Se conserva la observación, duración y operación del entrenamiento al reintentar un guardado fallido.

## Cambios V1.9.19

- Plantillas de Entrenar y Mis rutinas, con vista previa y copias editables.
- Nuevo editor con biblioteca, búsqueda, filtros, reordenamiento y copia de valores.
- Duplicar rutina y asignar a varios alumnos al guardar.
- Biblioteca de ejercicios en filas compactas y catálogo inicial listo para adaptar.
- SQL 09: guardado atómico, control de propiedad/equipo e ID estable para reintentos.
- Texto redundante del descanso oculto visualmente; anuncio accesible conservado.
- Invitación de WhatsApp con puntos de código y enlace UTF-8 normalizado.
- Ver RUTINAS.md para el alcance y el uso.


## Cambios V1.9.20

- Administrador → Catálogo: crear y editar ejercicios y plantillas, con borrador/publicado/archivado. Solo el contenido publicado se ofrece a profesores. Incluye las seis referencias de ejercicios y cuatro plantillas iniciales.
- Un profesor sigue guardando sus propias copias. Los cambios del catálogo no alteran ejercicios, rutinas, asignaciones ni sesiones existentes. Las copias nuevas conservan el Short y las indicaciones.
- Para archivar un ejercicio usado por una plantilla publicada, primero retirarlo de esa plantilla o archivarla.
- Datos de contacto: correo sin espacios y en minúscula; WhatsApp admite formato con espacios, paréntesis y guiones y se guarda con + y código de país. No se adivina el país. Revisar números antiguos que no incluyan código de país.
- La ficha administrativa refresca datos al abrirse, muestra el número completo y ofrece un enlace a WhatsApp. También se unifican los enlaces de contacto de los perfiles.
- SQL 10 reejecutable, RLS en las dos nuevas tablas, escritura exclusiva mediante funciones que verifican al administrador. No permite gestionar el catálogo desde demos.

### Habilitar este cambio

1. Con SQL 09 ya aplicado, abrir `setup/Entrenar_10_Catalogo_y_Contactos.sql`, copiar solo el SQL completo y ejecutarlo en Supabase → SQL Editor.
2. Subir todos los archivos de este ZIP a GitHub, conservando `index.html` en la raíz del proyecto. Vercel desplegará la actualización.
3. Cerrar y volver a abrir la PWA; verificar V1.9.20. Entrar como administrador → Catálogo. Los próximos contenidos se cargan desde la app sin volver a editar código.

Validado localmente con interfaz y Supabase simulado, PostgreSQL con RLS y vistas PC/móvil. El SQL no se ejecutó en tu Supabase ni se desplegó automáticamente esta versión.


## Cambios V1.9.21

- WhatsApp argentino: prefijo +54 fijo y 10 dígitos nacionales (código de área más número, sin 0 ni 15). Se guarda como +549 más esos 10 dígitos. Admite pegar un número completo con +54/+549/0054 y separadores válidos. Los números inválidos se rechazan; no se recortan silenciosamente. Los contactos internacionales explícitos ya existentes se conservan.
- La validación también se aplica a completar cuenta y editar perfil en las funciones de Supabase. El SQL no cambia teléfonos antiguos: al editar se revisa el formato.
- Actualización automática para administrador, profesor y alumno. Una señal privada por cuenta avisa de cambios relevantes (vinculaciones, asignaciones, rutinas, mensajes, suscripción, contactos, etc.). El cliente agrupa avisos cercanos, consulta con los permisos de su cuenta y actualiza datos sin recargar la página.
- Si hay un modal, un campo enfocado o una rutina del alumno abierta, la actualización automática se posterga hasta liberar la pantalla. Las respuestas que llegan mientras empezás a editar también se postergan. No pierde notas, avance ni temporizador.
- Se desconecta el canal al ocultar/cerrar la app o salir de la cuenta y se reconecta al volver. Al recuperar conexión o regresar a la app se comprueban cambios. Mientras la app está visible, una comprobación de respaldo cada dos minutos consulta solo una fila de revisión; descarga el resto si cambió. Sin SQL 11 se conserva un respaldo periódico, pero para tiempo real es necesario aplicarlo.
- Solo `ent_sync_signals` se agrega a la publicación `supabase_realtime`. Tiene RLS por cuenta, lectura propia y ninguna escritura directa para usuarios. No envía nombres, teléfonos, alumnos, rutinas ni mensajes por el canal. Las señales se deduplican por cuenta y transacción. Las demos siguen aisladas.
- Consumo: utiliza una conexión por sesión visible y mensajes según los cambios; no es consumo cero. No requiere contratar un proveedor adicional. Consultar el uso real de Realtime en Supabase al crecer. No consulta todas las tablas cada minuto como antes.

### Activar V1.9.21

1. Con SQL 10 ya aplicado, ejecutar el SQL completo de `setup/Entrenar_11_Telefonos_y_Actualizacion.sql` en Supabase → SQL Editor.
2. Subir todos los archivos del ZIP a GitHub (index.html en la raíz). Esperar el despliegue de Vercel y reabrir la PWA.
3. Verificar V1.9.21. Probar con dos sesiones diferentes: modificar el teléfono del profesor y comprobar su ficha en administrador; aprobar una vinculación y comprobar la vista del alumno, sin recargar.

Validación local: PostgreSQL con RLS y triggers, cliente Supabase simulado y revisión visual PC/móvil. Los avisos WebSocket reales entre dispositivos deben comprobarse luego de ejecutar el SQL y desplegar; no se aplicó esta migración ni se publicó automáticamente la versión.


## Cambios V1.10.0 · Planes y gestión Profesional

- Inicial se muestra como **Base**, conserva su identificador `inicial`, cupo de 10 y todas las funciones previas. No altera pagos ni suscripciones existentes.
- Profesional: 30 alumnos, cuotas y cobros, planificación de hasta 12 semanas, seguimiento de alumnos sin registros recientes, nombre y logo del equipo y exportación CSV para Excel.
- Equipo figura como **Próximamente**, con prestaciones futuras de varios profesores, biblioteca compartida y panel general. No se ofrece para altas nuevas. Las suscripciones Equipo ya existentes se conservan; esta versión no incorpora varios profesores ni reservas de clases.
- Se accede a **Gestión** desde el menú de PC o desde el perfil del profesor en celular; la barra móvil mantiene sus cuatro accesos.
- Los cobros de alumnos están en tablas independientes de la facturación de Entrenar. Solo su profesor los puede leer: no se muestran a alumnos ni al administrador de la plataforma.
- Configurar cuota define el precio de futuras cuotas. **Generar cuotas del mes** guarda importes y vencimientos sin modificar cuotas existentes, incluso si después cambia el precio. No genera cargos automáticos. Permite pagos parciales, anulación con motivo e historial, y recordatorios preparados para enviar manualmente por WhatsApp.
- La planificación semanal referencia rutinas guardadas. Cada semana son 7 días desde el inicio; el alumno accede a las rutinas vigentes. Las asignaciones manuales no cambian. Guardar otra planificación del mismo alumno archiva la anterior y conserva su historial. Duplicar la selección de una semana no crea variantes nuevas de las rutinas: para ajustar cargas, duplicar y adaptar la rutina desde Rutinas.
- Las alertas se basan en entrenamientos registrados, con un umbral de 7 días. No se presentan como comprobación de asistencia real. Las cuentas recién vinculadas no generan avisos durante su primera semana salvo que tengan una fecha previa de registro.
- Logo opcional PNG/JPG/WebP de hasta 5 MB de entrada, reducido localmente a 128×128 y guardado como un único PNG pequeño por profesor; nombre del emprendimiento de hasta 80 caracteres. Se mantiene el logo de Entrenar.
- Validación del plan y del equipo en las funciones SQL; escritura directa bloqueada con RLS. Si se baja a Base, los registros financieros propios siguen disponibles para consultar; no permite crear o modificar nuevos registros Profesional. Las planificaciones ya guardadas mantienen su comportamiento.
- Las nuevas tablas usan las señales privadas de SQL 11. Los movimientos de cobros no notifican a alumnos ni al administrador. Los datos de cobros no se publican en Realtime.

### Activar y probar

1. Con SQL 11 aplicado, ejecutar completo `setup/Entrenar_12_Plan_Profesional.sql` en Supabase → SQL Editor.
2. Subir todo el ZIP actualizado a GitHub y esperar el despliegue de Vercel. Reabrir la PWA y verificar V1.10.0.
3. Como administrador, seleccionar un profesor → Editar plan y estado → Profesional y una vigencia válida. No realiza un cobro automático.
4. Como profesor, abrir Perfil → Abrir herramientas. En Cuotas y cobros, configurar el importe de un alumno, generar sus cuotas del mes y registrar un pago recibido. En Planificación, elegir alumno, inicio y rutinas de cada semana.
5. En demos, abrir Gestión y tocar Probar Profesional en demo: funciona con almacenamiento local aislado y sin escrituras en Supabase.

Guía detallada en `PROFESIONAL.md`. Verificado localmente en PostgreSQL con RLS, cliente simulado y vistas PC/móvil; falta validar la migración y el recorrido real entre cuentas después del despliegue. No se aplicó SQL ni se desplegó remotamente desde este chat.


## Cambios V1.10.1

Barra móvil del profesor: Inicio, Alumnos, Rutinas, Ejercicios y Gestión. Cinco columnas adaptadas al ancho disponible, con área táctil y safe area inferior. Gestión permanece marcado al navegar por Cuotas y cobros, Planificación y Seguimiento. El acceso desde el perfil también se conserva. Sin migraciones ni cambios de datos.


## Cambios V1.10.2

- Cobros: mes y año en desplegables independientes, evitando el ancho mínimo y zoom del selector de mes en iPhone. Botones ajustados a dos columnas y exportación en fila completa en móvil.
- Identidad del equipo: tarjeta con márgenes interiores y separación de título, logo, descripción y botón. Controles de archivo, fechas, meses y formularios limitados al ancho del modal, con texto legible en celular.
- Todos los campos de dinero del administrador y profesor muestran miles con punto y decimales con coma mientras se escribe. Ejemplos: 10.000 y 10.000,50. Admite pegar esos formatos o un valor numérico con punto decimal sin miles, como 10000.50.
- Edición con cursor, selección, retroceso y Delete; se preservan los centavos. En los formularios existentes, los importes también aparecen formateados al abrirlos.
- Los cálculos siguen usando centavos enteros y los mismos límites de importe. No cambia cuotas generadas, registros de pagos, suscripciones, exportación CSV ni datos históricos. No afecta peso, altura, cargas, repeticiones ni teléfonos.
- Validado localmente con los cuatro formularios monetarios (precio de plan, pago a Entrenar, cuota de alumno y pago de alumno), los valores enviados por RPC y revisión móvil a 320/390 píxeles. La comprobación visual se realizó en Chromium; conviene repetir el recorrido del video en el iPhone real luego del despliegue.


## Cambios V1.11.0

Ver `AVISOS_DESCANSO.md`: Wake Lock opcional, suscripción Web Push por alumno/dispositivo, programación segura en servidor, cancelación al detener/terminar/salir y envío por Cron + Edge Function. La campana original se conserva. La notificación externa puede demorar y su sonido depende del celular. En iPhone se debe abrir la PWA instalada y aceptar las notificaciones. SQL y función incluidos; no desplegados remotamente.


## Cambios V1.12.0

Demostración propia por ejercicio con cámara de siete segundos, vista previa, galería limitada, subida al guardar y reproducción en loop sin sonido. Bucket privado con acceso por profesor y asignación del alumno, inspección real del archivo en servidor y límites de almacenamiento. Se conserva YouTube Shorts.

Edad, peso y altura opcionales en alta, confirmación y perfil del alumno. Los cambios de medidas alimentan Mi progreso, sin duplicar la fecha ni compartir el historial con el profesor o administrador. Ver guía `VIDEOS_Y_PERFIL.md` para límites, seguridad, consumo y activación.


## Cambios V1.12.1

Selección de videos: errores visibles junto al archivo y bloqueo del guardado mientras haya una selección inválida. Botón Descartar selección para continuar sin un nuevo video, conservando la demostración ya guardada. Un archivo válido muestra duración y tamaño. Una validación anterior no puede reemplazar el resultado de una selección más reciente. No cambia SQL 14 ni la función exercise-media; basta actualizar los archivos de la app.


## Cambios V1.14.2

Ficha del alumno: resumen actual de edad, sexo, peso y altura para su profesor activo, con fechas por medida, consulta restringida y señales de actualización privadas. Creación/edición de ejercicios: Datos → Músculos → Video e indicaciones, figura interactiva, regreso entre etapas sin pérdida de datos y guardado final único. Requiere SQL 15; ver `FICHA_Y_EJERCICIOS.md`.
