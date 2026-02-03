-- ============================================================================
-- TXPROOF CANONICAL MASTER SCHEMA
-- ============================================================================
-- DESCRIPTION: Single source of truth for TxProof SaaS & Registry Platform.
-- VERSION: 2.1 (Consolidated)
-- DATE: 2026-02-03
-- 
-- PURPOSE: 
-- 1. Bootstrap new environments (Staging/Production/Local)
-- 2. Canonical reference for Schema Drift Detection
-- 3. Architecture Documentation
--
-- SECURITY: Zero Trust architecture with Row Level Security (RLS) enabled.
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. INFRASTRUCTURE & EXTENSIONS
-- -----------------------------------------------------------------------------

-- Enable standard extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 2. REGISTRY TABLES (Global Configuration)
-- -----------------------------------------------------------------------------

-- 2.1 CHAINS
CREATE TABLE IF NOT EXISTS chains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    chain_id INT NOT NULL UNIQUE,
    explorer_url TEXT,
    currency_symbol VARCHAR(10) DEFAULT 'ETH',
    config_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Chains (Idempotent)
INSERT INTO chains (name, chain_id, explorer_url, currency_symbol)
VALUES 
    ('Ethereum', 1, 'https://etherscan.io', 'ETH'),
    ('Base', 8453, 'https://basescan.org', 'ETH'),
    ('Optimism', 10, 'https://optimistic.etherscan.io', 'ETH'),
    ('Arbitrum', 42161, 'https://arbiscan.io', 'ETH'),
    ('Polygon', 137, 'https://polygonscan.com', 'MATIC'),
    ('BSC', 56, 'https://bscscan.com', 'BNB'),
    ('Avalanche', 43114, 'https://snowtrace.io', 'AVAX'),
    ('Base Sepolia', 84532, 'https://sepolia.basescan.org', 'ETH'),
    ('Sepolia', 11155111, 'https://sepolia.etherscan.io', 'ETH')
ON CONFLICT (chain_id) DO UPDATE SET
    name = EXCLUDED.name,
    explorer_url = EXCLUDED.explorer_url,
    currency_symbol = EXCLUDED.currency_symbol;

-- 2.2 AD PROFILES
CREATE TABLE IF NOT EXISTS ad_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    html_content TEXT,
    click_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    placement VARCHAR(10) DEFAULT 'both' CHECK (placement IN ('web', 'pdf', 'both')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 SUPPORTED TOKENS
CREATE TABLE IF NOT EXISTS supported_tokens (
    symbol VARCHAR(10) PRIMARY KEY,
    address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    decimals INT NOT NULL DEFAULT 18,
    is_native BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. SAAS CORE (Identity & Monetization)
-- -----------------------------------------------------------------------------

-- 3.1 PLANS & TIERS
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- 'Free', 'Pro', 'Enterprise'
    rate_limit_rps INT DEFAULT 1,
    max_burst INT DEFAULT 5,
    monthly_quota INT DEFAULT 100,
    priority_level INT DEFAULT 0, -- 0=Low, 10=Medium, 20=High
    support_priority TEXT DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Plans
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

-- 3.2 API KEYS
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256
    prefix TEXT NOT NULL,          -- sk_live_...
    name TEXT,
    owner_id TEXT,                 -- Supabase User ID or Wallet Address
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

-- -----------------------------------------------------------------------------
-- 4. BUSINESS DATA (Users & Records)
-- -----------------------------------------------------------------------------

-- 4.1 USERS (Wallet-based Profiles)
CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(42) PRIMARY KEY,
    bills_generated INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 CONTRIBUTORS (Public Good Support)
CREATE TABLE IF NOT EXISTS contributors (
    wallet_address VARCHAR(42) NOT NULL,
    chain_id INT NOT NULL DEFAULT 8453,
    total_amount_wei NUMERIC(78, 0) DEFAULT 0,
    contribution_count INT DEFAULT 0,
    last_contribution_at TIMESTAMPTZ,
    is_anonymous BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (wallet_address, chain_id)
);

-- 4.3 INDEXER EVENTS (Immutable Log)
CREATE TABLE IF NOT EXISTS contributor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INT NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    log_index INT NOT NULL,
    block_number BIGINT NOT NULL,
    block_timestamp TIMESTAMPTZ,
    donor_address VARCHAR(42) NOT NULL,
    amount_wei NUMERIC(78, 0) NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    invalid_reason TEXT,
    invalidated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chain_id, tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_contrib_valid ON contributor_events(is_valid);

-- 4.4 BILLS (Production Hardened Records)
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id TEXT NOT NULL UNIQUE,
    tx_hash TEXT NOT NULL,
    chain_id INT NOT NULL,
    user_id UUID,          -- Supabase Internal ID
    user_address TEXT,     -- Wallet Address
    api_key_id UUID REFERENCES api_keys(id),
    bill_json JSONB,
    receipt_hash TEXT,
    hash_algo TEXT DEFAULT 'keccak256',
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    expires_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_tx_hash ON bills(tx_hash, chain_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_address);
CREATE INDEX IF NOT EXISTS idx_bills_expires ON bills(expires_at);
CREATE INDEX IF NOT EXISTS idx_bills_api_key ON bills(api_key_id);

-- -----------------------------------------------------------------------------
-- 5. ASYNC & QUEUE SYSTEMS
-- -----------------------------------------------------------------------------

-- 5.1 WEBHOOKS (Encrypted configs)
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

-- 5.2 WEBHOOK EVENTS (Delivery log)
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

-- 5.3 RECEIPT TEMPLATES (Design & Branding)
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

-- 5.4 BILL JOBS (Hardened Priority Queue)
CREATE TABLE IF NOT EXISTS bill_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL,
    chain_id INT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    bill_id TEXT,
    error TEXT,
    api_key_id UUID REFERENCES api_keys(id),
    priority INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    heartbeat_at TIMESTAMPTZ,
    duration_ms INT,
    wait_time_ms INT,
    processing_time_ms INT,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_tx_chain ON bill_jobs(tx_hash, chain_id);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON bill_jobs(status, priority DESC, created_at ASC);

-- 5.5 PENDING CONTRIBUTIONS
CREATE TABLE IF NOT EXISTS pending_contributions (
    tx_hash VARCHAR(66) PRIMARY KEY,
    chain_id INT NOT NULL DEFAULT 8453,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'failed')),
    retries INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. OBSERVABILITY & ANALYTICS
-- -----------------------------------------------------------------------------

-- 6.1 API USAGE (Real-time tracking)
CREATE TABLE IF NOT EXISTS api_usage (
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

CREATE INDEX IF NOT EXISTS idx_api_usage_key_created ON api_usage(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage(status_code);

-- 6.2 USAGE AGGREGATES (Quota enforcement)
CREATE TABLE IF NOT EXISTS api_usage_aggregates (
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    request_count INT DEFAULT 0,
    PRIMARY KEY (api_key_id, period_start)
);

-- 6.3 API LOGS (Detailed debugging)
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

-- 6.4 AUDIT LOGS (Security Ledger)
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

-- -----------------------------------------------------------------------------
-- 7. SECURITY & RLS POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS globally
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
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_tokens ENABLE ROW LEVEL SECURITY;

-- 7.1 Public Read Policies
CREATE POLICY "Public Read Plans" ON plans FOR SELECT USING (TRUE);
CREATE POLICY "Public Read Chains" ON chains FOR SELECT USING (TRUE);
CREATE POLICY "Public Read Ads" ON ad_profiles FOR SELECT USING (is_active = true AND is_deleted = false);
CREATE POLICY "Public Read Contributors" ON contributors FOR SELECT USING (TRUE);
CREATE POLICY "Public Read Tokens" ON supported_tokens FOR SELECT USING (is_active = true);

-- 7.2 Authenticated User Policies
CREATE POLICY "Users view own keys" ON api_keys 
    FOR SELECT TO authenticated 
    USING (owner_id = auth.uid()::TEXT);

CREATE POLICY "Users view own bills" ON bills 
    FOR SELECT TO authenticated 
    USING (user_address = auth.uid()::TEXT OR user_id = auth.uid());

-- 7.3 Service Role (Backend) & Direct Connection Policies
-- These policies allow BOTH Supabase Service Role (JWT) and Direct Postgres Connections (Service Role User)
CREATE POLICY "Service manages everything" ON bills FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages api_usage" ON api_usage FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages jobs" ON bill_jobs FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages webhooks" ON webhooks FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages templates" ON receipt_templates FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages ads" ON ad_profiles FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages plans" ON plans FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages chains" ON chains FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages keys" ON api_keys FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages users" ON users FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

CREATE POLICY "Service manages contributors" ON contributors FOR ALL 
    USING (auth.role() = 'service_role' OR current_user = 'postgres' OR current_user = 'postgres.avklfjqhpizielvnkwyh');

-- 7.4 EXPLICIT GRANTS (Ensures permission denied errors are resolved)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 8. RPC FUNCTIONS & STORED PROCEDURES
-- -----------------------------------------------------------------------------

-- 8.1 ATOMIC JOB CLAIM (Concurrency Safe)
CREATE OR REPLACE FUNCTION claim_next_bill_job_v2()
RETURNS TABLE (id UUID, tx_hash TEXT, chain_id INT, metadata JSONB, api_key_id UUID) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
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
        SET status = 'processing',
            started_at = NOW(),
            heartbeat_at = NOW(),
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

-- 8.2 QUOTA INCREMENT
CREATE OR REPLACE FUNCTION increment_api_usage(p_key_id UUID, p_cost INT DEFAULT 1)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
    v_quota INT; v_current INT; v_month DATE := DATE_TRUNC('month', NOW())::DATE;
BEGIN
    SELECT p.monthly_quota INTO v_quota FROM api_keys k JOIN plans p ON k.plan_id = p.id WHERE k.id = p_key_id;
    INSERT INTO api_usage_aggregates (api_key_id, period_start, request_count)
    VALUES (p_key_id, v_month, p_cost)
    ON CONFLICT (api_key_id, period_start)
    DO UPDATE SET request_count = api_usage_aggregates.request_count + p_cost
    RETURNING request_count INTO v_current;
    RETURN v_current <= v_quota;
END;
$$;

-- 8.3 AGGREGATION HELPERS
CREATE OR REPLACE FUNCTION aggregate_usage_by_endpoint(p_api_key_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE (endpoint TEXT, request_count BIGINT, avg_duration_ms NUMERIC, error_rate NUMERIC) AS $$
BEGIN
    RETURN QUERY SELECT au.endpoint, COUNT(*), ROUND(AVG(au.duration_ms), 2),
    ROUND((COUNT(*) FILTER (WHERE au.status_code >= 400)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2)
    FROM api_usage au WHERE au.api_key_id = p_api_key_id AND au.created_at >= p_start_date AND au.created_at <= p_end_date
    GROUP BY au.endpoint ORDER BY request_count DESC;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 9. TRIGGERS & MAINTENANCE
-- -----------------------------------------------------------------------------

-- Apply auto-timestamp triggers
CREATE TRIGGER chains_updated_at BEFORE UPDATE ON chains FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER bill_jobs_updated_at BEFORE UPDATE ON bill_jobs FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Contributor aggregation logic
CREATE OR REPLACE FUNCTION update_contributors() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contributors (wallet_address, chain_id, total_amount_wei, contribution_count, last_contribution_at)
  VALUES (NEW.donor_address, NEW.chain_id, NEW.amount_wei, 1, NEW.block_timestamp)
  ON CONFLICT (wallet_address, chain_id)
  DO UPDATE SET
    total_amount_wei = contributors.total_amount_wei + NEW.amount_wei,
    contribution_count = contributors.contribution_count + 1,
    last_contribution_at = GREATEST(contributors.last_contribution_at, NEW.block_timestamp),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_contributors AFTER INSERT ON contributor_events 
FOR EACH ROW EXECUTE FUNCTION update_contributors();

-- Maintenance view for SLA
CREATE OR REPLACE VIEW daily_metrics AS
SELECT DATE_TRUNC('hour', finished_at) AS hour_bucket,
AVG(duration_ms) as avg_latency,
COUNT(*) FILTER (WHERE status = 'failed') AS failure_count,
COUNT(*) AS total_count
FROM bill_jobs WHERE finished_at > NOW() - INTERVAL '24 hours' GROUP BY 1;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
