-- ============================================================
-- CLASSIFIER PROTOCOL REGISTRY SCHEMA
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── CHAIN CONFIGURATIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS chain_configs (
    chain_id              INTEGER PRIMARY KEY,
    name                  VARCHAR(100) NOT NULL,
    native_symbol         VARCHAR(10)  NOT NULL,
    w_native_address      VARCHAR(42),
    dust_threshold_wei    VARCHAR(40)  NOT NULL DEFAULT '1000',
    chain_type            VARCHAR(10)  NOT NULL CHECK (chain_type IN ('L1', 'L2', 'L3')),
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── PROTOCOLS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS protocols (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) NOT NULL UNIQUE,  -- 'uniswap-v3', 'aave-v3'
    name        VARCHAR(100) NOT NULL,         -- 'Uniswap V3'
    category    VARCHAR(50)  NOT NULL CHECK (category IN (
                    'dex', 'lending', 'bridge', 'nft_marketplace',
                    'staking', 'governance', 'yield', 'social', 'other'
                )),
    website     VARCHAR(255),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PROTOCOL ADDRESSES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS protocol_addresses (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id     UUID        NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    chain_id        INTEGER     NOT NULL REFERENCES chain_configs(chain_id),
    address         VARCHAR(42) NOT NULL,
    address_type    VARCHAR(50) NOT NULL CHECK (address_type IN (
                        'router', 'factory', 'pool', 'vault', 'marketplace',
                        'bridge_gateway', 'staking_contract', 'governance_contract',
                        'entry_point', 'lending_pool', 'lending_market',
                        'reward_distributor', 'other'
                    )),
    label           VARCHAR(100) NOT NULL,  -- 'Router V2', 'USDC Market'
    confidence_boost NUMERIC(4,3) NOT NULL DEFAULT 0.350 
                    CHECK (confidence_boost BETWEEN 0 AND 1),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    deprecated_at   TIMESTAMPTZ,
    source          VARCHAR(255),   -- 'manual' | 'github:org/repo@commit'
    added_by        VARCHAR(100),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_chain_address UNIQUE (chain_id, address)
);

-- ── EVENT SIGNATURES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_signatures (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    topic0          VARCHAR(66) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,        -- 'Swap', 'Supply', 'OrderFulfilled'
    category        VARCHAR(50)  NOT NULL CHECK (category IN (
                        'dex_swap', 'dex_liquidity_add', 'dex_liquidity_remove',
                        'lending_deposit', 'lending_withdraw', 'lending_borrow',
                        'lending_repay', 'lending_liquidation', 'flash_loan',
                        'bridge_send', 'bridge_receive',
                        'nft_sale', 'nft_mint',
                        'staking_deposit', 'staking_withdraw', 'staking_reward',
                        'governance_vote', 'governance_propose',
                        'governance_delegate', 'governance_execute',
                        'token_approval', 'social',
                        'proxy_upgrade', 'aa_userop'
                    )),
    confidence_boost NUMERIC(4,3) NOT NULL DEFAULT 0.250
                    CHECK (confidence_boost BETWEEN 0 AND 1),
    abi_fragment    TEXT,           -- JSON ABI fragment for decoding
    protocol_id     UUID REFERENCES protocols(id),  -- optional: belongs to specific protocol
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── FUNCTION SELECTORS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS function_selectors (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    selector        VARCHAR(10) NOT NULL,     -- '0x38ed1739'
    name            VARCHAR(100) NOT NULL,    -- 'swapExactTokensForTokens'
    category        VARCHAR(50)  NOT NULL,    -- same category enum as events
    confidence_boost NUMERIC(4,3) NOT NULL DEFAULT 0.150
                    CHECK (confidence_boost BETWEEN 0 AND 1),
    protocol_id     UUID REFERENCES protocols(id),
    abi_fragment    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_selector_protocol UNIQUE (selector, protocol_id)
);

-- Add unique index for protocol-less selectors to allow ON CONFLICT correctly
CREATE UNIQUE INDEX IF NOT EXISTS uq_selector_no_protocol 
    ON function_selectors(selector) 
    WHERE protocol_id IS NULL;

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_protocol_addresses_chain_address 
    ON protocol_addresses(chain_id, address) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_protocol_addresses_chain_type 
    ON protocol_addresses(chain_id, address_type) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_protocol_addresses_protocol 
    ON protocol_addresses(protocol_id) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_event_signatures_category 
    ON event_signatures(category);

CREATE INDEX IF NOT EXISTS idx_function_selectors_selector 
    ON function_selectors(selector);

CREATE INDEX IF NOT EXISTS idx_function_selectors_category 
    ON function_selectors(category);

-- ── TRIGGERS: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protocols_updated_at ON protocols;
CREATE TRIGGER trg_protocols_updated_at
    BEFORE UPDATE ON protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_protocol_addresses_updated_at ON protocol_addresses;
CREATE TRIGGER trg_protocol_addresses_updated_at
    BEFORE UPDATE ON protocol_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_chain_configs_updated_at ON chain_configs;
CREATE TRIGGER trg_chain_configs_updated_at
    BEFORE UPDATE ON chain_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
