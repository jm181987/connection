# KNJ Internet Monitor

Monitorea la conectividad HTTP nominalmente cada 3 segundos mientras Chrome está abierto. Confirma la pérdida y la recuperación de conexión con dos mediciones consecutivas, muestra alertas de Chrome solo cuando cambia el estado confirmado y permite activar/desactivar las alertas de calidad. Mantiene el popup cerrado y conserva 100 mediciones locales.

## Instalar
Descargar ZIP del repositorio, descomprimir, abrir chrome://extensions, activar Modo desarrollador y elegir Cargar descomprimida. Habilitar notificaciones de Chrome en Windows.

## Limitaciones
No realiza ping ICMP. La suspensión de Chrome, de la extensión o del equipo puede retrasar las pruebas. Las solicitudes fallidas a los dos servidores de prueba pueden indicar un bloqueo específico y no necesariamente una caída total de Internet. El aviso depende de los permisos de notificación del sistema.
