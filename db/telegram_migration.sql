CREATE TABLE IF NOT EXISTS public.monitor_telegram_settings(
 user_id BIGINT PRIMARY KEY REFERENCES public.monitor_users(id) ON DELETE CASCADE,
 enabled BOOLEAN NOT NULL DEFAULT FALSE,
 chat_id VARCHAR(100) NOT NULL DEFAULT '',
 bot_token_encrypted TEXT,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
GRANT SELECT,INSERT,UPDATE ON public.monitor_telegram_settings TO knj_internet_tester_internettest_usr;
