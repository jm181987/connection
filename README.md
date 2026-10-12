# Internet Ping Test

Extensión Chrome Manifest V3 para comprobar conectividad y latencia mediante peticiones HTTP (no ICMP).

## Instalar
1. Descargar el repositorio y descomprimirlo.
2. Abrir `chrome://extensions`.
3. Activar **Modo desarrollador**.
4. Pulsar **Cargar descomprimida** y seleccionar la carpeta del repositorio.

El test se ejecuta al instalar, al iniciar el navegador, cada minuto y al pulsar **Probar ahora**. Guarda localmente las últimas 30 mediciones. No necesita servidor ni base de datos.

Los tiempos HTTP son aproximados y no representan un ping ICMP real.
