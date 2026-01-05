import dotenv from 'dotenv';
import path from 'path';

// Load env from ../.env
dotenv.config({ path: path.join(__dirname, '../.env') });

import { IndexerService } from '../src/services/IndexerService';

async function main() {
    const args = process.argv.slice(2);
    const isBackfill = args.includes('--backfill');

    console.log(`Starting Indexer Script... (Mode: ${isBackfill ? 'BACKFILL' : 'PRODUCTION'})`);

    // Check if we stumbled into production without intent
    if (!isBackfill && process.env.NODE_ENV !== 'production' && !process.env.INDEXER_MODE) {
        console.warn("TIP: Use '--backfill' to run in fast-catchup mode.");
    }

    const indexer = new IndexerService();

    try {
        await indexer.sync({ backfill: isBackfill });
        console.log("Indexer Sync Completed Successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Indexer Sync Failed:", error);
        process.exit(1);
    }
}

main();
