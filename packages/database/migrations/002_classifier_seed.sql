-- ============================================================
-- CLASSIFIER PROTOCOL REGISTRY SEED
-- ============================================================

-- ── CHAIN CONFIGURATIONS ─────────────────────────────────────
INSERT INTO chain_configs (chain_id, name, native_symbol, dust_threshold_wei, chain_type) VALUES
    (1, 'Ethereum', 'ETH', '100000000000000', 'L1'),
    (10, 'Optimism', 'ETH', '10000000000000', 'L2'),
    (42161, 'Arbitrum', 'ETH', '10000000000000', 'L2'),
    (8453, 'Base', 'ETH', '10000000000000', 'L2'),
    (137, 'Polygon', 'MATIC', '100000000000000000', 'L1'),
    (56, 'BSC', 'BNB', '1000000000000000', 'L1')
ON CONFLICT (chain_id) DO NOTHING;

-- ── PROTOCOLS ────────────────────────────────────────────────
-- (Temporary table to simplify inserting with generated UUIDs)
CREATE TEMP TABLE tmp_protocols (
    slug VARCHAR(100),
    name VARCHAR(100),
    category VARCHAR(50)
);

INSERT INTO tmp_protocols (slug, name, category) VALUES
    ('uniswap-v2', 'Uniswap V2', 'dex'),
    ('uniswap-v3', 'Uniswap V3', 'dex'),
    ('uniswap-universal-router', 'Uniswap Universal Router', 'dex'),
    ('sushiswap-v2', 'SushiSwap V2', 'dex'),
    ('pancakeswap-v2', 'PancakeSwap V2', 'dex'),
    ('pancakeswap-v3', 'PancakeSwap V3', 'dex'),
    ('1inch-v3', '1inch V3', 'dex'),
    ('1inch-v4', '1inch V4', 'dex'),
    ('1inch-v5', '1inch V5', 'dex'),
    ('1inch-v6', '1inch V6', 'dex'),
    ('0x-exchange', '0x Exchange', 'dex'),
    ('balancer-v2', 'Balancer V2', 'dex'),
    ('curve-finance', 'Curve Finance', 'dex'),
    ('aerodrome', 'Aerodrome', 'dex'),
    ('velodrome', 'Velodrome', 'dex'),
    ('quickswap', 'QuickSwap', 'dex'),

    ('aave-v2', 'Aave V2', 'lending'),
    ('aave-v3', 'Aave V3', 'lending'),
    ('compound-v2', 'Compound V2', 'lending'),
    ('compound-v3', 'Compound V3', 'lending'),
    ('morpho-blue', 'Morpho Blue', 'lending'),

    ('optimism-bridge', 'Optimism Bridge', 'bridge'),
    ('arbitrum-bridge', 'Arbitrum Bridge', 'bridge'),
    ('base-bridge', 'Base Bridge', 'bridge'),
    ('polygon-bridge', 'Polygon Bridge', 'bridge'),
    ('zora-bridge', 'Zora Bridge', 'bridge'),
    ('linea-bridge', 'Linea Bridge', 'bridge'),
    ('zksync-bridge', 'zkSync Bridge', 'bridge'),
    ('hop-protocol', 'Hop Protocol', 'bridge'),
    ('across-protocol', 'Across Protocol', 'bridge'),

    ('opensea-seaport-1-5', 'OpenSea Seaport 1.5', 'nft_marketplace'),
    ('opensea-seaport-1-6', 'OpenSea Seaport 1.6', 'nft_marketplace'),
    ('blur', 'Blur', 'nft_marketplace'),
    ('blur-bid', 'Blur Bidding', 'nft_marketplace'),
    ('looksrare', 'LooksRare', 'nft_marketplace'),
    ('x2y2', 'X2Y2', 'nft_marketplace'),

    ('lido', 'Lido', 'staking'),
    ('eth2-deposit', 'ETH2 Deposit Contract', 'staking'),
    ('rocket-pool', 'Rocket Pool', 'staking'),
    ('convex-finance', 'Convex Finance', 'staking'),
    ('convex', 'Convex', 'staking'),
    ('curve-gauge', 'Curve Gauge', 'staking'),

    ('uniswap-governance', 'Uniswap Governance', 'governance'),
    ('aave-governance', 'Aave Governance', 'governance'),
    ('compound-governance', 'Compound Governance', 'governance'),

    ('erc4337-entrypoint-v06', 'ERC-4337 EntryPoint v0.6', 'other'),
    ('erc4337-entrypoint-v07', 'ERC-4337 EntryPoint v0.7', 'other'),
    ('gnosis-safe', 'Gnosis Safe', 'other');

INSERT INTO protocols (slug, name, category)
SELECT slug, name, category FROM tmp_protocols
ON CONFLICT (slug) DO NOTHING;

-- ── PROTOCOL ADDRESSES ───────────────────────────────────────
CREATE TEMP TABLE tmp_addresses (
    protocol_slug VARCHAR(100),
    chain_id INTEGER,
    address VARCHAR(42),
    address_type VARCHAR(50),
    label VARCHAR(100),
    confidence_boost NUMERIC(4,3)
);

INSERT INTO tmp_addresses (protocol_slug, chain_id, address, address_type, label, confidence_boost) VALUES
-- DEX ROUTERS
('uniswap-v2', 1, '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', 'router', 'Uniswap V2 Router', 0.350),
('uniswap-v3', 1, '0xe592427a0aece92de3edee1f18e0157c05861564', 'router', 'Uniswap V3 Router (old)', 0.350),
('uniswap-v3', 1, '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', 'router', 'Uniswap V3 Router 2', 0.350),
('uniswap-universal-router', 1, '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad', 'router', 'Uniswap Universal Router', 0.350),
('sushiswap-v2', 1, '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f', 'router', 'SushiSwap V2 Router', 0.350),
('1inch-v3', 1, '0x11111112542d85b3ef69ae05771c2dccff4faa26', 'router', '1inch V3 Router', 0.350),
('1inch-v4', 1, '0x1111111254fb6c44bac0bed2854e76f90643097d', 'router', '1inch V4 Router', 0.350),
('1inch-v5', 1, '0x1111111254eea2514d8f0f03ce855018a9947703', 'router', '1inch V5 Router', 0.350),
('1inch-v6', 1, '0x111111125421ca6dc452d289314280a0f8842a65', 'router', '1inch V6 Router', 0.350),
('0x-exchange', 1, '0xdef1c0ded9bec7f1a1670819833240f027b25eff', 'router', '0x Exchange Proxy', 0.350),
('balancer-v2', 1, '0xba12222222228d8ba445958a75a0704d566bf2c8', 'vault', 'Balancer V2 Vault', 0.350),
('curve-finance', 1, '0x99a58482bd75cbab83b27ec03ca68ff489b5788f', 'router', 'Curve Finance Router', 0.350),

('uniswap-v3', 10, '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', 'router', 'Uniswap V3 Router 2', 0.350),
('velodrome', 10, '0x9c12939390052919af3155f41bf4160fd3666a6f', 'router', 'Velodrome Router', 0.350),
('1inch-v5', 10, '0x1111111254eea2514d8f0f03ce855018a9947703', 'router', '1inch V5 Router', 0.350),

('uniswap-v3', 42161, '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', 'router', 'Uniswap V3 Router 2', 0.350),
('sushiswap-v2', 42161, '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', 'router', 'SushiSwap V2 Router', 0.350),
('1inch-v5', 42161, '0x1111111254eea2514d8f0f03ce855018a9947703', 'router', '1inch V5 Router', 0.350),
('uniswap-v3', 42161, '0xe592427a0aece92de3edee1f18e0157c05861564', 'router', 'Uniswap V3 Router (old)', 0.350),

('uniswap-v3', 8453, '0x2626664c2603336e57b271c5c0b26f421741e481', 'router', 'Uniswap V3 Router', 0.350),
('uniswap-v2', 8453, '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24', 'router', 'Uniswap V2 Router', 0.350),
('aerodrome', 8453, '0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43', 'router', 'Aerodrome Router', 0.350),

('uniswap-v3', 137, '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45', 'router', 'Uniswap V3 Router 2', 0.350),
('sushiswap-v2', 137, '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', 'router', 'SushiSwap V2 Router', 0.350),
('quickswap', 137, '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff', 'router', 'QuickSwap Router', 0.350),

('pancakeswap-v2', 56, '0x10ed43c718714eb63d5aa57b78b54704e256024e', 'router', 'PancakeSwap V2 Router', 0.350),
('pancakeswap-v3', 56, '0x13f4ea83d0bd40e75c8222255bc855a974568dd4', 'router', 'PancakeSwap V3 Router', 0.350),
('sushiswap-v2', 56, '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', 'router', 'SushiSwap V2 Router', 0.350),

-- LENDING POOLS
('aave-v2', 1, '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9', 'lending_pool', 'Aave V2 Lending Pool', 0.350),
('aave-v3', 1, '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2', 'lending_pool', 'Aave V3 Lending Pool', 0.350),
('compound-v2', 1, '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', 'lending_market', 'Compound V2 Market', 0.350),
('compound-v3', 1, '0xc3d688b66703497daa19211eedff47f25384cdc3', 'lending_market', 'Compound V3 Market', 0.350),
('morpho-blue', 1, '0x1eb454257711893278f0b0bb8e7ad25ee297e5d6', 'lending_pool', 'Morpho Blue Pool', 0.350),

('aave-v3', 10, '0x794a61358d6845594f94dc1db02a252b5b4814ad', 'lending_pool', 'Aave V3 Lending Pool', 0.350),
('aave-v3', 42161, '0x794a61358d6845594f94dc1db02a252b5b4814ad', 'lending_pool', 'Aave V3 Lending Pool', 0.350),
('aave-v3', 8453, '0xa238dd80c259a72e81d7e4664a9801593f98d1c5', 'lending_pool', 'Aave V3 Lending Pool', 0.350),
('aave-v3', 137, '0x794a61358d6845594f94dc1db02a252b5b4814ad', 'lending_pool', 'Aave V3 Lending Pool', 0.350),
('aave-v2', 137, '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf', 'lending_pool', 'Aave V2 Lending Pool', 0.350),

-- BRIDGES
('optimism-bridge', 1, '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1', 'bridge_gateway', 'Optimism Bridge L1', 0.350),
('arbitrum-bridge', 1, '0x8315177ab297ba92a06054ce80a67ed4dbd7ed3a', 'bridge_gateway', 'Arbitrum Bridge L1', 0.350),
('base-bridge', 1, '0x49048044d57e1c92a77f79988d21fa8faf74e97e', 'bridge_gateway', 'Base Bridge L1', 0.350),
('polygon-bridge', 1, '0xa0c68c638235ee32657e8f720a23cec1bfc77c77', 'bridge_gateway', 'Polygon Bridge L1', 0.350),
('zora-bridge', 1, '0x72a53cdbbcc1b9efa39c834a540550e23463aacb', 'bridge_gateway', 'Zora Bridge L1', 0.350),
('linea-bridge', 1, '0xd19d4b5d358258f05d7b411e21a1460d11b0876f', 'bridge_gateway', 'Linea Bridge L1', 0.350),
('zksync-bridge', 1, '0x32400084c286cf3e17e7b677ea9583e60a000324', 'bridge_gateway', 'zkSync Bridge L1', 0.350),

('optimism-bridge', 10, '0x4200000000000000000000000000000000000010', 'bridge_gateway', 'Optimism Bridge L2', 0.350),
('arbitrum-bridge', 42161, '0x0b9857ae2d4a3dbe74ffe1d7df045bb7f96e4840', 'bridge_gateway', 'Arbitrum Bridge L2', 0.350),
('base-bridge', 8453, '0x4200000000000000000000000000000000000010', 'bridge_gateway', 'Base Bridge L2', 0.350),
('polygon-bridge', 137, '0x8484ef722627bf18ca5ae6bcf031c23e6e922b30', 'bridge_gateway', 'Polygon Bridge L2', 0.350),

-- NFT MARKETPLACES
('opensea-seaport-1-5', 1, '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', 'marketplace', 'Seaport 1.5', 0.400),
('opensea-seaport-1-6', 1, '0x0000000000000068f116a894984e2db1123eb395', 'marketplace', 'Seaport 1.6', 0.400),
('blur', 1, '0x000000000000ad05ccc4f10045630fb830b95127', 'marketplace', 'Blur', 0.400),
('blur-bid', 1, '0xb2ecfe4e4d61f8790bbb9de2d1259b9e2410cea5', 'marketplace', 'Blur Bidding', 0.400),
('looksrare', 1, '0x59728544b08ab483533076417fbbb2fd0b17ce3a', 'marketplace', 'LooksRare', 0.400),
('x2y2', 1, '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3', 'marketplace', 'X2Y2', 0.400),

-- SEAPORT CROSS-CHAIN
('opensea-seaport-1-5', 10, '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', 'marketplace', 'Seaport 1.5', 0.400),
('opensea-seaport-1-6', 10, '0x0000000000000068f116a894984e2db1123eb395', 'marketplace', 'Seaport 1.6', 0.400),
('opensea-seaport-1-5', 42161, '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', 'marketplace', 'Seaport 1.5', 0.400),
('opensea-seaport-1-6', 42161, '0x0000000000000068f116a894984e2db1123eb395', 'marketplace', 'Seaport 1.6', 0.400),
('opensea-seaport-1-5', 8453, '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', 'marketplace', 'Seaport 1.5', 0.400),
('opensea-seaport-1-6', 8453, '0x0000000000000068f116a894984e2db1123eb395', 'marketplace', 'Seaport 1.6', 0.400),
('opensea-seaport-1-5', 137, '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', 'marketplace', 'Seaport 1.5', 0.400),
('opensea-seaport-1-6', 137, '0x0000000000000068f116a894984e2db1123eb395', 'marketplace', 'Seaport 1.6', 0.400),

-- STAKING CONTRACTS
('lido', 1, '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', 'staking_contract', 'Lido Stake', 0.350),
('eth2-deposit', 1, '0x00000000219ab540356cbb839cbe05303d7705fa', 'staking_contract', 'ETH2 Deposit Contract', 0.350),
('rocket-pool', 1, '0xdd9bc35ae942ef0cfa76930954a156b3ff30a4e1', 'staking_contract', 'Rocket Pool Stake', 0.350),
('convex', 1, '0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2', 'staking_contract', 'Convex Stake', 0.350),

-- GOVERNANCE CONTRACTS
('uniswap-governance', 1, '0x408ed6354d4973f66138c91495f2f2fcbd8724c3', 'governance_contract', 'Uniswap Governance', 0.350),
('aave-governance', 1, '0x9aee0b04504cef83a65ac3f0e838d0593bcb2bc7', 'governance_contract', 'Aave Governance', 0.350),
('compound-governance', 1, '0xc0da02939e1441f497fd74f78ce7decb17b66529', 'governance_contract', 'Compound Governance', 0.350),

-- ENTRY POINTS (ALL CHAINS)
('erc4337-entrypoint-v06', 1, '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', 'entry_point', 'EntryPoint v0.6', 0.400),
('erc4337-entrypoint-v07', 1, '0x0000000071727de22e5e9d8baf0edac6f37da032', 'entry_point', 'EntryPoint v0.7', 0.400),
('erc4337-entrypoint-v06', 10, '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', 'entry_point', 'EntryPoint v0.6', 0.400),
('erc4337-entrypoint-v07', 10, '0x0000000071727de22e5e9d8baf0edac6f37da032', 'entry_point', 'EntryPoint v0.7', 0.400),
('erc4337-entrypoint-v06', 42161, '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', 'entry_point', 'EntryPoint v0.6', 0.400),
('erc4337-entrypoint-v07', 42161, '0x0000000071727de22e5e9d8baf0edac6f37da032', 'entry_point', 'EntryPoint v0.7', 0.400),
('erc4337-entrypoint-v06', 8453, '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', 'entry_point', 'EntryPoint v0.6', 0.400),
('erc4337-entrypoint-v07', 8453, '0x0000000071727de22e5e9d8baf0edac6f37da032', 'entry_point', 'EntryPoint v0.7', 0.400),
('erc4337-entrypoint-v06', 137, '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', 'entry_point', 'EntryPoint v0.6', 0.400),
('erc4337-entrypoint-v07', 137, '0x0000000071727de22e5e9d8baf0edac6f37da032', 'entry_point', 'EntryPoint v0.7', 0.400),
('erc4337-entrypoint-v06', 56, '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', 'entry_point', 'EntryPoint v0.6', 0.400),
('erc4337-entrypoint-v07', 56, '0x0000000071727de22e5e9d8baf0edac6f37da032', 'entry_point', 'EntryPoint v0.7', 0.400);

INSERT INTO protocol_addresses (protocol_id, chain_id, address, address_type, label, confidence_boost)
SELECT p.id, t.chain_id, t.address, t.address_type, t.label, t.confidence_boost
FROM tmp_addresses t
JOIN protocols p ON p.slug = t.protocol_slug
ON CONFLICT (chain_id, address) DO NOTHING;

-- ── EVENT SIGNATURES ─────────────────────────────────────────
CREATE TEMP TABLE tmp_events (
    topic0 VARCHAR(66),
    name VARCHAR(100),
    category VARCHAR(50),
    confidence_boost NUMERIC(4,3)
);

INSERT INTO tmp_events (topic0, name, category, confidence_boost) VALUES
-- DEX
('0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822', 'Uniswap V2 Swap', 'dex_swap', 0.250),
('0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67', 'Uniswap V3 Swap', 'dex_swap', 0.250),
('0x2170c741c41531aec20e7c107c24eecfdd15e69c9bb0a8dd37b1840b9e0b207b', 'Balancer Swap', 'dex_swap', 0.250),
('0x8b3e96f2b889fa771c53c981b40daf005f63f637f1869f707052d15a3dd97140', 'Curve Exchange', 'dex_swap', 0.250),
('0x087e682a9db3d440875c75567c29378626c9a9415c4856b3e71783f98285559d', '1inch Swapped', 'dex_swap', 0.230),
('0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f', 'Uniswap V2 Mint', 'dex_liquidity_add', 0.250),
('0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496', 'Uniswap V2 Burn', 'dex_liquidity_remove', 0.250),
('0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde', 'Uniswap V3 Mint', 'dex_liquidity_add', 0.250),
('0x0c396cd989a39f4459b5fa1aed6a9a8dcdbc45908acfd67e028cd568da98982c', 'Uniswap V3 Burn', 'dex_liquidity_remove', 0.250),
('0x26f55a85081d24974e85c6c00045d0f0453991e95873f52bff0d21af4079a768', 'Curve Add Liquidity', 'dex_liquidity_add', 0.250),

-- NFT
('0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31', 'Seaport OrderFulfilled', 'nft_sale', 0.450),
('0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64', 'Blur OrderMatched', 'nft_sale', 0.450),
('0x68cd251d4d267c6e2034ff0088b99c381c1369187d6b832b096a84aaefeb6546', 'LooksRare TakerAsk', 'nft_sale', 0.450),
('0x3ee3de4684413690dee6fff1a0a4f934e643255547c92e75306e745f8cdea2d2', 'LooksRare TakerBid', 'nft_sale', 0.450),

-- LENDING
('0xde6857219544bb5b7746f48ed30be6386fefc61b2f864cacf559893bf50fd951', 'Aave Supply', 'lending_deposit', 0.250),
('0x3115d1449a7b732c986cba18244e897a450f61e1bb8d589cd2e69e6c8924f9f7', 'Aave Withdraw', 'lending_withdraw', 0.250),
('0xc6a898309e823ee50bac64e45ca8adba6690e99e7841c45d754e2a38e9019d9b', 'Aave Borrow', 'lending_borrow', 0.250),
('0x4cdde6e09bb755c9a5589ebaec640bbfedff1362d4b255ebf8339782b9942faa', 'Aave Repay', 'lending_repay', 0.250),
('0xe413a321e8681d831f4dbccbca790d2952b56f977908e45be37335533e005286', 'Aave Liquidation', 'lending_liquidation', 0.300),
('0x631042c832b07452973831137f2d73e395028b44b250de141512d1874b493778', 'Aave FlashLoan', 'flash_loan', 0.400),
('0xe5b754fb1abb7f01b499791d0b820ae3b6af3424ac1c59768edb53f4ec31a929', 'Compound Redeem', 'lending_withdraw', 0.250),
('0x13ed6866d4e1ee6da46f16c3d936f33f85f6b6189124208d58d43381285286a8', 'Compound Borrow', 'lending_borrow', 0.250),
('0x1a2a22cb034d26d1854bdc6666a5b91fe25efbbb5dcad3b0355478d6f5c362a1', 'Compound RepayBorrow', 'lending_repay', 0.250),

-- BRIDGE
('0x02a52367d10742d8032712c1bb8e0144ff1ec5ffda1ed7d70bb05a2744955054', 'OP MessagePassed', 'bridge_send', 0.300),
('0x4641df4a962071e12719d8c8c8e5ac7fc4d97b927346a3d7a335b1f7517e133c', 'OP MessageRelayed', 'bridge_receive', 0.300),
('0x73d170910aba9e6d50b102db522b1dbcd796216f5128b445aa2135272886497e', 'BridgeTransferSent', 'bridge_send', 0.280),
('0x1b2a7ff080b8cb6ff436ce0372e399692bbfb6d4ae5766fd8d58a7b8cc6142e6', 'BridgeTransferReceived', 'bridge_receive', 0.280),
('0x35697241dfb2568469d80f845ac3253b22ab1e330a1c6827a4d57a3e7902d515', 'DepositInitiated', 'bridge_send', 0.270),
('0x5824c2dd8fe164f2e518d6e3264426d40026e6ba94d9302e3392d4f3b7b25e19', 'WithdrawalProven', 'bridge_receive', 0.270),
('0xdb5c7652857aa163daadd670e116628fb42e869d8ac4251ef8971d9e5727df1b', 'WithdrawalFinalized', 'bridge_receive', 0.270),

-- STAKING
('0x9e71bc8eea02a63969f509818f2dafb9254532904319f9dbda79b67bd34a5f3d', 'Staked', 'staking_deposit', 0.280),
('0x7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d5', 'Withdrawn', 'staking_withdraw', 0.280),
('0xe2403640ba68fed3a2f88b7557551d1993f84b99bb10ff833f3cf823476f564', 'RewardPaid', 'staking_reward', 0.280),
('0x96a25c8ce0baabc1fdefd93e9ed25d8e092a3332f3aa9a41722b5697231d1d1a', 'Lido Submitted', 'staking_deposit', 0.350),

-- GOVERNANCE
('0xb8e138887d0aa13bab447e82de9dcd1777061d0d18dcbc747a82b7db5761c56b', 'VoteCast', 'governance_vote', 0.300),
('0xe2babfbac5889a709b63bb7f598b324e08bc5a4fb9ec647fb3cbc9ec07eb8712', 'VoteCastWithParams', 'governance_vote', 0.300),
('0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0', 'ProposalCreated', 'governance_propose', 0.300),
('0x3134e8a2e6d97e929a7e54011ea5485d7d196dd5f0ba4d4ef95803e8e3fc257f', 'DelegateChanged', 'governance_delegate', 0.280),
('0xdec2bacdd2f05b59de34da9b523dff8db32c408b72aa0a4171cd01d7445f8ef4', 'DelegateVotesChanged', 'governance_delegate', 0.200),
('0x712ae1383f79ac853f8d882153778e0260ef8f03b50e394fe5fdb00bed72c93d', 'ProposalExecuted', 'governance_execute', 0.300),

-- PROXY / AA
('0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b', 'EIP1967 Upgraded', 'proxy_upgrade', 0.000),
('0x49628fd147100edb3ef1d7634f6e33006d4e28293976af321d22cb2b05c751a3', 'UserOperationEvent', 'aa_userop', 0.400),

-- TOKEN
('0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', 'ERC20 Approval', 'token_approval', 0.300),
('0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31', 'ERC721 ApprovalForAll', 'token_approval', 0.300);

INSERT INTO event_signatures (topic0, name, category, confidence_boost)
SELECT topic0, name, category, confidence_boost FROM tmp_events
ON CONFLICT (topic0) DO NOTHING;

-- ── FUNCTION SELECTORS ───────────────────────────────────────
CREATE TEMP TABLE tmp_selectors (
    selector VARCHAR(10),
    name VARCHAR(100),
    category VARCHAR(50),
    confidence_boost NUMERIC(4,3)
);

INSERT INTO tmp_selectors (selector, name, category, confidence_boost) VALUES
-- DEX
('0x38ed1739', 'swapExactTokensForTokens', 'dex_swap', 0.150),
('0x8803dbee', 'swapTokensForExactTokens', 'dex_swap', 0.150),
('0x7ff36ab5', 'swapExactETHForTokens', 'dex_swap', 0.150),
('0x4a25d94a', 'swapTokensForExactETH', 'dex_swap', 0.150),
('0x18cbafe5', 'swapExactTokensForETH', 'dex_swap', 0.150),
('0xfb3bdb41', 'swapETHForExactTokens', 'dex_swap', 0.150),
('0x414bf389', 'exactInputSingle', 'dex_swap', 0.150),
('0xdb3e2198', 'exactOutputSingle', 'dex_swap', 0.150),
('0xc04b8d59', 'exactInput', 'dex_swap', 0.150),
('0x09b81346', 'exactOutput', 'dex_swap', 0.150),
('0x3593564c', 'execute', 'dex_swap', 0.150),
('0x5ae401dc', 'multisall', 'dex_swap', 0.150),
('0xac9650d8', 'multicall', 'dex_swap', 0.150),

-- DEX LIQUIDITY
('0xe8e33700', 'addLiquidity', 'dex_liquidity_add', 0.150),
('0xf305d719', 'addLiquidityETH', 'dex_liquidity_add', 0.150),
('0xbaa2abde', 'removeLiquidity', 'dex_liquidity_remove', 0.150),
('0x02751cec', 'removeLiquidityETH', 'dex_liquidity_remove', 0.150),

-- GOVERNANCE
('0x56781388', 'castVote', 'governance_vote', 0.200),
('0x7b3c71d3', 'castVoteWithReason', 'governance_vote', 0.200),
('0x3bccf4fd', 'castVoteBySig', 'governance_vote', 0.200),
('0xda95691a', 'propose', 'governance_propose', 0.200),
('0x5c19a95c', 'delegate', 'governance_delegate', 0.200),
('0xc3cda520', 'delegateBySig', 'governance_delegate', 0.200),
('0xfe0d94c1', 'execute', 'governance_execute', 0.200),

-- STAKING
('0xa694fc3a', 'stake', 'staking_deposit', 0.180),
('0x2e1a7d4d', 'withdraw', 'staking_withdraw', 0.180),
('0x3d18b912', 'getReward', 'staking_reward', 0.180),
('0xe9fad8ee', 'exit', 'staking_withdraw', 0.170),
('0xa1903eab', 'submit', 'staking_deposit', 0.220),
('0xd0e30db0', 'deposit', 'staking_deposit', 0.200),

-- TOKEN
('0x095ea7b3', 'approve', 'token_approval', 0.200),
('0x39509351', 'increaseAllowance', 'token_approval', 0.200),
('0xa457c2d7', 'decreaseAllowance', 'token_approval', 0.180),
('0xd505accf', 'permit', 'token_approval', 0.220);

INSERT INTO function_selectors (selector, name, category, confidence_boost)
SELECT selector, name, category, confidence_boost FROM tmp_selectors
ON CONFLICT (selector) DO NOTHING;

DROP TABLE tmp_protocols;
DROP TABLE tmp_addresses;
DROP TABLE tmp_events;
DROP TABLE tmp_selectors;
