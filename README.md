# KNJ Internet Monitor

Extensión para Google Chrome que supervisa la conectividad mediante comprobaciones HTTP periódicas, registra incidencias y permite configurar alertas locales y por Telegram.

## Funcionalidades

- Comprobaciones HTTP nominales cada 3 segundos, sujetas a las restricciones de ejecución de Chrome.
- Detección de interrupciones y recuperación de la conexión.
- Alertas locales y notificaciones opcionales de Telegram.
- Conservación de avisos pendientes durante una caída, para enviarlos cuando vuelve la conectividad.

> **Alcance:** una comprobación HTTP no equivale a un ping ICMP ni a una medición completa de calidad de red. Chrome puede suspender tareas en segundo plano. Si el navegador está cerrado o el equipo apagado, no se realizan mediciones.

## Instalación en Chrome

1. Descarga el código como ZIP desde GitHub y descomprímelo.
2. Abre `chrome://extensions`.
3. Activa **Modo desarrollador**.
4. Selecciona **Cargar descomprimida** y elige la carpeta que contiene `manifest.json`.
5. Para aplicar cambios locales, pulsa **Recargar** en la tarjeta de la extensión.

## Alertas por Telegram

1. Abre la extensión y entra en **Alertas por Telegram**.
2. Activa las notificaciones.
3. Ingresa el token privado del bot y el identificador del chat.
4. Guarda la configuración y usa **Enviar mensaje de prueba**.

El token se almacena localmente en Chrome, no en el repositorio. **No compartas tokens en capturas, issues ni commits.** Durante una desconexión no se pueden enviar mensajes desde el equipo afectado; los avisos pendientes se intentan enviar al recuperar Internet.

## Interpretación de los resultados

- **Conectado:** la comprobación HTTP respondió según los criterios de la extensión.
- **Interrupción:** la comprobación no pudo completarse correctamente.
- **Recuperación:** una nueva comprobación volvió a responder.

Una falla puntual puede deberse al destino de prueba, DNS, proxy o conectividad local. Para diagnosticar la red, contrasta los resultados con otras herramientas.

## Resolución de problemas

- **No se detectan mediciones:** confirma que Chrome esté abierto, la extensión habilitada y que sus permisos sean válidos.
- **No llegan alertas:** verifica el token, el chat ID, la conectividad y el envío de prueba.
- **Cambios sin efecto:** recarga la extensión desde `chrome://extensions`.

## Seguridad y privacidad

No publiques credenciales ni datos de monitoreo asociados a personas. Revisa los permisos de la extensión antes de instalarla y protege los accesos a cualquier servicio externo de almacenamiento.

## Contribuciones

Los reportes de errores deben incluir versión de Chrome, pasos para reproducir, comportamiento observado y registros anonimizados.

---

Desarrollado por **KNJ** · [KNJ Marketing](https://www.marketingknj.site/)

## Validación de versiones

Al modificar el sistema de mediciones, comprueba que las gráficas históricas y los intervalos por hora, día y mes utilicen datos realmente almacenados y que las variaciones de latencia se reflejen de forma coherente. Documenta los permisos de Chrome y cualquier integración externa antes de distribuir la extensión.

Mantenimiento: **KNJ** · [KNJ Marketing](https://www.marketingknj.site/).
