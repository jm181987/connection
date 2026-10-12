# KNJ Internet Monitor

Monitor HTTP cada 3 segundos con documento offscreen de Chrome Manifest V3. El popup puede permanecer cerrado. Las mediciones se guardan localmente (últimas 100) y las alertas solo aparecen al cambiar la calidad o caer/recuperar conexión.

## Instalar
Descargar el repositorio como ZIP, descomprimir, abrir chrome://extensions, activar Modo desarrollador y pulsar Cargar descomprimida.

## Limitaciones
No es ping ICMP. Chrome debe permanecer abierto y no suspender la extensión o el sistema; el intervalo de 3 segundos es nominal y puede variar por suspensión o carga. Las pruebas pueden tardar hasta 5 segundos si ambos servidores fallan, por lo que no se solapan. Si no hay Internet, la notificación local puede aparecer aunque el sistema esté desconectado. Los permisos de notificación del sistema deben estar habilitados.
