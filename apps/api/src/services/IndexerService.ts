import { ethers } from 'ethers';
import { supabase } from '../lib/supabase';

// --- Configuration ---
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_SUPPORT_VAULT_ADDRESS || "0x8a9496cdffd16250353ea19b1ff8ce4de4c294cf";
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) : 8453; // Default Base Mainnet

// Production Defaults
const PROD_BATCH_SIZE = 10;
const PROD_TIME_LIMIT_MS = 50 * 1000;

// Backfill Dynamic Config
const BF_MIN_BATCH = 10;
const BF_MAX_BATCH = 10_000;
const BF_TARGET_BATCH_COUNT = 50;

const SUPPORT_VAULT_ABI = [
    "event Contributed(address indexed contributor, address indexed token, uint256 amount, bool isAnonymous, uint256 timestamp)"
];

interface SyncOptions {
    force?: boolean;
    backfill?: boolean;
}

export class IndexerService {
    private provider: ethers.AbstractProvider;
    private contract: ethers.Contract | null = null;
    private ownerId: string;

    constructor() {
        const url = process.env.BASE_RPC_URL || "https://mainnet.base.org";
        this.provider = new ethers.JsonRpcProvider(url);
        this.ownerId = `worker-${Math.random().toString(36).substring(7)}`;
    }

    public async sync(options: SyncOptions = {}) {
        // 1. Determine Mode
        const isBackfill = options.backfill || process.env.INDEXER_MODE === 'backfill';
        const force = isBackfill ? true : (options.force || false);

        if (!VAULT_ADDRESS || !ethers.isAddress(VAULT_ADDRESS)) {
            console.error(`[Indexer] ABORT: Invalid VAULT_ADDRESS`);
            return;
        }

        if (!this.contract) {
            this.contract = new ethers.Contract(VAULT_ADDRESS, SUPPORT_VAULT_ABI, this.provider);
        }

        // 2. Fetch Latest Block (Once at start to define the goal)
        let latestBlock: number;
        try {
            latestBlock = await this.provider.getBlockNumber();
        } catch (err) {
            console.error('[Indexer] network failure: getBlockNumber', err);
            return;
        }

        // 3. Initial Claim (Get Lock & Cursor)
        // For backfill, we start with a safe Max to secure a wide lock if possible, 
        // though the loop will refine usage.
        const initialBatch = isBackfill ? BF_MAX_BATCH : PROD_BATCH_SIZE;

        const { data: lease, error: leaseError } = await supabase.rpc('claim_indexer_scan', {
            p_chain_id: CHAIN_ID,
            p_key: 'contributors_sync',
            p_owner_id: this.ownerId,
            p_force: force,
            p_batch_size: initialBatch
        });

        if (leaseError) throw leaseError;

        if (!lease || !lease.allowed) {
            if (isBackfill) console.warn(`[Indexer] Backfill lock denied: ${lease?.reason}`);
            else console.warn(`[Indexer] Skipped: ${lease?.reason || 'Denied'}`);
            return;
        }

        // 4. Execution Loop
        let currentBlockVal = Number(lease.start_block);
        const startTime = Date.now();
        let loopCount = 0;

        console.log(`[Indexer] Started ${isBackfill ? 'BACKFILL' : 'SYNC'}. Cursor: ${currentBlockVal}, Target: ${latestBlock}`);

        while (currentBlockVal < latestBlock) {
            // A. Check Time Bounds (Production Only)
            if (!isBackfill && (Date.now() - startTime > PROD_TIME_LIMIT_MS)) {
                console.log(`[Indexer] Time limit reached (${loopCount} batches). Yielding.`);
                break;
            }

            // B. Calculate Dynamic Batch Size
            let currentBatchSize = PROD_BATCH_SIZE;

            if (isBackfill) {
                const lag = latestBlock - currentBlockVal;
                // Formula: batch = min(MAX, max(MIN, lag / TARGET))
                // effectively splits the remaining work into ~50 chunks, bounded by safe limits
                const dynamicSize = Math.ceil(lag / BF_TARGET_BATCH_COUNT);
                currentBatchSize = Math.min(BF_MAX_BATCH, Math.max(BF_MIN_BATCH, dynamicSize));
            }

            // C. Define Range
            let toBlock = currentBlockVal + currentBatchSize - 1;
            if (toBlock > latestBlock) toBlock = latestBlock;

            try {
                // D. Fetch Logs
                const filter = this.contract.filters.Contributed();
                const events = await this.contract.queryFilter(filter, currentBlockVal, toBlock);

                if (events.length > 0) {
                    console.log(`[Indexer] Found ${events.length} events in range ${currentBlockVal}-${toBlock} (size: ${currentBatchSize})`);
                }

                // E. Process
                const eventPayload = await this.processEvents(events);

                // F. Ingest (Updates Cursor)
                const newCursor = toBlock + 1;
                const { error: ingestError } = await supabase.rpc('ingest_contributor_events', {
                    p_chain_id: CHAIN_ID,
                    p_key: 'contributors_sync',
                    p_new_cursor: newCursor,
                    p_events: eventPayload
                });

                if (ingestError) throw ingestError;

                currentBlockVal = newCursor;
                loopCount++;

                // G. Re-Claim / Extend Lock for Next Iteration
                // Essential for multiple loops. We use the *Next* calculated batch size effectively?
                // Or just maintain the lock. We pass `force=true` in backfill to ensure we keep going.
                if (currentBlockVal < latestBlock) {
                    const { data: nextLease } = await supabase.rpc('claim_indexer_scan', {
                        p_chain_id: CHAIN_ID,
                        p_key: 'contributors_sync',
                        p_owner_id: this.ownerId,
                        p_force: isBackfill ? true : false, // Prod respects initial force setting (usually false)
                        p_batch_size: currentBatchSize
                    });

                    if (!nextLease || !nextLease.allowed) {
                        console.warn("[Indexer] Lock lost during sync. Stopping.");
                        break;
                    }
                }

                // H. Rate Limit / Nice-ness
                await new Promise(r => setTimeout(r, isBackfill ? 50 : 200));

            } catch (err) {
                console.error(`[Indexer] FAILED range ${currentBlockVal}->${toBlock}:`, err);
                break;
            }
        }

        console.log(`[Indexer] Run finished. Processed ${loopCount} batches.`);
    }

    private async processEvents(events: Array<ethers.EventLog | ethers.Log>): Promise<any[]> {
        const rawPayload = events.map(evt => {
            if (evt instanceof ethers.EventLog) {
                return {
                    tx_hash: evt.transactionHash,
                    log_index: evt.index,
                    block_number: evt.blockNumber,
                    donor_address: evt.args[0],
                    amount_wei: evt.args[2].toString(),
                    is_anonymous: evt.args[3],
                    message: ""
                };
            }
            return null;
        }).filter(e => e !== null);

        if (rawPayload.length === 0) return [];

        const blockNumbers = [...new Set(rawPayload.map(e => e!.block_number))];
        const blockMap = new Map<number, string>();

        await Promise.all(blockNumbers.map(async (bNum) => {
            try {
                const b = await this.provider.getBlock(bNum);
                if (b) blockMap.set(bNum, new Date(b.timestamp * 1000).toISOString());
            } catch (e) {
                console.error(`[Indexer] Failed to fetch timestamp for block ${bNum}`);
            }
        }));

        return rawPayload.map(e => ({
            ...e,
            block_timestamp: blockMap.get(e!.block_number) || new Date().toISOString()
        }));
    }
}
