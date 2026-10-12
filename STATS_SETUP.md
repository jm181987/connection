# Panel de estadísticas (v2.0.0)
Abrí el desplegable **Estadísticas de conexión** en el popup de Chrome. Elegí 24 horas, 7 días o 30 días. Se consultan exclusivamente las mediciones del dispositivo actual, autenticadas mediante la clave API configurada localmente.

Métricas: porcentaje de muestras exitosas, latencia HTTP media de muestras exitosas, tramos consecutivos de muestras offline y duración aproximada de esos tramos. Si existe una separación de más de 15 segundos entre mediciones, se inicia un tramo nuevo; no se presupone que hubo una caída durante intervalos sin muestras. La evolución muestra disponibilidad agrupada por hora, solo para horas con muestras.

**Permisos de lectura:** el usuario PostgreSQL utilizado por Vercel necesita `GRANT SELECT ON TABLE public.internet_measurements TO knj_internet_tester_internettest_usr;`. El esquema anterior no cambia. Desplegar en Vercel y actualizar la extensión.

**Seguridad:** se conserva la autenticación compartida actual. Para una distribución multiusuario se requiere autenticación individual por dispositivo y autorización de lectura por dispositivo; la clave compartida no aísla usuarios entre sí.
