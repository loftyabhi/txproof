-- Database Schema for Chain Receipt
-- Enterprise Hardening Applied:
-- 1. Removed rpc_url (Security)
-- 2. Added immutability triggers (Integrity)
-- 3. Added soft deletes (Audit)
-- 4. Enforced strict typing and constraints

-- -----------------------------------------------------------------------------
-- 1. CHAINS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    -- [HARDENING] Enforce uniqueness on chain_id to allow reliable FKs
    chain_id INT NOT NULL UNIQUE,
    -- [HARDENING] REMOVED rpc_url to prevent secret leakage in DB.
    -- RPC URLs should be loaded from environment variables or a secure vault.
    explorer_url TEXT,
    currency_symbol VARCHAR(10) DEFAULT 'ETH',
    config_json JSONB DEFAULT '{}'
);

-- -----------------------------------------------------------------------------
-- 2. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    -- [HARDENING] wallet_address is the identity key and must be immutable.
    wallet_address VARCHAR(42) PRIMARY KEY,
    is_registered BOOLEAN DEFAULT FALSE,
    -- [HARDENING] Ensure registration_tx is unique if present
    registration_tx VARCHAR(66) UNIQUE,
    registered_at TIMESTAMP,
    current_plan_id INT,
    plan_expiry TIMESTAMP,
    bills_generated INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. PLANS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    -- [HARDENING] Changed from seconds (int) to INTERVAL for clarity and reduced error.
    validity_interval INTERVAL NOT NULL, 
    price_wei NUMERIC(78, 0) DEFAULT 0,
    generation_limit INT DEFAULT 10,
    has_ads BOOLEAN DEFAULT TRUE,
    can_download_pdf BOOLEAN DEFAULT FALSE,
    ad_profile_id INT,
    is_active BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 4. BILLS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) REFERENCES users(wallet_address),
    tx_hash VARCHAR(66) NOT NULL,
    -- [HARDENING] FK references the UNIQUE chain_id in chains table
    chain_id INT REFERENCES chains(chain_id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    -- [HARDENING] Protected by trigger once status = 'COMPLETED'
    -- EXPECTED SCHEMA (Application enforcement required):
    -- {
    --   "items": [{ "desc": string, "amount": number }],
    --   "currency": "ETH",
    --   "total": number,
    --   "meta": { "version": "1.0", "source": "api" }
    -- }
    bill_json JSONB,
    -- [HARDENING] Renamed from audit_data to imply system-level non-PII usage
    -- Stores immutable proof of generation (block hash, gas used, timestamp)
    system_audit_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- [HARDENING] Soft Delete Strategy
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. ADS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    -- [HARDENING] SECURITY WARNING: This field contains raw HTML. 
    -- TRUST BOUNDARY: Only Admins can write this. 
    -- The frontend must sanitize headers/scripts before rendering.
    html_content TEXT,
    click_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    -- [HARDENING] Soft Delete Strategy
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES & CONSTRAINTS
-- -----------------------------------------------------------------------------
CREATE INDEX idx_bills_wallet ON bills(wallet_address);
CREATE INDEX idx_bills_tx ON bills(tx_hash);
CREATE UNIQUE INDEX uniq_bill_tx_chain ON bills(tx_hash, chain_id);
-- [HARDENING] Added index for chain_id queries
CREATE INDEX idx_bills_chain ON bills(chain_id);

-- Foreign Keys (Added later to handle table order if needed, though defined inline above)
DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT fk_users_plan FOREIGN KEY (current_plan_id) REFERENCES plans(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- TRIGGERS & FUNCTIONS
-- -----------------------------------------------------------------------------

-- 1. Timestamp Auto-Update
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. [HARDENING] Prevent Wallet Address Updates
CREATE OR REPLACE FUNCTION prevent_wallet_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'wallet_address is immutable';
END;
$$ LANGUAGE plpgsql;

-- 3. [HARDENING] Prevent Bill JSON Mutation after Completion
CREATE OR REPLACE FUNCTION prevent_bill_update()
RETURNS trigger AS $$
BEGIN
  -- Allow updates if we are setting it for the first time or if status is not COMPLETED yet
  -- But if OLD.status was COMPLETED, we block changes to bill_json
  IF OLD.status = 'COMPLETED' AND OLD.bill_json IS DISTINCT FROM NEW.bill_json THEN
      RAISE EXCEPTION 'bill_json is immutable after completion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers

-- Users: updated_at
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Users: Immutability
DROP TRIGGER IF EXISTS no_wallet_update ON users;
CREATE TRIGGER no_wallet_update
BEFORE UPDATE OF wallet_address ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_wallet_update();

-- Bills: updated_at
DROP TRIGGER IF EXISTS bills_updated_at ON bills;
CREATE TRIGGER bills_updated_at
BEFORE UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Bills: Immutability
DROP TRIGGER IF EXISTS no_bill_rewrite ON bills;
CREATE TRIGGER no_bill_rewrite
BEFORE UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION prevent_bill_update();

-- -----------------------------------------------------------------------------
-- 6. CACHING & INDEXING
-- -----------------------------------------------------------------------------

-- State tracking for blockchain indexers
-- [TIER-2] RLS: Enabled. Private to Service Role only.
CREATE TABLE IF NOT EXISTS indexer_state (
    key VARCHAR(50) PRIMARY KEY, -- e.g., 'contributors_sync'
    last_synced_block BIGINT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE indexer_state ENABLE ROW LEVEL SECURITY;

-- Cached Contributors Data (Public Good Support)
-- [TIER-2] RLS: Enabled. Public Read, Service Role Write.
CREATE TABLE IF NOT EXISTS contributors (
    wallet_address VARCHAR(42) PRIMARY KEY,
    total_amount_wei NUMERIC(78, 0) DEFAULT 0,
    contribution_count INT DEFAULT 0,
    last_contribution_at TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

-- Indexes for Contributor Sorting
CREATE INDEX idx_contributors_total ON contributors(total_amount_wei DESC);

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY POLICIES
-- -----------------------------------------------------------------------------

-- CONTRIBUTORS: Allow Public Read
-- Policy Name: "Public can view contributors"
CREATE POLICY "Public can view contributors" ON contributors FOR SELECT USING (true);

-- CONTRIBUTORS: Allow Service Role Write (Implicit via bypass, but good to be explicit if using user)
-- Note: Supabase Service Role key bypasses RLS, so no explicit policy needed for it.
-- We DO NOT add a policy for INSERT/UPDATE for 'public' (anon), effectively disabling it.

-- INDEXER_STATE: Private
-- No public policies -> accessible only by Service Role / Superuser.

-- OTHER TABLES (Optional: Enable RLS to lock them down if exposed via Data API)
-- For now, we enable them to be safe.
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_profiles ENABLE ROW LEVEL SECURITY;

-- Allow Public Read on Chains/Plans/Ads (needed for UI if using Supabase Client)
CREATE POLICY "Public can view chains" ON chains FOR SELECT USING (true);
CREATE POLICY "Public can view plans" ON plans FOR SELECT USING (true);
CREATE POLICY "Public can view ads" ON ad_profiles FOR SELECT USING (true);

-- BILLS/USERS: Protected. Users can only see their own? 
-- Since we use wallet_address, we could allow users to select WHERE wallet_address = auth.uid() 
-- BUT our auth.uid() is likely not the wallet address in this architecture yet.
-- For now, we leave them with NO public policies (Service Role / Backend API access only).


