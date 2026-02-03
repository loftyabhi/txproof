-- MIGRATION: 004_api_usage_tracking.sql
-- ⚠️ DEPRECATED: This migration has been superseded by 000_complete_schema.sql
-- DESCRIPTION: Real API usage tracking (Legacy - Master schema is now in 000_complete_schema.sql)
-- DATE: 2026-02-03

-- -----------------------------------------------------------------------------
-- 1. API USAGE TABLE (Request Logging)
-- -----------------------------------------------------------------------------
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_key_created ON api_usage(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage(status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Service role policy
CREATE POLICY "Service manages api_usage" ON api_usage FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 2. API LOGS TABLE (Detailed Request/Response Logs - Optional for debugging)
-- -----------------------------------------------------------------------------
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_request_id ON api_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);

-- Enable RLS
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Service role policy
CREATE POLICY "Service manages api_logs" ON api_logs FOR ALL USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 3. AUTOMATIC CLEANUP (Keep only last 90 days of usage data)
-- -----------------------------------------------------------------------------
-- This function will be called by a cron job to clean old logs
CREATE OR REPLACE FUNCTION cleanup_old_api_usage()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM api_usage WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM api_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

COMMENT ON TABLE api_usage IS 'Real-time API usage metrics for dashboard and quota enforcement';
COMMENT ON TABLE api_logs IS 'Detailed request/response logs for debugging and audit trails';
