-- Database Schema for Chain Receipt
-- Full Consolidated Schema (Includes Indexer, Ad Placement, and Hardening)

-- -----------------------------------------------------------------------------
-- 0. CLEANUP (Optional - Use with Caution)
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS contributor_events CASCADE;
-- DROP TABLE IF EXISTS indexer_state CASCADE;
-- DROP TABLE IF EXISTS contributors CASCADE;
-- DROP TABLE IF EXISTS bills CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS plans CASCADE;
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
    is_registered BOOLEAN DEFAULT FALSE,
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
    validity_interval INTERVAL NOT NULL, 
    price_wei NUMERIC(78, 0) DEFAULT 0,
    generation_limit INT DEFAULT 10,
    has_ads BOOLEAN DEFAULT TRUE,
    can_download_pdf BOOLEAN DEFAULT FALSE,
    ad_profile_id INT,
    is_active BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------------------------------
-- 4. ADS
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
-- 5. BILLS
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
-- 6. CONTRIBUTORS (Public Good Support)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contributors (
    wallet_address VARCHAR(42) NOT NULL,
    chain_id INT NOT NULL DEFAULT 84532, -- Default to Base Sepolia/Base
    total_amount_wei NUMERIC(78, 0) DEFAULT 0,
    contribution_count INT DEFAULT 0,
    last_contribution_at TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wallet_address, chain_id)
);

-- -----------------------------------------------------------------------------
-- 7. INDEXER STATE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS indexer_state (
    key VARCHAR(50),
    chain_id INT NOT NULL DEFAULT 84532,
    last_synced_block BIGINT NOT NULL CHECK (last_synced_block >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (key, chain_id)
);

-- -----------------------------------------------------------------------------
-- 8. INDEXER EVENTS (Immutable Log)
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

-- 2. Immutability Guards
CREATE OR REPLACE FUNCTION prevent_wallet_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'wallet_address is immutable';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_bill_update()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'COMPLETED' AND OLD.bill_json IS DISTINCT FROM NEW.bill_json THEN
      RAISE EXCEPTION 'bill_json is immutable after completion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  INSERT INTO contributors (wallet_address, chain_id, total_amount_wei, contribution_count, last_contribution_at, updated_at)
  VALUES (NEW.donor_address, NEW.chain_id, NEW.amount_wei, 1, NEW.block_timestamp, NOW())
  ON CONFLICT (wallet_address, chain_id)
  DO UPDATE SET
    total_amount_wei = contributors.total_amount_wei + NEW.amount_wei,
    contribution_count = contributors.contribution_count + 1,
    last_contribution_at = NEW.block_timestamp,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_contributors ON contributor_events;
CREATE TRIGGER trg_update_contributors AFTER INSERT ON contributor_events FOR EACH ROW EXECUTE FUNCTION update_contributors();

-- 4. Atomic Ingestion RPC
CREATE OR REPLACE FUNCTION ingest_contributor_events(
    p_chain_id INT,
    p_key VARCHAR,
    p_new_cursor BIGINT,
    p_events JSONB
) RETURNS VOID AS $$
DECLARE
    event_record JSONB;
BEGIN
    FOR event_record IN SELECT * FROM jsonb_array_elements(p_events)
    LOOP
        INSERT INTO contributor_events (
            chain_id, tx_hash, log_index, block_number, block_timestamp,
            donor_address, amount_wei, message
        ) VALUES (
            p_chain_id,
            (event_record->>'tx_hash')::VARCHAR,
            (event_record->>'log_index')::INT,
            (event_record->>'block_number')::BIGINT,
            (event_record->>'block_timestamp')::TIMESTAMP,
            (event_record->>'donor_address')::VARCHAR,
            (event_record->>'amount_wei')::NUMERIC,
             event_record->>'message'
        )
        ON CONFLICT (chain_id, tx_hash, log_index) DO NOTHING;
    END LOOP;

    INSERT INTO indexer_state (key, chain_id, last_synced_block, updated_at)
    VALUES (p_key, p_chain_id, p_new_cursor, NOW())
    ON CONFLICT (key, chain_id)
    DO UPDATE SET last_synced_block = p_new_cursor, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexer_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributor_events ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
DROP POLICY IF EXISTS "Public can view chains" ON chains;
CREATE POLICY "Public can view chains" ON chains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view plans" ON plans;
CREATE POLICY "Public can view plans" ON plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view ads" ON ad_profiles;
CREATE POLICY "Public can view ads" ON ad_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view contributors" ON contributors;
CREATE POLICY "Public can view contributors" ON contributors FOR SELECT USING (true);
