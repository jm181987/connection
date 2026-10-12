# Telegram por cuenta — v2.2.0

1. Ejecutar `db/telegram_migration.sql` como propietario de las tablas.
2. En Vercel crear variable **TELEGRAM_ENCRYPTION_KEY** con 32 bytes aleatorios en hexadecimal (64 caracteres). Generar localmente con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. No subirla a GitHub ni compartirla.
3. Redeploy del proyecto en Vercel y actualizar extensión a 2.2.0.
4. Iniciar sesión, abrir Telegram, introducir token y chat ID y guardar. Para conservar token en cambios posteriores, dejar campo token vacío.
5. La extensión no recibe el token cifrado ni descifrado. El servidor lo descifra solo al enviar a Telegram.

El cifrado AES-256-GCM depende de la clave de Vercel. Guardar copia segura de la clave: perderla impide recuperar tokens cifrados. La configuración antigua de Chrome no se migra automáticamente: introducir el token una vez después de actualizar. No se envían alertas si el navegador está sin conexión; el aviso de caída pendiente se intenta al recuperar conexión.
