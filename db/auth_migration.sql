-- Ejecutar con el propietario de las tablas o administrador PostgreSQL.
CREATE TABLE IF NOT EXISTS public.monitor_users(
 id BIGSERIAL PRIMARY KEY,
 username VARCHAR(40) NOT NULL UNIQUE,
 password_salt VARCHAR(32) NOT NULL,
 password_hash VARCHAR(128) NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.monitor_sessions(
 token_hash CHAR(64) PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES public.monitor_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS monitor_sessions_user ON public.monitor_sessions(user_id);
CREATE TABLE IF NOT EXISTS public.monitor_devices(
 device_id VARCHAR(80) PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES public.monitor_users(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS monitor_devices_user ON public.monitor_devices(user_id);
GRANT USAGE ON SCHEMA public TO knj_internet_tester_internettest_usr;
GRANT SELECT,INSERT,UPDATE ON public.monitor_users,public.monitor_sessions,public.monitor_devices TO knj_internet_tester_internettest_usr;
GRANT DELETE ON public.monitor_sessions TO knj_internet_tester_internettest_usr;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO knj_internet_tester_internettest_usr;
GRANT SELECT,INSERT ON public.internet_measurements TO knj_internet_tester_internettest_usr;
