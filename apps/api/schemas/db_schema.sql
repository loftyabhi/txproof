-- Database Schema for Chain Receipt

CREATE TABLE IF NOT EXISTS chains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    chain_id INT NOT NULL UNIQUE,
    rpc_url TEXT NOT NULL,
    explorer_url TEXT,
    currency_symbol VARCHAR(10) DEFAULT 'ETH',
    config_json JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(42) PRIMARY KEY,
    is_registered BOOLEAN DEFAULT FALSE,
    registration_tx VARCHAR(66),
    registered_at TIMESTAMP,
    current_plan_id INT,
    plan_expiry TIMESTAMP,
    bills_generated INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    validity_seconds INT NOT NULL, -- e.g., 2592000 for 30 days
    price_wei NUMERIC(78, 0) DEFAULT 0,
    generation_limit INT DEFAULT 10,
    has_ads BOOLEAN DEFAULT TRUE,
    can_download_pdf BOOLEAN DEFAULT FALSE,
    ad_profile_id INT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) REFERENCES users(wallet_address),
    tx_hash VARCHAR(66) NOT NULL,
    chain_id INT REFERENCES chains(chain_id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    bill_json JSONB,
    audit_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    html_content TEXT,
    click_url TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes & Constraints
CREATE INDEX idx_bills_wallet ON bills(wallet_address);
CREATE INDEX idx_bills_tx ON bills(tx_hash);
CREATE UNIQUE INDEX uniq_bill_tx_chain ON bills(tx_hash, chain_id);

-- Foreign Keys (Added later to handle table order)
DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT fk_users_plan FOREIGN KEY (current_plan_id) REFERENCES plans(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS bills_updated_at ON bills;
CREATE TRIGGER bills_updated_at
BEFORE UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
