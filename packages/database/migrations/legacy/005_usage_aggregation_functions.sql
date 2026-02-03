-- AGGREGATE FUNCTIONS FOR USAGE STATS
-- These functions support the /v1/usage/stats endpoint

-- Aggregate API usage by endpoint
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
        COUNT(*) as request_count,
        ROUND(AVG(au.duration_ms), 2) as avg_duration_ms,
        ROUND(
            (COUNT(*) FILTER (WHERE au.status_code >= 400)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
            2
        ) as error_rate
    FROM api_usage au
    WHERE au.api_key_id = p_api_key_id
        AND au.created_at >= p_start_date
        AND au.created_at <= p_end_date
    GROUP BY au.endpoint
    ORDER BY request_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Aggregate API usage by status code
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
        COUNT(*) as request_count
    FROM api_usage au
    WHERE au.api_key_id = p_api_key_id
        AND au.created_at >= p_start_date
        AND au.created_at <= p_end_date
    GROUP BY au.status_code
    ORDER BY au.status_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION aggregate_usage_by_endpoint IS 'Aggregates API usage metrics by endpoint with error rates';
COMMENT ON FUNCTION aggregate_usage_by_status IS 'Aggregates API usage by HTTP status code';
