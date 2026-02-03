-- ============================================================================
-- MIGRATION 007: Enterprise Developer Console
-- DESCRIPTION: Foundation for Secure SaaS Platform (Auth, Identity, Monetization)
-- ============================================================================

-- 1. Create auth_nonces table (Replay Protection)
CREATE TABLE IF NOT EXISTS auth_nonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) NOT NULL,
    nonce VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ, -- If null, not used. If set, used.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nonces_wallet ON auth_nonces(wallet_address);
ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;

-- 2. Upgrade users table (Strong Identity)
-- Add UUID ID if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN
        ALTER TABLE users ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Change PK to UUID (Safe transition)
DO $$
BEGIN
    -- Only change PK if it's not already UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'PRIMARY KEY' AND table_name = 'users' AND constraint_name = 'users_pkey'
    ) THEN
        -- Check if the PK column is wallet_address
        IF EXISTS (
            SELECT 1 FROM information_schema.key_column_usage 
            WHERE constraint_name = 'users_pkey' AND table_name = 'users' AND column_name = 'wallet_address'
        ) THEN
            ALTER TABLE users DROP CONSTRAINT users_pkey CASCADE;
            ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
            ALTER TABLE users ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);
        END IF;
    END IF;
END $$;

-- 3. Upgrade plans table (Feature Flags)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS allows_webhooks BOOLEAN DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS allows_branding BOOLEAN DEFAULT FALSE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS allows_bulk BOOLEAN DEFAULT FALSE;

-- Update Plan Defaults
UPDATE plans 
SET allows_webhooks = TRUE, allows_branding = TRUE, allows_bulk = TRUE 
WHERE name = 'Enterprise';

UPDATE plans 
SET allows_webhooks = TRUE, allows_branding = FALSE, allows_bulk = FALSE 
WHERE name = 'Pro';

UPDATE plans 
SET allows_webhooks = FALSE, allows_branding = FALSE, allows_bulk = FALSE 
WHERE name = 'Free';

-- 4. Upgrade api_keys table (Owner Link & Overage)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS overage_count INT DEFAULT 0;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_overage_at TIMESTAMPTZ;

-- Backfill owner_user_id from users table where owner_id matches wallet_address
UPDATE api_keys
SET owner_user_id = users.id
FROM users
WHERE api_keys.owner_id = users.wallet_address
AND api_keys.owner_user_id IS NULL;

-- 5. RLS Helpers
-- Allow Users to view their own nonces (optional, but good for debug/audit)
-- Actually, nonces are mostly backend managed, but strict RLS is good practice.
CREATE POLICY "Service manages nonces" ON auth_nonces FOR ALL 
USING (auth.role() = 'service_role' OR current_user = 'postgres');

-- Update Users RLS to allow reading own ID
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT 
USING (auth.uid()::text = wallet_address OR id::text = auth.uid()::text);
-- Note: The auth.uid() from our new JWT will likely map to the UUID, but initially might be wallet.
-- We will align this in the backend Auth Service.
