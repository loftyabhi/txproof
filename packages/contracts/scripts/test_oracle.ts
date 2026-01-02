import { PriceOracleService } from '../src/services/PriceOracleService';

async function testOracle() {
    const oracle = new PriceOracleService();

    console.log('--- Testing Price Oracle ---');

    // Test 1: Historical ETH Price (Base)
    try {
        const timestamp = 1700000000; // Nov 14 2023
        const result = await oracle.getPrice(8453, 'native', timestamp);
        console.log(`[PASS] Base ETH Price at ${timestamp}: $${result.price} (Source: ${result.source})`);
    } catch (e) {
        console.error('[FAIL] Base ETH Price:', e);
    }

    // Test 2: Historical USDC Price (Base)
    try {
        const timestamp = 1700000000;
        const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
        const result = await oracle.getPrice(8453, usdcAddress, timestamp);
        console.log(`[PASS] Base USDC Price at ${timestamp}: $${result.price} (Source: ${result.source})`);
    } catch (e) {
        console.error('[FAIL] Base USDC Price:', e);
    }
}

testOracle();
