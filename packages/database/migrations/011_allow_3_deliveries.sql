-- Migration: Allow up to 3 webhook deliveries per job/event-type per API key
-- Date: 2026-02-11

-- 1. Drop the strict unique constraint that allowed only 1 delivery
ALTER TABLE webhook_deliveries DROP CONSTRAINT IF EXISTS unique_delivery_per_apikey_job;

-- 2. (Optional) Add a non-unique index to maintain performance for lookups
-- The existing idx_webhook_deliveries_lookup (api_key_id, job_id, event_type) already exists
-- but it was backing the UNIQUE constraint. PostgreSQL keeps the index if it was created explicitly,
-- but if it was implicit from the constraint, we might need to recreate it.
-- Let's ensure it exists.

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_lookup_multi ON webhook_deliveries(api_key_id, job_id, event_type);

COMMENT ON TABLE webhook_deliveries IS 'Tracks webhook deliveries. Unique constraint removed to allow up to 3 requests per logical event.';
