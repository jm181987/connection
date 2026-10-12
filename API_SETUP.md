# API de KNJ Internet Monitor

El monitoreo de la extensión sigue independiente; esta API está preparada, **pero no está conectada a la extensión ni desplegada/verificada todavía**.

## Configuración
1. Vincular el repositorio a un proyecto Vercel Node.js con raíz en el repositorio.
2. Crear variables **privadas** en Vercel: `DATABASE_URL` (URL PostgreSQL completa) y `INGEST_API_KEY` (clave aleatoria larga, independiente de la contraseña PostgreSQL). No publicar ninguna en GitHub.
3. Ejecutar `db/schema.sql` una sola vez en PostgreSQL mediante un cliente SQL seguro.
4. Desplegar. Probar `GET /api/health`: devuelve indicadores de configuración, no credenciales.
5. `POST /api/measurements` requiere `Authorization: Bearer <INGEST_API_KEY>`, JSON `{"deviceId":"equipo-12345678","measurements":[{"time":1790000000000,"ok":true,"quality":"good","ms":72}]}`. El timestamp debe estar dentro de los últimos 90 días o 5 minutos futuros; se aceptan lotes de 1 a 100 y se evitan duplicados por dispositivo/fecha.

**Seguridad:** la extensión Chrome no debe incluir `DATABASE_URL` ni `INGEST_API_KEY` compartida. Antes de conectar clientes reales, implementar alta/autenticación por dispositivo con credenciales individuales o un backend intermediario. Los endpoints no permiten lectura pública de mediciones. Si la base de datos exige TLS, configurar `PGSSL=true` y certificados válidos. Cambiar la contraseña PostgreSQL anteriormente expuesta.

**Conectividad:** Vercel debe poder llegar a PostgreSQL en TCP 5432; configurar firewall y TLS. La API no puede recibir registros durante una caída local; el cliente deberá ponerlos en cola y sincronizar cuando vuelva Internet.
