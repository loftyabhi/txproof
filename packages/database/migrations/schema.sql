-- Database Schema for Chain Receipt
-- Full Consolidated Schema


-----------------------------------------------------------------------------
-- 0. CLEANUP (Optional - Use with Caution)
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS contributor_events CASCADE;
-- DROP TABLE IF EXISTS contributors CASCADE;
-- DROP TABLE IF EXISTS bills CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS ad_profiles CASCADE;
-- DROP TABLE IF EXISTS chains CASCADE;

-- -----------------------------------------------------------------------------
-- 1. CHAINS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    chain_id INT NOT NULL UNIQUE,
    explorer_url TEXT,
    currency_symbol VARCHAR(10) DEFAULT 'ETH',
    config_json JSONB DEFAULT '{}'
);

-- Seed Initial Chains (Idempotent)
INSERT INTO chains (name, chain_id, explorer_url, currency_symbol)
VALUES 
    -- Mainnets
    ('Ethereum', 1, 'https://etherscan.io', 'ETH'),
    ('Base', 8453, 'https://basescan.org', 'ETH'),
    ('Optimism', 10, 'https://optimistic.etherscan.io', 'ETH'),
    ('Arbitrum', 42161, 'https://arbiscan.io', 'ETH'),
    ('Polygon', 137, 'https://polygonscan.com', 'MATIC'),
    ('BSC', 56, 'https://bscscan.com', 'BNB'),
    ('Avalanche', 43114, 'https://snowtrace.io', 'AVAX'),
    -- Testnets
    ('Base Sepolia', 84532, 'https://sepolia.basescan.org', 'ETH'),
    ('Sepolia', 11155111, 'https://sepolia.etherscan.io', 'ETH')
ON CONFLICT (chain_id) DO UPDATE SET
    name = EXCLUDED.name,
    explorer_url = EXCLUDED.explorer_url,
    currency_symbol = EXCLUDED.currency_symbol;

-- -----------------------------------------------------------------------------
-- 2. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(42) PRIMARY KEY,
    bills_generated INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. ADS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    html_content TEXT,
    click_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    -- [NEW] Placement Column
    placement VARCHAR(10) DEFAULT 'both' CHECK (placement IN ('web', 'pdf', 'both'))
);

-- -----------------------------------------------------------------------------
-- 4. BILLS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) REFERENCES users(wallet_address),
    tx_hash VARCHAR(66) NOT NULL,
    chain_id INT REFERENCES chains(chain_id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    bill_json JSONB,
    system_audit_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. CONTRIBUTORS (Public Good Support)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contributors (
    wallet_address VARCHAR(42) NOT NULL,
    chain_id INT NOT NULL DEFAULT 8453, -- Default to Base Mainnet
    total_amount_wei NUMERIC(78, 0) DEFAULT 0,
    contribution_count INT DEFAULT 0,
    last_contribution_at TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wallet_address, chain_id)
);



-- -----------------------------------------------------------------------------
-- 7. INDEXER EVENTS (Immutable Log)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contributor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id INT NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    log_index INT NOT NULL,
    block_number BIGINT NOT NULL,
    block_timestamp TIMESTAMP,
    donor_address VARCHAR(42) NOT NULL,
    amount_wei NUMERIC(78, 0) NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chain_id, tx_hash, log_index)
);

-- -----------------------------------------------------------------------------
-- INDEXES & CONSTRAINTS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bills_wallet ON bills(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bills_tx ON bills(tx_hash);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bill_tx_chain ON bills(tx_hash, chain_id);
CREATE INDEX IF NOT EXISTS idx_bills_chain ON bills(chain_id);
CREATE INDEX IF NOT EXISTS idx_contributors_total ON contributors(total_amount_wei DESC);

-- FK Hook
DO $$ BEGIN
    -- ALTER TABLE users ADD CONSTRAINT fk_users_plan FOREIGN KEY (current_plan_id) REFERENCES plans(id);
    -- Constraint removed as plans table is deleted
    NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 9. SUPPORTED TOKENS (Dynamic List)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supported_tokens (
    symbol VARCHAR(10) PRIMARY KEY,
    address VARCHAR(42) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    decimals INT NOT NULL DEFAULT 18,
    is_native BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE supported_tokens ENABLE ROW LEVEL SECURITY;

-- Public can view active tokens
DROP POLICY IF EXISTS "Public can view active tokens" ON supported_tokens;
CREATE POLICY "Public can view active tokens" ON supported_tokens FOR SELECT USING (is_active = true);

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
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Immutability Guards
CREATE OR REPLACE FUNCTION prevent_wallet_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'wallet_address is immutable';
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION prevent_bill_update()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'COMPLETED' AND OLD.bill_json IS DISTINCT FROM NEW.bill_json THEN
      RAISE EXCEPTION 'bill_json is immutable after completion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply Triggers
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS no_wallet_update ON users;
CREATE TRIGGER no_wallet_update BEFORE UPDATE OF wallet_address ON users FOR EACH ROW EXECUTE FUNCTION prevent_wallet_update();

DROP TRIGGER IF EXISTS bills_updated_at ON bills;
CREATE TRIGGER bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS no_bill_rewrite ON bills;
CREATE TRIGGER no_bill_rewrite BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION prevent_bill_update();

-- 3. Contributor Aggregation Trigger
CREATE OR REPLACE FUNCTION update_contributors() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contributors (wallet_address, chain_id, total_amount_wei, contribution_count, last_contribution_at, is_anonymous, updated_at)
  VALUES (NEW.donor_address, NEW.chain_id, NEW.amount_wei, 1, NEW.block_timestamp, NEW.is_anonymous, NOW())
  ON CONFLICT (wallet_address, chain_id)
  DO UPDATE SET
    total_amount_wei = contributors.total_amount_wei + NEW.amount_wei,
    contribution_count = contributors.contribution_count + 1,
    -- [SAFETY] Prevent out-of-order execution from overwriting newer timestamps
    last_contribution_at = GREATEST(contributors.last_contribution_at, NEW.block_timestamp),
    is_anonymous = NEW.is_anonymous, 
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_contributors ON contributor_events;
CREATE TRIGGER trg_update_contributors AFTER INSERT ON contributor_events FOR EACH ROW EXECUTE FUNCTION update_contributors();



-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

ALTER TABLE contributor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service manages users" ON users FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service manages bills" ON bills FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service can read contributor events" ON contributor_events FOR SELECT USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS NOT ENABLED ON PLANS TABLE AS IT IS REMOVED
-- -----------------------------------------------------------------------------

-- Public Read Policies
DROP POLICY IF EXISTS "Public can view chains" ON chains;
CREATE POLICY "Public can view chains" ON chains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view ads" ON ad_profiles;
CREATE POLICY "Public can view ads" ON ad_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view contributors" ON contributors;
CREATE POLICY "Public can view contributors" ON contributors FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- 8. PENDING CONTRIBUTIONS (Push-Based Ingestion)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pending_contributions (
    tx_hash VARCHAR(66) PRIMARY KEY,
    chain_id INT NOT NULL DEFAULT 8453,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'failed')),
    retries INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for retry worker
CREATE INDEX IF NOT EXISTS idx_pending_status_created ON pending_contributions(status, created_at);

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS pending_contributions_updated_at ON pending_contributions;
CREATE TRIGGER pending_contributions_updated_at BEFORE UPDATE ON pending_contributions FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Enable RLS
ALTER TABLE pending_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service manages pending contributions" ON pending_contributions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 10. BILL GENERATION SOFT QUEUE (Free-Tier Safe)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bill_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL,
    chain_id INT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    bill_id TEXT, -- Populated upon completion
    error TEXT,
    queue_position INT DEFAULT 0, -- Deprecated, dynamic calculation used
    metadata JSONB DEFAULT '{}',  -- [NEW] Stores connectedWallet, etc.
    heartbeat_at TIMESTAMPTZ,     -- [NEW] For active crash detection
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one active job per transaction
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_tx_chain ON bill_jobs(tx_hash, chain_id);

-- Efficient polling & crash recovery
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON bill_jobs(status, created_at);

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS bill_jobs_updated_at ON bill_jobs;
CREATE TRIGGER bill_jobs_updated_at BEFORE UPDATE ON bill_jobs FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS
ALTER TABLE bill_jobs ENABLE ROW LEVEL SECURITY;

-- Public Policies
DROP POLICY IF EXISTS "Public can view jobs" ON bill_jobs;
DROP POLICY IF EXISTS "Public can insert jobs" ON bill_jobs;

-- Only backend/service role should manage jobs
CREATE POLICY "Service manages bill jobs"
ON bill_jobs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- ATOMIC CLAIM RPC (CRITICAL FOR CONCURRENCY)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_next_bill_job()
RETURNS TABLE(id uuid, tx_hash text, chain_id int, metadata jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE bill_jobs
  SET status = 'processing',
      updated_at = now(),
      heartbeat_at = now()
  WHERE bill_jobs.id = (
    SELECT bill_jobs.id FROM bill_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING bill_jobs.id, bill_jobs.tx_hash, bill_jobs.chain_id, bill_jobs.metadata;
END;
$$;

REVOKE EXECUTE ON FUNCTION claim_next_bill_job() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION claim_next_bill_job() FROM anon;
REVOKE EXECUTE ON FUNCTION claim_next_bill_job() FROM authenticated;
