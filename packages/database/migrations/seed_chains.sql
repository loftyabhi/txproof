-- Seed Chains Data
INSERT INTO chains (name, chain_id, explorer_url, currency_symbol)
VALUES 
    ('Base', 8453, 'https://basescan.org', 'ETH'),
    ('Base Sepolia', 84532, 'https://sepolia.basescan.org', 'ETH')
ON CONFLICT (chain_id) DO UPDATE SET
    name = EXCLUDED.name,
    explorer_url = EXCLUDED.explorer_url,
    currency_symbol = EXCLUDED.currency_symbol;
