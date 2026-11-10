# Entrenar · V1.9.1 · Supabase

PWA para PC, Android e iPhone. Sitio estático, sin compilación. Conserva el diseño aprobado e incorpora acceso real, datos en Supabase y demos independientes.

## Activar esta versión (en este orden)

1. En el proyecto Supabase de Entrenar, ejecutá **Entrenar_03_Conexion_App.sql** en SQL Editor. Se entrega aparte. Ejecutalo una vez. **No vuelvas a ejecutar los SQL 01 y 02**: ya están aplicados y tu administrador está creado.
2. En Supabase → Authentication → URL Configuration:
   - Site URL: `https://entrenar-ar.vercel.app/`
   - Redirect URLs: `https://entrenar-ar.vercel.app/` y `https://entrenar-ar.vercel.app/?recuperar=1`.
   - Si cambiás el dominio, actualizá ambas direcciones. No hace falta permitir todos los dominios de Vercel.
3. En Authentication → Sign In / Providers → Email, mantené habilitado el acceso por email y la confirmación de correo. La contraseña mínima de la interfaz es de 10 caracteres; configurá también el mínimo en Supabase para que se aplique fuera de la interfaz.
4. Reemplazá los archivos del repositorio GitHub por los de este ZIP. `index.html` debe quedar en la raíz. Vercel: Framework Other, sin build command, output `.`. `vercel.json` ya contiene esa configuración y las cabeceras de seguridad.
5. Esperá a que termine el despliegue. Cerrá y volvé a abrir Entrenar si la PWA tenía una versión anterior. Verificá V1.9.1.
6. En **Ya tengo cuenta**, ingresá con el correo y contraseña del usuario administrador que creaste en Supabase. La app elige el rol desde la base; no hay selector de roles en las cuentas reales.

La URL y la clave publishable están configuradas en `cloud.js`. Es una clave pública para el navegador; las restricciones las aplican Auth, RLS y las funciones de la base. No agregues contraseñas de base, claves secret ni service_role al repositorio. No expongas el esquema `ent_private` en Data API.

## Correo: necesario para abrir registros al público

Antes de invitar personas externas, configurá un proveedor SMTP en Supabase. El servicio predeterminado de Supabase solo envía correos a integrantes del equipo del proyecto y tiene límites para pruebas. Sin SMTP propio, la confirmación de cuentas nuevas, recuperación y cambio de correo de usuarios externos pueden fallar. No desactives la confirmación de correo para evitar este paso.

Tu administrador, creado y confirmado desde el panel, puede probar el ingreso sin esperar esta configuración. Para probar el resto antes del SMTP, el titular puede crear sus propias cuentas de prueba confirmadas en Authentication → Users; al ingresar, completan su perfil. La app no crea cuentas ni envía correos por su cuenta durante las pruebas automatizadas.

Referencias: https://supabase.com/docs/guides/auth/auth-smtp y https://supabase.com/docs/guides/auth/redirect-urls.

## Recorrido real

- Profesor: elige plan, crea cuenta y confirma correo. Completa nombre y WhatsApp. Aparece en **Profesores**, pendiente de activación.
- Administrador: abre la ficha del profesor → **Editar plan y estado** → En prueba o Activo y fecha de vencimiento. No se cobra automáticamente. Puede suspender conservando el historial.
- Profesor activo: **Invitar alumno** genera un código y QR válido por 7 días. Se reutiliza mientras está abierto el mismo acceso; generar otro invalida el anterior. Comparte por WhatsApp o copia el enlace/código.
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
