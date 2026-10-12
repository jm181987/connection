# KNJ Internet Monitor

Extensión Chrome Manifest V3. Monitoreo HTTP cada minuto hasta desactivarlo; sigue funcionando con el popup cerrado mientras Chrome esté en ejecución. Avisos del sistema solo al cambiar el estado o calidad, con interruptores independientes. Icono KNJ, indicador de latencia y hasta 100 mediciones guardadas localmente.

## Instalar
Descargar ZIP del repositorio, descomprimir, abrir chrome://extensions, activar Modo desarrollador y elegir Cargar descomprimida.

**Importante:** mide tiempo de respuesta HTTP, no ICMP ni velocidad de descarga. Si Chrome está cerrado o suspendido no puede medir ni notificar. Las notificaciones requieren que el sistema operativo permita notificaciones de Chrome. Los umbrales orientativos son buena <150 ms, regular 150–399 ms, mala >=400 ms. Los bloqueos de los servidores de prueba pueden causar falsas alarmas.
