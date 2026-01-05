import dotenv from 'dotenv';
import { ContributionService } from '../src/services/ContributionService';

// Load env vars
dotenv.config({ path: '.env' });

async function main() {
    console.log('[RetryWorker] Starting...');
    const service = new ContributionService();
    try {
        await service.retryPendingRecords();
        console.log('[RetryWorker] Done.');
        process.exit(0);
    } catch (error) {
        console.error('[RetryWorker] Failed:', error);
        process.exit(1);
    }
}

main();
