# PostgreSQL desde la extensión
Versión 1.9.0: en el popup, desplegá **Registro PostgreSQL**, activá el guardado, pegá tu `INGEST_API_KEY` de Vercel (NO la contraseña PostgreSQL), guardá y pulsá **Probar conexión y sincronizar**.

La clave se guarda en `chrome.storage.local` en el perfil de Chrome, no en GitHub. **Advertencia:** el almacenamiento local de una extensión no equivale a un almacén de secretos resistente a accesos locales; una clave compartida entre equipos puede extraerse. Para distribuir la extensión públicamente, reemplazar este método por inscripción y credenciales individuales revocables por dispositivo.

Se encolan las mediciones (hasta 2000) y se envían por lotes de hasta 100 al recuperar conectividad. El monitoreo local sigue funcionando si la API falla. Con 3 segundos entre mediciones, la cola máxima cubre aproximadamente 100 minutos de caída; después se descartan las más antiguas. El endpoint requiere las tablas de `db/schema.sql`. La primera sincronización sin mediciones pendientes puede indicar cero enviadas; esperar una medición y repetir.
