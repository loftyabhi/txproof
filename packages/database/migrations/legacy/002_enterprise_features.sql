-- MIGRATION: 002_enterprise_features.sql
-- DESCRIPTION: Adds Webhooks, Webhook Events, Receipt Templates, and Receipt Proofs
-- DATE: 2026-02-03

-- ------------------------------------------------------------------------------
-- 1. WEBHOOKS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted secret
    secret_iv TEXT NOT NULL, -- Initialization vector for decryption
    secret_tag TEXT NOT NULL, -- Authentication tag for GCM
    secret_last4 TEXT NOT NULL, -- Last 4 chars for display
    events TEXT[] NOT NULL DEFAULT '{}', -- e.g. ['bill.completed', 'bill.failed']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraints
    CONSTRAINT webhooks_url_check CHECK (url ~ '^https://.*') -- Force HTTPS
);

CREATE INDEX IF NOT EXISTS idx_webhooks_api_key ON webhooks(api_key_id);


-- -----------------------------------------------------------------------------
-- 2. WEBHOOK EVENTS (Delivery Log)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE, -- Idempotency Key (e.g. evt_...)
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'success', 'failed')) DEFAULT 'pending',
    response_status INT,
    response_body TEXT,
    attempt_count INT DEFAULT 0,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status_retry ON webhook_events(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id);

-- -----------------------------------------------------------------------------
-- 3. RECEIPT TEMPLATES (Custom Branding)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE UNIQUE, -- One template per key
    logo_url TEXT,
    primary_color TEXT CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$'), -- Simple Hex Check
    accent_color TEXT CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'),
    footer_text TEXT,
    font_variant TEXT DEFAULT 'inter',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. BILLS (Receipt Proofs)
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'receipt_hash') THEN
        ALTER TABLE bills ADD COLUMN receipt_hash TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'hash_algo') THEN
        ALTER TABLE bills ADD COLUMN hash_algo TEXT DEFAULT 'keccak256';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TRIGGERS & POLICIES
-- -----------------------------------------------------------------------------

-- Auto-update timestamps
CREATE TRIGGER webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER webhook_events_updated_at BEFORE UPDATE ON webhook_events FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER receipt_templates_updated_at BEFORE UPDATE ON receipt_templates FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;

-- Service Role Management (Backend Only)
CREATE POLICY "Service manages webhooks" ON webhooks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages webhook_events" ON webhook_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages templates" ON receipt_templates FOR ALL USING (auth.role() = 'service_role');

-- Public/Auth user policies would go here if direct access needed (skipped for pure Service-SaaS model)
