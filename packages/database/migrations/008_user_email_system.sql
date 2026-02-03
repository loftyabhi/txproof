-- Consolidated Migration: User Identity & Email Verification System
-- Merged from 008, 009, 010

-- 1. Extend Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_config JSONB DEFAULT '{}'::jsonb;

-- Index on email for lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Email Verification Tokens Table (Enterprise Standard)
-- Robust handling for existing schemas (transitioning from legacy 009 to 008 consolidated)
DO $$ 
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_verification_tokens') THEN
        CREATE TABLE public.email_verification_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            last_requested_at TIMESTAMPTZ DEFAULT NOW(),
            used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Sync existing table to enterprise standards
        -- Rename token to token_hash if it exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_verification_tokens' AND column_name = 'token') THEN
            ALTER TABLE public.email_verification_tokens RENAME COLUMN token TO token_hash;
        END IF;

        -- Ensure used_at exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_verification_tokens' AND column_name = 'used_at') THEN
            ALTER TABLE public.email_verification_tokens ADD COLUMN used_at TIMESTAMPTZ;
        END IF;

        -- Ensure created_at exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_verification_tokens' AND column_name = 'created_at') THEN
            ALTER TABLE public.email_verification_tokens ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Index for fast lookup of hashed tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_token_hash ON public.email_verification_tokens (token_hash);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_user ON public.email_verification_tokens(user_id);

-- Permissions: Only accessible by service role/admin
ALTER TABLE public.email_verification_tokens DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.email_verification_tokens TO service_role;
GRANT ALL ON public.email_verification_tokens TO postgres;

-- Comments
COMMENT ON COLUMN email_verification_tokens.token_hash IS 'SHA256 hash of the verification token for enterprise security';
