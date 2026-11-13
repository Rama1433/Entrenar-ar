# Mercado Pago · V1.14.0

Incluye Checkout Pro con API de Orders: pago manual de un mes, sin suscripción automática. **El paquete está en modo prueba por defecto.** Guardar credenciales o subir el sitio no activa cobros reales.

## Instalar y probar, en este orden

1. SQL Editor de Supabase: ejecutar `setup/Entrenar_16_Mercado_Pago.sql` completo, después de las migraciones anteriores hasta SQL 15. Debe devolver Success. Este SQL es reejecutable; no vuelve a crear cuentas ni borra historial. No ejecutar de nuevo SQL 01/02.
2. Edge Functions → Secrets: ya guardaste `MP_TEST_ACCESS_TOKEN` y `MP_TEST_WEBHOOK_SECRET`. No hay que copiarlos al código. `MP_ENV` puede omitirse (usa test) o guardarse con valor `test`.
3. Crear la función **mercadopago-checkout** desde el editor de Edge Functions. Reemplazar todo su `index.ts` por `setup/mercadopago-checkout/index.ts`. Desactivar **Verify JWT / Enforce JWT Verification**, porque el código valida internamente el token con Supabase Auth y los permisos de la base. Deploy.
4. Crear **mercadopago-webhook**, reemplazando su `index.ts` por `setup/mercadopago-webhook/index.ts`. Desactivar Verify JWT: Mercado Pago no envía el JWT de Supabase; el código valida la firma HMAC y consulta el pago en su API. Deploy.
5. Confirmar en Mercado Pago que el webhook de **Prueba**, evento **Order (Mercado Pago)**, apunta a `https://tsmgmsiigkdhrwwkbpyj.supabase.co/functions/v1/mercadopago-webhook`. La firma de ese entorno debe coincidir con el secreto guardado.
6. Subir los archivos del sitio a GitHub/Vercel, con index.html en la raíz, como en las actualizaciones anteriores. Cerrar y volver a abrir la PWA. Debe mostrar V1.14.0.
7. Entrar como administrador → Facturación → Mercado Pago → **Probar un pago**. Elegir un profesor que ya exista y escribir el correo de la **cuenta compradora de prueba de Mercado Pago**, no la cuenta real del profesor ni la cuenta vendedora. Si no hay precio en el plan, definirlo primero en Planes y precios.
8. Abrir Mercado Pago y usar la cuenta/tarjeta de prueba del panel de Developers (titular APRO para probar aprobación). Volver a Entrenar o tocar Consultar estado. La orden aparece como Prueba aprobada. No suma facturación real y no cambia el vencimiento del profesor.
9. Reenviar la misma notificación desde MP y comprobar que sigue habiendo una sola orden. Para Simular notificación usar el ID ORDTST de una orden realmente creada; un ID inventado no permite verificar un pago.

Los archivos config.toml de ambas carpetas documentan Verify JWT=false para despliegue por CLI. En Dashboard hay que ajustar ese interruptor manualmente. El archivo index.ts de cada función es autónomo: no requiere subir una carpeta compartida.

## Mes de prueba

Las cuentas nuevas siguen pendientes de revisión. En la primera activación como **En prueba**, la base asigna un mes calendario gratis desde ese día, sin pedir tarjeta. La fecha es inclusiva: del 13 de noviembre al 12 de diciembre, por ejemplo. No se reinicia al cambiar de estado ni al reinstalar. Las cuentas que ya estaban activas o en prueba antes del SQL 16 conservan el vencimiento existente; no se les modifica su período.

Al terminar, se conservan los registros y se limita el acceso como hasta ahora. La renovación por MP, una vez habilitada en producción, agrega un mes calendario desde el día siguiente al vencimiento vigente o desde la fecha actual si ya venció. El precio se obtiene siempre del plan actual en la base; no se recibe del navegador. Para cambiar de plan se mantiene el circuito existente.

## Cobrado, comisión y neto

La API Orders no documenta comisión ni neto como campos directos. Si devuelve la referencia del pago, el servidor consulta /v1/payments/{referencia}, verifica vendedor, moneda, importe y referencia de Entrenar, y obtiene la comisión MP y el neto informado. Si no existe esa referencia o la liquidación no está disponible, muestra **Pendiente de liquidación**; no aplica porcentajes estimados. Consultar estado vuelve a intentar obtener el detalle.

El neto puede diferir de cobrado menos comisión por impuestos/retenciones u otros descuentos. Un pago aprobado no implica que el dinero ya esté disponible para retirar: eso depende del plazo de acreditación de tu cuenta. Las pruebas tienen su propio apartado y no se mezclan con ingresos reales ni con las cuotas que cobran los profesores a sus alumnos.

## Seguridad

- El Access Token y la firma permanecen en secretos del servidor. Nunca en cloud.js, localStorage o GitHub.
- El checkout verifica el JWT con Auth y consulta el rol habilitado en la base. Solo administración crea pruebas; un profesor solo paga su propia cuenta en producción.
- La URL de retorno no activa planes: siempre se consulta la orden de MP y se verifica vendedor, importe, referencia, moneda, entorno y estado acreditado.
- Las notificaciones exigen firma HMAC SHA256; no se aceptan estados o montos del cuerpo como comprobante de pago.
- La base no permite escribir órdenes ni pagos a usuarios. Las funciones internas solo admiten service_role. Precio congelado por intento, UUID idempotente, una orden abierta por profesor y entorno, límite de nuevos intentos.
- Un pago repetido extiende el período una sola vez. Un pendiente no renueva. Una suspensión o cambio de plan durante el pago se marca para revisión; no se rehabilita una cuenta suspendida.
- Reembolsos y contracargos se marcan **Revisar pago** y se conserva el registro original. La revisión y decisión sobre el acceso se hacen manualmente desde administración. No se realizan reembolsos desde Entrenar.

## Producción: una etapa posterior

**No activar todavía.** Primero completar una compra de prueba real con esta instalación y confirmar webhook + historial + reintento. Después se configuran las credenciales y firma de Producción por separado, se revisan los precios y el costo de acreditación de la cuenta, y se cambia MP_ENV a live. La base también exige habilitación explícita de ent_private.mp_settings.live_enabled; el SQL de instalación la deja en false. Ningún botón del sitio puede habilitarla. El usuario debe autorizar esa puesta en marcha antes de aplicarla.

Por ahora el botón del profesor informa que los pagos online aún no están habilitados. La herramienta para comprobar el circuito está en Facturación del administrador.

## Validación de esta entrega

Pruebas locales con PostgreSQL/WASM: permisos anon/alumno/otro profesor/admin, importes, aislamiento de pruebas, mes gratuito único, conservación de vencimientos, renovación e idempotencia. Pruebas HTTP con API simulada: firma, JWT, rol, origen, moneda, vendedor, importes y liquidación. Pruebas DOM de administración/perfil/demos y regresión de acceso. La compra real en sandbox y el despliegue remoto deben completarse con tu cuenta; no fueron ejecutados desde este chat.

Fuentes oficiales consultadas (13/11/2026):
- https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/create-order
- https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/notifications
- https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/web-integration/configure-back-urls
- https://www.mercadopago.com.mx/developers/es/docs/checkout-api-orders/resources/migrate-payments-to-orders
