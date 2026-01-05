import dotenv from 'dotenv';
import { ContributionService } from '../src/services/ContributionService';
import { supabase } from '../src/lib/supabase';

// Load env vars
dotenv.config({ path: '.env' });

/**
 * Usage: npx ts-node apps/api/scripts/verify_contribution_flow.ts <TX_HASH>
 */
async function main() {
    const txHash = process.argv[2];

    if (!txHash) {
        console.error("Usage: ts-node verify_contribution_flow.ts <TX_HASH>");
        process.exit(1);
    }

    console.log(`[Verify] Starting manual verification for ${txHash}`);
    const service = new ContributionService();

    try {
        // 1. Submit
        console.log('[Verify] Submitting...');
        const result = await service.submitContribution(txHash, false);
        console.log('[Verify] Submit Result:', result);

        // 2. Poll DB for status
        console.log('[Verify] Polling DB for confirmation...');
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s

            const { data } = await supabase
                .from('pending_contributions')
                .select('*')
                .eq('tx_hash', txHash)
                .single();

            if (data) {
                console.log(`[Verify] Try ${i + 1}: Status=${data.status}, Retries=${data.retries}`);

                if (data.status === 'confirmed') {
                    console.log('✅ SUCCESS: Contribution Confirmed.');
                    console.log('Checking contributor_events...');
                    const { data: event } = await supabase
                        .from('contributor_events')
                        .select('*')
                        .eq('tx_hash', txHash)
                        .single();

                    if (event) {
                        console.log('✅ Event Found:', event.id);
                        process.exit(0);
                    } else {
                        console.error('❌ ERROR: Confirmed but event missing!');
                        process.exit(1);
                    }
                } else if (data.status === 'failed') {
                    console.error(`❌ FAILED: ${data.last_error}`);
                    process.exit(1);
                }
            }
        }
        console.log('⚠️ Timed out waiting for confirmation. (Check reorg safety?)');
        process.exit(0);

    } catch (error) {
        console.error('[Verify] Crash:', error);
        process.exit(1);
    }
}

main();
