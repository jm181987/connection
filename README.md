# KNJ Internet Monitor

Extensión Chrome con monitoreo HTTP nominal cada 3 segundos, alertas locales y Telegram opcional.

## Telegram
Abrir extensión → Alertas por Telegram → activar, ingresar token privado y chat ID → Guardar configuración → Enviar mensaje de prueba. El token se almacena localmente en Chrome y NO en el repositorio. Si se corta Internet, no es posible enviar mensajes a Telegram desde la computadora durante la desconexión. Se registra la caída y se envía el aviso pendiente junto al de recuperación al volver Internet. Si el equipo está apagado o Chrome cerrado, no hay supervisión.

## Instalar
Descargar ZIP, descomprimir, abrir chrome://extensions, habilitar Modo desarrollador y Cargar descomprimida. Al actualizar archivos, pulsar Recargar. Las mediciones son HTTP, no ICMP.
