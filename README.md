# KNJ Internet Monitor

Monitor HTTP automático cada 3 segundos desde un documento offscreen independiente del panel. Guarda 100 mediciones, muestra hora de la última prueba y envía notificaciones de cambios de conectividad confirmados por dos pruebas. El service worker recibe los resultados para gestionar icono y notificaciones.

Instalación: descargar ZIP, descomprimir, chrome://extensions, Modo desarrollador, Cargar descomprimida. Tras actualizar archivos, pulsar Recargar. Mantener Chrome abierto y permitir notificaciones.

Si aparece «Monitor sin actividad», abrir Errores en chrome://extensions. Chrome puede suspender procesos o temporizadores y no garantiza 3 segundos exactos. Las mediciones son HTTP, no ping ICMP.
