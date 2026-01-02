import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
// Ensure these are set in your .env.local
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_SUPPORT_VAULT_ADDRESS as `0x${string}`;
const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
// Fallback RPC if Alchemy not present
const RPC_URL = process.env.BASE_RPC_URL || (ALCHEMY_KEY ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}` : "https://sepolia.base.org");

const IS_TESTNET = true; // TODO: Drive this from env (e.g. NEXT_PUBLIC_CHAIN_ID)

// Supabase Init
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Key for privileged operations (RLS Bypass)
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// --- Types ---
type ContributorStats = {
    address: string;
    total: number;
    count: number;
    lastDate: number;
    anonymous: boolean;
};

// --- Viem Client ---
const client = createPublicClient({
    chain: IS_TESTNET ? baseSepolia : base,
    transport: http(RPC_URL)
});

const CONTRIBUTED_EVENT = parseAbiItem(
    'event Contributed(address indexed contributor, address indexed token, uint256 amount, bool isAnonymous, uint256 timestamp)'
);

async function getContributors() {
    // 1. Init Supabase
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.warn("Supabase credentials missing. Returning empty array.");
        return [];
    }
    // Public Client for reads
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Admin Client for writes (bypasses RLS)
    const adminSupabase = SUPABASE_SERVICE_ROLE_KEY
        ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        : supabase; // Fallback to anon (will fail writes if RLS enforces service role)

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.warn("SUPABASE_SERVICE_ROLE_KEY missing. Writes may fail due to RLS.");
    }

    try {
        const currentBlock = await client.getBlockNumber();

        // 2. Get Last Synced Block
        let fromBlock = BigInt(0);
        const { data: indexerState, error: stateError } = await supabase
            .from('indexer_state')
            .select('last_synced_block')
            .eq('key', 'contributors_sync')
            .single();

        if (stateError && stateError.code !== 'PGRST116') { // Ignore 'Not found' error
            console.error("Failed to fetch indexer state:", stateError);
        }

        if (indexerState) {
            fromBlock = BigInt(indexerState.last_synced_block) + BigInt(1);
        } else {
            // First run: fallback to recent history or 0
            // For safety/RPC limits, let's start from a known block or just recent 10k
            fromBlock = currentBlock - BigInt(10000);
            if (fromBlock < BigInt(0)) fromBlock = BigInt(0);
        }

        // 3. Sync if needed
        if (fromBlock <= currentBlock) {
            // Cap range to 2000 blocks to prevent timeouts/limits
            const MAX_RANGE = BigInt(2000);
            let toBlock = currentBlock;
            if (currentBlock - fromBlock > MAX_RANGE) {
                toBlock = fromBlock + MAX_RANGE;
            }

            console.log(`API: Syncing from ${fromBlock} to ${toBlock}`);

            const logs = await client.getLogs({
                address: VAULT_ADDRESS,
                event: CONTRIBUTED_EVENT,
                fromBlock: fromBlock,
                toBlock: toBlock
            });

            if (logs.length > 0) {
                // Process Logs
                const updates = new Map<string, any>();

                for (const log of logs) {
                    const { contributor, amount, isAnonymous, timestamp } = log.args;
                    if (!contributor || !amount || !timestamp) continue;

                    const ethVal = parseFloat(formatEther(amount));

                    const existing = updates.get(contributor) || {
                        total_amount_wei: 0,
                        contribution_count: 0,
                        last_contribution_at: 0,
                        is_anonymous: false
                    };

                    existing.total_amount_wei += ethVal;
                    existing.contribution_count += 1;
                    if (Number(timestamp) > existing.last_contribution_at) {
                        existing.last_contribution_at = Number(timestamp);
                        existing.is_anonymous = isAnonymous || false;
                    }

                    updates.set(contributor, existing);
                }

                // Batch fetching existing records for upsert math
                const addresses = Array.from(updates.keys());
                const { data: dbContributors } = await supabase
                    .from('contributors')
                    .select('*')
                    .in('wallet_address', addresses);

                const dbMap = new Map(dbContributors?.map((c: any) => [c.wallet_address, c]));

                const upsertPayload = [];
                for (const [addr, newStats] of updates.entries()) {
                    const dbStats = dbMap.get(addr) || {
                        total_amount_wei: 0,
                        contribution_count: 0
                    };

                    upsertPayload.push({
                        wallet_address: addr,
                        total_amount_wei: Number(dbStats.total_amount_wei) + newStats.total_amount_wei,
                        contribution_count: dbStats.contribution_count + newStats.contribution_count,
                        last_contribution_at: new Date(newStats.last_contribution_at * 1000).toISOString(),
                        is_anonymous: newStats.is_anonymous
                    });
                }

                if (upsertPayload.length > 0) {
                    const { error: upsertError } = await supabase
                        .from('contributors')
                        .upsert(upsertPayload);

                    if (upsertError) console.error("Upsert Failed:", upsertError);
                }
            }

            // 4. Update Indexer State
            await supabase.from('indexer_state').upsert({
                key: 'contributors_sync',
                last_synced_block: Number(toBlock),
                updated_at: new Date().toISOString()
            });
        }

        // 5. Return Sorted Data from DB
        const { data: allData, error } = await supabase
            .from('contributors')
            .select('*')
            .order('total_amount_wei', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Map to frontend format
        return allData?.map((c: any) => ({
            address: c.wallet_address,
            total: Number(c.total_amount_wei),
            count: c.contribution_count,
            lastDate: new Date(c.last_contribution_at).getTime() / 1000,
            anonymous: c.is_anonymous
        })) || [];

    } catch (e) {
        console.error("Sync Logic Failed:", e);
        // Fallback: Try to read whatever is in DB even if sync failed
        const { data } = await supabase
            .from('contributors')
            .select('*')
            .order('total_amount_wei', { ascending: false })
            .limit(50);

        return data?.map((c: any) => ({
            address: c.wallet_address,
            total: Number(c.total_amount_wei),
            count: c.contribution_count,
            lastDate: new Date(c.last_contribution_at).getTime() / 1000,
            anonymous: c.is_anonymous
        })) || [];
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'top';
        const userAddress = searchParams.get('address');

        // Fetch and Index Data (Incremental)
        const allContributors = await getContributors();

        // --- Privacy Masking & formatting ---
        const publicData = allContributors.map((c: any) => ({
            address: c.anonymous ? null : c.address,
            displayName: c.anonymous ? "Anonymous Supporter" : c.address,
            total: parseFloat(typeof c.total === 'number' ? c.total.toFixed(4) : c.total), // Safety check
            count: c.count,
            lastDate: c.lastDate,
            isAnonymous: c.anonymous
        }));

        if (type === 'top') {
            return NextResponse.json({
                contributors: publicData, // Already sliced to 50 in DB query
                lastUpdated: Date.now()
            });
        }

        if (type === 'stats') {
            const totalRaised = allContributors.reduce((acc: any, curr: any) => acc + curr.total, 0);
            return NextResponse.json({
                totalRaised: parseFloat(totalRaised.toFixed(4)),
                contributorCount: allContributors.length
            });
        }

        if (type === 'me' && userAddress) {
            const found = allContributors.find((c: any) => c.address.toLowerCase() === userAddress.toLowerCase());
            return NextResponse.json({
                you: found ? {
                    total: parseFloat(found.total.toFixed(4)),
                    rank: allContributors.indexOf(found) + 1,
                    anonymous: found.anonymous
                } : null
            });
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
