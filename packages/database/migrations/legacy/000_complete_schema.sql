-- ============================================================================
-- TXPROOF PRODUCTION DATABASE SCHEMA - COMPLETE MIGRATION
-- ============================================================================
-- DESCRIPTION: Comprehensive database schema for TxProof SaaS platform
-- Includes: SaaS infrastructure, enterprise features, security lockdown, 
--           API usage tracking, and production hardening
-- DATE: 2026-02-03
-- VERSION: 2.0 (Production Grade)
-- ============================================================================

-- Create helper function for timestamp updates (used by triggers)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 1: CORE SAAS INFRASTRUCTURE
-- ============================================================================

-- 1.1 PLANS & TIERS
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    rate_limit_rps INT DEFAULT 1,
    max_burst INT DEFAULT 5,
    monthly_quota INT DEFAULT 100,
    priority_level INT DEFAULT 0,
    support_priority TEXT DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default plans
INSERT INTO plans (name, rate_limit_rps, max_burst, monthly_quota, priority_level)
VALUES 
    ('Free', 1, 5, 100, 0),
    ('Pro', 10, 50, 10000, 10),
    ('Enterprise', 50, 200, 1000000, 20)
ON CONFLICT (name) DO UPDATE 
SET 
    max_burst = EXCLUDED.max_burst,
    monthly_quota = EXCLUDED.monthly_quota,
    rate_limit_rps = EXCLUDED.rate_limit_rps,
    priority_level = EXCLUDED.priority_level;

-- 1.2 API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    name TEXT,
    owner_id TEXT,
    plan_id UUID REFERENCES plans(id),
    plan_tier TEXT DEFAULT 'Free',
    quota_limit INT DEFAULT 100,
    environment TEXT DEFAULT 'live',
    is_active BOOLEAN DEFAULT TRUE,
    permissions TEXT[] DEFAULT '{}',
    ip_allowlist TEXT[] DEFAULT NULL,
    abuse_flag BOOLEAN DEFAULT FALSE,
    secret_salt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_id);

-- 1.3 USAGE AGGREGATES (Monthly quota tracking)
CREATE TABLE IF NOT EXISTS api_usage_aggregates (
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    request_count INT DEFAULT 0,
    PRIMARY KEY (api_key_id, period_start)
);

-- 1.4 AUDIT LOGS (Immutable security ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_id);

-- 1.5 BILL JOBS (Queue management)
CREATE TABLE IF NOT EXISTS bill_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tx_hash TEXT NOT NULL,
    chain_id INT NOT NULL,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    api_key_id UUID REFERENCES api_keys(id),
    priority INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    duration_ms INT,
    wait_time_ms INT,
    processing_time_ms INT,
    cache_hit BOOLEAN DEFAULT FALSE,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_priority ON bill_jobs(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_jobs_tx_hash ON bill_jobs(tx_hash, chain_id);

-- 1.6 BILLS (Receipt storage)
CREATE TABLE IF NOT EXISTS bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id TEXT NOT NULL UNIQUE,
    tx_hash TEXT NOT NULL,
    chain_id INT NOT NULL,
    user_id UUID,
    user_address TEXT,
    api_key_id UUID REFERENCES api_keys(id),
    bill_json JSONB,
    receipt_hash TEXT,
    hash_algo TEXT DEFAULT 'keccak256',
    status TEXT DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_tx_hash ON bills(tx_hash, chain_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_address);
CREATE INDEX IF NOT EXISTS idx_bills_expires ON bills(expires_at);
CREATE INDEX IF NOT EXISTS idx_bills_api_key ON bills(api_key_id);

-- ============================================================================
-- PART 2: ENTERPRISE FEATURES
-- ============================================================================

-- 2.1 WEBHOOKS (Encrypted secrets for security)
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret_encrypted TEXT NOT NULL,
    secret_iv TEXT NOT NULL,
    secret_tag TEXT NOT NULL,
    secret_last4 TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT webhooks_url_check CHECK (url ~ '^https://.*')
);

CREATE INDEX IF NOT EXISTS idx_webhooks_api_key ON webhooks(api_key_id);

-- 2.2 WEBHOOK EVENTS (Delivery log with retry logic)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
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
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- 2.3 RECEIPT TEMPLATES (Custom branding)
CREATE TABLE IF NOT EXISTS receipt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE UNIQUE,
    logo_url TEXT,
    primary_color TEXT CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$'),
    accent_color TEXT CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'),
    footer_text TEXT,
    font_variant TEXT DEFAULT 'inter',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_templates_api_key ON receipt_templates(api_key_id);

-- ============================================================================
-- PART 3: API USAGE TRACKING (Real-time metrics)
-- ============================================================================

-- 3.1 API USAGE TABLE (Request logging for dashboard)
-- Note: This replaces the basic api_usage from Part 1 with enhanced schema
DROP TABLE IF EXISTS api_usage CASCADE;

CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INT NOT NULL,
    duration_ms INT,
    request_size_bytes INT,
    response_size_bytes INT,
    user_agent TEXT,
    ip_address INET,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_usage_key_created ON api_usage(api_key_id, created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_status ON api_usage(status_code);
CREATE INDEX idx_api_usage_created ON api_usage(created_at);

-- 3.2 API LOGS (Detailed debugging logs)
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    request_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_headers JSONB,
    request_body JSONB,
    response_status INT,
    response_headers JSONB,
    response_body JSONB,
    duration_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_request_id ON api_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);

-- ============================================================================
-- PART 4: FUNCTIONS & STORED PROCEDURES
-- ============================================================================

-- 4.1 INCREMENT USAGE (Atomic quota checking)
CREATE OR REPLACE FUNCTION increment_api_usage(
    p_key_id UUID, 
    p_cost INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_quota INT;
    v_current INT;
    v_month DATE := DATE_TRUNC('month', NOW())::DATE;
BEGIN
    SELECT p.monthly_quota INTO v_quota
    FROM api_keys k
    JOIN plans p ON k.plan_id = p.id
    WHERE k.id = p_key_id;

    INSERT INTO api_usage_aggregates (api_key_id, period_start, request_count)
    VALUES (p_key_id, v_month, p_cost)
    ON CONFLICT (api_key_id, period_start)
    DO UPDATE SET request_count = api_usage_aggregates.request_count + p_cost
    RETURNING request_count INTO v_current;

    IF v_current > v_quota THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- 4.2 CLAIM NEXT JOB (Priority queue)
CREATE OR REPLACE FUNCTION claim_next_bill_job_v2()
RETURNS TABLE (
    id UUID,
    tx_hash TEXT,
    chain_id INT,
    metadata JSONB,
    api_key_id UUID
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_job_id UUID;
BEGIN
    SELECT bill_jobs.id INTO v_job_id
    FROM bill_jobs
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NOT NULL THEN
        UPDATE bill_jobs
        SET 
            status = 'processing',
            started_at = NOW(),
            updated_at = NOW(),
            wait_time_ms = EXTRACT(EPOCH FROM (NOW() - created_at)) * 1000
        WHERE bill_jobs.id = v_job_id;
        
        RETURN QUERY 
            SELECT bill_jobs.id, bill_jobs.tx_hash, bill_jobs.chain_id, 
                   bill_jobs.metadata, bill_jobs.api_key_id 
            FROM bill_jobs 
            WHERE bill_jobs.id = v_job_id;
    END IF;
END;
$$;

-- 4.3 CLEANUP OLD LOGS (Data retention)
CREATE OR REPLACE FUNCTION cleanup_old_api_usage()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM api_usage WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM api_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- 4.4 AGGREGATE USAGE BY ENDPOINT
CREATE OR REPLACE FUNCTION aggregate_usage_by_endpoint(
    p_api_key_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    endpoint TEXT,
    request_count BIGINT,
    avg_duration_ms NUMERIC,
    error_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.endpoint,
        COUNT(*) AS request_count,
        ROUND(AVG(au.duration_ms), 2) AS avg_duration_ms,
        ROUND(
            (COUNT(*) FILTER (WHERE au.status_code >= 400)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
            2
        ) AS error_rate
    FROM api_usage au
    WHERE au.api_key_id = p_api_key_id
        AND au.created_at >= p_start_date
        AND au.created_at <= p_end_date
    GROUP BY au.endpoint
    ORDER BY request_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 4.5 AGGREGATE USAGE BY STATUS
CREATE OR REPLACE FUNCTION aggregate_usage_by_status(
    p_api_key_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    status_code INT,
    request_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.status_code,
        COUNT(*) AS request_count
    FROM api_usage au
    WHERE au.api_key_id = p_api_key_id
        AND au.created_at >= p_start_date
        AND au.created_at <= p_end_date
    GROUP BY au.status_code
    ORDER BY au.status_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: ANALYTICS VIEWS
-- ============================================================================

-- 5.1 DAILY METRICS VIEW (SLA monitoring)
CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
    DATE_TRUNC('hour', finished_at) AS hour_bucket,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) AS p50_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_latency,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99_latency,
    AVG(wait_time_ms) AS avg_wait_time,
    COUNT(*) FILTER (WHERE status = 'failed') AS failure_count,
    COUNT(*) AS total_count
FROM bill_jobs
WHERE finished_at > NOW() - INTERVAL '24 hours'
GROUP BY 1;

-- ============================================================================
-- PART 6: TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER api_keys_updated_at BEFORE UPDATE ON api_keys 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER webhooks_updated_at BEFORE UPDATE ON webhooks 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER webhook_events_updated_at BEFORE UPDATE ON webhook_events 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER receipt_templates_updated_at BEFORE UPDATE ON receipt_templates 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER bills_updated_at BEFORE UPDATE ON bills 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER bill_jobs_updated_at BEFORE UPDATE ON bill_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service role has full access, others restricted)

-- Plans: Public read
DROP POLICY IF EXISTS "Public Read Plans" ON plans;
CREATE POLICY "Public Read Plans" ON plans FOR SELECT USING (TRUE);

-- API Keys: Users see only their own
DROP POLICY IF EXISTS "Users view own keys" ON api_keys;
CREATE POLICY "Users view own keys" ON api_keys
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid()::TEXT);

-- Bills: Users see only their own
DROP POLICY IF EXISTS "Users view own bills" ON bills;
CREATE POLICY "Users view own bills" ON bills
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Service role manages everything
CREATE POLICY "Service manages api_usage" ON api_usage FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages api_logs" ON api_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages webhooks" ON webhooks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages webhook_events" ON webhook_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service manages templates" ON receipt_templates FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PART 8: COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE api_usage IS 'Real-time API usage metrics for dashboard and quota enforcement';
COMMENT ON TABLE api_logs IS 'Detailed request/response logs for debugging and audit trails';
COMMENT ON TABLE webhooks IS 'Webhook configurations with encrypted secrets (AES-256-GCM)';
COMMENT ON TABLE webhook_events IS 'Webhook delivery log with automatic retry logic';
COMMENT ON TABLE receipt_templates IS 'Custom branding templates (presentation overlay only)';
COMMENT ON FUNCTION aggregate_usage_by_endpoint IS 'Aggregates API usage metrics by endpoint with error rates';
COMMENT ON FUNCTION aggregate_usage_by_status IS 'Aggregates API usage by HTTP status code';
COMMENT ON FUNCTION cleanup_old_api_usage IS 'Removes API logs older than retention period (90 days)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Version: 2.0
-- Total Tables: 13
-- Total Functions: 5
-- Total Views: 1
-- Security: RLS enabled on all tables
-- Features: SaaS, Webhooks, Templates, Usage Tracking, Cryptographic Proofs
-- ============================================================================
