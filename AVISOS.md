# Avisos y renovación · 1.16.1

- Inicio del profesor: recordatorio desde 7 días antes del vencimiento; distingue prueba gratuita y plan pago. Usa fecha de Argentina. El botón abre el perfil y nunca inicia un cobro automáticamente.
- Campanita con contador de mensajes sin leer. Aviso flotante sutil «Mensaje nuevo» durante 4 segundos, una sola vez por mensaje. Para alumnos, anuncio y lectura se recuerdan en Supabase al cerrar/reabrir la app o cambiar de dispositivo (SQL 18). Para profesores, el anuncio sigue guardado por sesión; el marcado explícito de lectura se conserva en su cuenta. No se muestra para mensajes leídos ni al abrir la bandeja. Abrir Avisos del alumno marca como leído.
- Mensajes del profesor a alumnos: disponibles 24 horas desde el envío, leídos o no. Los comunicados de Entrenar a profesores mantienen su comportamiento.
- SQL 17 restringe la lectura de avisos caducados y limpia hasta 1000 cada 5 minutos. Requiere pg_cron (ya habilitado con SQL 13). No requiere Edge Functions nuevas.
- Los mensajes anteriores a esta actualización también caducan según su fecha original.
- Subir el contenido del ZIP a GitHub para publicar el frontend. Si SQL 17 ya se aplicó por la conexión de Supabase, no hace falta ejecutarlo otra vez.

SQL 18: tabla privada por RLS de estados de aviso por alumno. No guarda copias del texto y se limpia por cascada cuando caduca el aviso. Ya aplicado al proyecto conectado.
