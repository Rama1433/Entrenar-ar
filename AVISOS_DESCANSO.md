# Descansos fuera de la app · V1.11.0

Esta versión incorpora dos opciones en Alumno → Mi perfil → Durante mi entrenamiento:

- **Mantener pantalla encendida:** evita el bloqueo automático mientras la rutina está abierta, si el navegador y el celular lo permiten. Se libera al salir de la rutina, completar todos los ejercicios, ocultar la app o cerrar sesión. No impide bloquear el celular con el botón físico. Puede dejar de estar disponible con ahorro de batería.
- **Avisos de descanso:** una notificación opcional del sistema al finalizar un descanso cuando Entrenar está en segundo plano o el celular está bloqueado. Requiere habilitar el servidor siguiendo los pasos de abajo. En primer plano se conserva la campana actual hasta tocar Detener.

**Estado de esta entrega:** código preparado y verificado localmente. El SQL y la función no se han aplicado a tu proyecto remoto. Subir solo los archivos a GitHub habilita la opción de pantalla encendida; los avisos necesitan los pasos 2 a 4.

## Activación, una sola vez

1. Subí el contenido actualizado del ZIP al repositorio de Entrenar y esperá el despliegue de Vercel. Cerrá y abrí la PWA. El pie debe mostrar **V1.11.0**.
2. En tu proyecto de Supabase, abrí **SQL Editor → New query**. Con SQL 12 ya aplicado, copiá y ejecutá **todo el contenido** de `setup/Entrenar_13_Avisos_Descanso.sql`. No copies este documento Markdown. Si indica que falta pg_cron, activá Cron en Integrations y repetí el SQL completo.
3. En Supabase → **Edge Functions → Deploy a new function → Via Editor**, creá una función llamada exactamente **rest-reminders**. Reemplazá el ejemplo de `index.ts` por todo el contenido de `setup/rest-reminders/index.ts` y desplegala. En la configuración de **esa función**, desactivá **Verify JWT / Enforce JWT verification**. La función ya valida explícitamente la sesión del administrador para habilitar el servicio, y un secreto privado para despachar los avisos. Ninguna otra función debe cambiarse.
4. Entrá a Entrenar con tu cuenta de administrador → **Mi cuenta → Habilitar avisos de descanso**. Debe decir **Avisos habilitados**. Esto genera las claves en el servidor y las conserva en un esquema privado. No tenés que copiar claves privadas, crear otro proveedor ni agregar secretos a GitHub o Vercel.

La función utiliza las variables de entorno predeterminadas del proyecto Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Nunca se envían al navegador. Está configurada para el proyecto actual y el origen `https://entrenar-ar.vercel.app`; si cambiás de dominio o de proyecto habrá que ajustar el origen y la URL de envío del SQL.

Si preferís CLI: poner `index.ts` en `supabase/functions/rest-reminders/index.ts`, agregar la sección del `config.toml` incluido a `supabase/config.toml` y desplegar `rest-reminders` con verificación de JWT desactivada. La validación interna es obligatoria y ya viene implementada.

## Activación por alumno/dispositivo

1. En iPhone/iPad: agregar Entrenar a la pantalla de inicio desde Compartir → Agregar a inicio y abrirla desde su ícono. Se necesita una versión compatible con Web Push (iOS/iPadOS 16.4 o posterior).
2. Ingresar como alumno con vinculación aprobada y profesor con plan vigente.
3. Abrir **Mi perfil → Durante mi entrenamiento → Activar avisos**, y aceptar el permiso del sistema. El permiso se pide únicamente al tocar ese botón.
4. Iniciar un descanso, cambiar de app o bloquear la pantalla y esperar el aviso. Se puede desactivar desde el mismo perfil o desde los ajustes del celular.

Los permisos son independientes para cada navegador/dispositivo; no se activan automáticamente en todos los teléfonos de una cuenta. Hasta cinco dispositivos por alumno. Las demos no crean suscripciones ni descansos en Supabase; sí pueden probar la pantalla encendida.

## Qué esperar

- Es un **aviso de respaldo**, no un despertador exacto. Se despacha normalmente unos segundos después de cero; conexión, ahorro de batería, permisos, modo silencio y Enfoque/No molestar pueden demorarlo o silenciarlo.
- El sonido con la app bloqueada lo controla el sistema operativo. No permite elegir la campana MP3 de Entrenar ni reproducirla continuamente hasta detenerla.
- La campana habitual se conserva con la rutina abierta. El envío remoto tiene un margen de tres segundos para que la app visible lo cancele y evite avisos duplicados. Si la notificación ya salió, puede llegar aunque inmediatamente después se toque Detener.
- Tocando el aviso se vuelve a Entrenar. Si la ventana sigue abierta, se enfoca esa ventana. Si estaba cerrada, se abre la app: puede pedir iniciar sesión y volver a Mi rutina; no saltea el acceso ni guarda datos del ejercicio dentro del aviso.
- Detener, iniciar otro descanso, completar la rutina o cerrar sesión cancela los avisos pendientes de ese dispositivo. Al cerrar sesión también se desactiva su suscripción. Si se cierra sesión sin conexión, la cancelación remota puede no llegar; se intenta revocar también la suscripción local y el aviso pendiente caduca pronto.
- Si no hay conexión al iniciar el descanso, el reloj y la campana local siguen funcionando, pero se muestra que no pudo programarse el aviso externo. No se promete un aviso remoto que no se pudo guardar.

## Datos, consumo y seguridad

No se guardan videos, grabaciones ni archivos de audio nuevos en Supabase. Se guarda una suscripción técnica por dispositivo y un registro pequeño por descanso programado. No se incluye nombre, rutina, peso, correo ni datos del profesor en la notificación.

Cron revisa cada cinco segundos **solo mientras hay descansos pendientes** y se pausa cuando no quedan. Solo invoca la función cuando hay avisos para enviar; los envíos se agrupan en lotes de hasta veinte. Consume consultas, almacenamiento e invocaciones dentro de tu proyecto Supabase: no debe considerarse costo cero ni consumo ilimitado. No se añadió un proveedor de pago separado. Los registros técnicos de más de siete días y los dispositivos desactivados antiguos se limpian cuando el servicio procesa nuevos avisos; los entrenamientos y los pagos no se borran.

Las tablas de dispositivos y avisos tienen RLS y no permiten lectura/escritura directa desde la app. Las operaciones verifican al alumno, su vinculación activa y el dispositivo propio. Las claves VAPID privadas y el secreto del despachador están en `ent_private`; las funciones que acceden a ellos solo pueden ejecutarse desde el servidor. El único dato de configuración que obtiene el navegador es la clave pública de suscripción.

## Verificación pendiente en producción

Se probaron localmente la autorización por roles, separación de cuentas, cancelaciones, límites de dispositivos/descansos, reintentos, arrendamientos del trabajador, caducidad, pausa de Cron y el recorrido de permisos y cierre de sesión. El envío real vía Apple/Google/Mozilla y el comportamiento con pantalla bloqueada deben probarse en el dispositivo después de desplegar la función y aplicar el SQL. No se simula una entrega real en un iPhone desde el chat.

Referencias técnicas:
- https://supabase.com/docs/guides/cron/quickstart
- https://supabase.com/docs/guides/functions/secrets
- https://developer.apple.com/videos/play/wwdc2023/10120/
- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
