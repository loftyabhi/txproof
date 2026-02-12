-- Migration: 012_email_job_claim_rpc.sql
-- Goal: Define the claim_next_email_job function to atomically claim pending email jobs with priority support.

DROP FUNCTION IF EXISTS claim_next_email_job();

CREATE OR REPLACE FUNCTION claim_next_email_job()
RETURNS TABLE (
    id UUID,
    recipient_email TEXT,
    category TEXT,
    template_id UUID,
    metadata JSONB,
    priority TEXT
) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_job_id UUID;
BEGIN
    SELECT ej.id INTO v_job_id
    FROM email_jobs ej
    WHERE ej.status = 'pending'
      AND ej.scheduled_at <= NOW()
    ORDER BY 
        CASE ej.priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            WHEN 'low' THEN 3 
            ELSE 4 
        END ASC,
        ej.scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NOT NULL THEN
        UPDATE email_jobs
        SET status = 'processing',
            started_at = NOW(),
            updated_at = NOW()
        WHERE email_jobs.id = v_job_id;
        
        RETURN QUERY 
            SELECT ej.id, ej.recipient_email, ej.category, 
                   ej.template_id, ej.metadata, ej.priority 
            FROM email_jobs ej
            WHERE ej.id = v_job_id;
    END IF;
END;
$$;
