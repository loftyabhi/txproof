-- Create table to track webhook deliveries per API key (idempotency ledger)
-- Ensures we don't send duplicate "completion" signals for cached jobs

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE SET NULL, -- Audit (which hook sent it)
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES bill_jobs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    delivered_at TIMESTAMPTZ DEFAULT now(),
    
    -- Idempotency Constraint: One event type per job per API key
    CONSTRAINT unique_delivery_per_apikey_job UNIQUE (api_key_id, job_id, event_type)
);

-- Index for faster lookups
CREATE INDEX idx_webhook_deliveries_lookup ON webhook_deliveries(api_key_id, job_id, event_type);
