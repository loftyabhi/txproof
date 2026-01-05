import { ethers } from 'ethers';
import { supabase } from '../lib/supabase';

// --- Configuration ---
// These should ideally match the Indexer's config
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_SUPPORT_VAULT_ADDRESS || "0x8a9496cdffd16250353ea19b1ff8ce4de4c294cf";
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) : 8453;
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const CONFIRMATIONS_REQUIRED = 5;
const MAX_RETRIES = 10;

// ABI for decoding the 'Contributed' event
const SUPPORT_VAULT_ABI = [
    "event Contributed(address indexed contributor, address indexed token, uint256 amount, bool isAnonymous, uint256 timestamp)"
];

export class ContributionService {
    private provider: ethers.JsonRpcProvider;
    private contractInterface: ethers.Interface;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(RPC_URL);
        this.contractInterface = new ethers.Interface(SUPPORT_VAULT_ABI);
    }

    /**
     * Entry point for frontend to submit a txHash.
     * Idempotent: returns current status if already exists.
     */
    public async submitContribution(txHash: string, isAnonymous: boolean): Promise<{ status: string; message: string }> {
        // 1. Validate Input
        if (!ethers.isHexString(txHash, 32)) { // txHash should be 32 bytes (66 chars with 0x)
            throw new Error("Invalid transaction hash format");
        }

        // 2. Check Existing
        const { data: existing } = await supabase
            .from('pending_contributions')
            .select('status')
            .eq('tx_hash', txHash)
            .single();

        if (existing) {
            // If already final, return status
            if (existing.status === 'confirmed' || existing.status === 'failed') {
                return { status: existing.status, message: `Transaction already processed: ${existing.status}` };
            }
            // If pending, trigger re-process but return accepted
            this.processPendingContribution(txHash).catch(console.error);
            return { status: 'pending', message: "Transaction already pending. Verification triggered." };
        }

        // 3. Insert New Pending Record
        const { error: insertError } = await supabase
            .from('pending_contributions')
            .insert({
                tx_hash: txHash,
                chain_id: CHAIN_ID,
                status: 'pending',
                retries: 0
            });

        if (insertError) {
            // Handle race condition if unique constraint hit just now
            if (insertError.code === '23505') { // Unique violation
                return { status: 'pending', message: "Transaction accepted." };
            }
            throw new Error(`DB Insert Failed: ${insertError.message}`);
        }

        // 4. Trigger Async Verification (Fire & Forget)
        this.processPendingContribution(txHash).catch(err => {
            console.error(`[ContributionService] Error validating ${txHash}:`, err);
        });

        return { status: 'pending', message: "Transaction accepted for verification." };
    }

    /**
     * Core logic: Verify receipt, check confirmations, ingest data.
     */
    public async processPendingContribution(txHash: string): Promise<string> {
        try {
            console.log(`[ContributionService] Processing ${txHash}...`);

            // 1. Fetch Receipt
            const receipt = await this.provider.getTransactionReceipt(txHash);

            if (!receipt) {
                // Not mined yet? Or invalid?
                return 'pending';
            }

            // 2. Validate Receipt
            if (receipt.status !== 1) {
                await this.markFailed(txHash, 'FAILED_REVERTED');
                return 'failed';
            }

            if (receipt.to?.toLowerCase() !== VAULT_ADDRESS.toLowerCase()) {
                await this.markFailed(txHash, 'FAILED_WRONG_CONTRACT');
                return 'failed';
            }

            // 3. Check Reorg Safety / Confirmations
            const currentBlock = await this.provider.getBlockNumber();
            const confirmations = currentBlock - receipt.blockNumber;

            if (confirmations < CONFIRMATIONS_REQUIRED) {
                console.log(`[ContributionService] ${txHash} has ${confirmations}/${CONFIRMATIONS_REQUIRED} confirmations. Waiting.`);
                return 'pending'; // Stay pending, retry worker will pick it up
            }

            // 4. Parse Logs
            const log = receipt.logs.find(l =>
                l.address.toLowerCase() === VAULT_ADDRESS.toLowerCase() &&
                l.topics[0] === this.contractInterface.getEvent('Contributed')?.topicHash
            );

            if (!log) {
                await this.markFailed(txHash, 'FAILED_NO_EVENT');
                return 'failed';
            }

            const parsed = this.contractInterface.parseLog({
                topics: [...log.topics],
                data: log.data
            });

            if (!parsed) {
                await this.markFailed(txHash, 'FAILED_DECODE_ERROR');
                return 'failed';
            }

            // Extract Data
            const { contributor, amount, isAnonymous, timestamp } = parsed.args;

            // 5. Ingest to DB (Idempotent via UNIQUE constraint)
            const { error: indexErr } = await supabase
                .from('contributor_events')
                .insert({
                    chain_id: CHAIN_ID,
                    tx_hash: txHash,
                    log_index: log.index,
                    block_number: receipt.blockNumber,
                    block_timestamp: new Date(Number(timestamp) * 1000).toISOString(),
                    donor_address: contributor,
                    amount_wei: amount.toString(),
                    is_anonymous: isAnonymous,
                    message: ""
                });

            if (indexErr && indexErr.code !== '23505') { // Ignore unique violations
                console.error(`[ContributionService] DB Ingest Error:`, indexErr);
                throw indexErr;
            }

            // 6. Mark Confirmed
            await supabase
                .from('pending_contributions')
                .update({
                    status: 'confirmed',
                    confirmed_at: new Date().toISOString()
                })
                .eq('tx_hash', txHash);

            console.log(`[ContributionService] CONFIRMED ${txHash}`);
            return 'confirmed';

        } catch (error: any) {
            console.error(`[ContributionService] Crash processing ${txHash}:`, error);
            return 'error';
        }
    }

    private async markFailed(txHash: string, reason: string) {
        console.warn(`[ContributionService] Marking ${txHash} as FAILED: ${reason}`);
        await supabase
            .from('pending_contributions')
            .update({
                status: 'failed',
                last_error: reason
            })
            .eq('tx_hash', txHash);
    }

    /**
     * Retry Worker Entry Point
     */
    public async retryPendingRecords() {
        // Fetch stuck pending items > 1 min old
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

        const { data: pendings } = await supabase
            .from('pending_contributions')
            .select('tx_hash, retries')
            .eq('status', 'pending')
            .lt('created_at', oneMinuteAgo)
            .lt('retries', MAX_RETRIES)
            .limit(20);

        if (!pendings || pendings.length === 0) return;

        console.log(`[ContributionService] Retrying ${pendings.length} pending contributions...`);

        for (const p of pendings) {
            await supabase
                .from('pending_contributions')
                .update({ retries: p.retries + 1 })
                .eq('tx_hash', p.tx_hash);

            await this.processPendingContribution(p.tx_hash);
        }
    }
}
