CREATE TABLE IF NOT EXISTS internet_measurements (
 id BIGSERIAL PRIMARY KEY,
 device_id VARCHAR(80) NOT NULL,
 observed_at TIMESTAMPTZ NOT NULL,
 received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 online BOOLEAN NOT NULL,
 quality VARCHAR(8) NOT NULL CHECK (quality IN ('good','fair','poor','offline')),
 latency_ms INTEGER CHECK (latency_ms IS NULL OR latency_ms BETWEEN 0 AND 120000),
 CONSTRAINT internet_measurements_device_time UNIQUE(device_id,observed_at),
 CONSTRAINT internet_measurements_consistency CHECK ((online AND quality <> 'offline' AND latency_ms IS NOT NULL) OR (NOT online AND quality = 'offline' AND latency_ms IS NULL))
);
CREATE INDEX IF NOT EXISTS internet_measurements_device_recent ON internet_measurements(device_id,observed_at DESC);
