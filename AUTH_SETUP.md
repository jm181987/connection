# KNJ Internet Monitor 2.1.0 — Usuarios y contraseña

1. Ejecutar `db/auth_migration.sql` en PostgreSQL como propietario/administrador.
2. Desplegar último commit en Vercel, manteniendo `DATABASE_URL`. No hay claves nuevas.
3. Actualizar extensión a 2.1.0, crear usuario (3–40 caracteres) y contraseña (12–128 caracteres), iniciar sesión.
4. La extensión utiliza un token de sesión aleatorio de 30 días; la contraseña se almacena en servidor mediante scrypt con sal por usuario. Cada dispositivo queda vinculado al primer usuario autenticado que envía mediciones.
5. La lectura de estadísticas exige sesión y propiedad del dispositivo. Para dispositivos previamente existentes, iniciar sesión y sincronizar una medición para vincularlos.

IMPORTANTE: por compatibilidad temporal, `POST /api/measurements` sigue aceptando `INGEST_API_KEY` de instalaciones antiguas, pero `GET /api/stats` exige sesión. Una vez migradas todas las instalaciones se debe retirar esa compatibilidad. Si la clave anterior estuvo expuesta, rotarla. El registro está abierto; antes de distribución pública agregar verificación de correo, límites de solicitudes, protección antiabuso, recuperación de contraseña y administración de cuentas. No está listo aún para despliegue público sin esas protecciones.
