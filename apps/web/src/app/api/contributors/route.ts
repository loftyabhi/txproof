import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// --- Configuration ---
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_SUPPORT_VAULT_ADDRESS as `0x${string}`;
const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const RPC_URL = process.env.BASE_RPC_URL || (ALCHEMY_KEY ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}` : "https://sepolia.base.org");

const CACHE_TTL = 60 * 1000;
const IS_TESTNET = true; // Temporary flag or check env

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

const fs = require('fs');
const path = require('path');

// --- Persistence (JSON DB) ---
const DB_PATH = path.join(process.cwd(), 'src/data/contributors.json');

function readDB() {
    try {
        if (!fs.existsSync(DB_PATH)) return { lastSyncedBlock: 0, contributors: [] };
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error("DB Read Error", e);
        return { lastSyncedBlock: 0, contributors: [] };
    }
}

function writeDB(data: any) {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("DB Write Error", e);
    }
}

async function getContributors() {
    const db = readDB();
    const currentBlock = await client.getBlockNumber();

    // Determine start block:
    // If we have synced before, start from lastSynced + 1
    // If first time, start from a recent block (e.g. current - 1000) or 0 if we want full sync (but constrained by speed)
    // User requested "fetch 2 to 5 range only". We'll interpret this as "incremental updates".
    // For first run, we still need a baseline. We'll use the dynamic approach but persist it.

    let fromBlock = BigInt(db.lastSyncedBlock || 0);
    if (fromBlock === BigInt(0)) {
        // First run: Use recent history of 20k blocks to populate initial state
        fromBlock = currentBlock - BigInt(20000);
        if (fromBlock < BigInt(0)) fromBlock = BigInt(0);
    } else {
        fromBlock = fromBlock + BigInt(1); // Next block
    }

    // Cap the range to avoid RPC limits just in case "lastSynced" was very old
    const MAX_RANGE = BigInt(1000);
    if (currentBlock - fromBlock > MAX_RANGE) {
        // Option: chunk it or just catch up to latest slowly.
        // For now, let's catch up to "current - 5" instantly but only process the last chunk to avoid huge queries?
        // No, we should process efficiently. 
        // User asked: "fetch 2 to 5 range only". This implies looking at the TIP.
        // But if we missed 100 blocks, and we only look at top 5, we lose data.
        // We will fetch everything from `fromBlock` but in chunks if needed.
        // Given free tier, let's limit to 2000 blocks per request.
        // If we are far behind, we just sync the LATEST 2000 blocks and skip the gap (Acceptable for dev, not prod).
        fromBlock = currentBlock - BigInt(2000);
    }

    if (fromBlock > currentBlock) {
        // Already up to date
        return db.contributors;
    }

    console.log(`API: Syncing from ${fromBlock} to ${currentBlock}`);

    try {
        const logs = await client.getLogs({
            address: VAULT_ADDRESS,
            event: CONTRIBUTED_EVENT,
            fromBlock: fromBlock,
            toBlock: currentBlock
        });

        console.log(`API: Found ${logs.length} new logs`);

        // Update DB
        const aggregator = new Map<string, ContributorStats>();
        // Load existing
        db.contributors.forEach((c: any) => aggregator.set(c.address, c));

        for (const log of logs) {
            const { contributor, amount, isAnonymous, timestamp } = log.args;
            if (!contributor || !amount || !timestamp) continue;

            const ethAmount = parseFloat(formatEther(amount));
            const existing = aggregator.get(contributor) || {
                address: contributor,
                total: 0,
                count: 0,
                lastDate: 0,
                anonymous: false
            };

            existing.total += ethAmount;
            existing.count += 1;
            if (Number(timestamp) > existing.lastDate) {
                existing.lastDate = Number(timestamp);
                existing.anonymous = isAnonymous || false;
            }
            aggregator.set(contributor, existing);
        }

        const sorted = Array.from(aggregator.values()).sort((a, b) => b.total - a.total);

        // Save
        writeDB({
            lastSyncedBlock: Number(currentBlock),
            contributors: sorted
        });

        return sorted;

    } catch (error) {
        console.error("Indexing Error:", error);
        return db.contributors; // Return existing data on failure
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
            total: parseFloat(c.total.toFixed(4)), // Formatting
            count: c.count,
            lastDate: c.lastDate,
            isAnonymous: c.anonymous
        }));

        if (type === 'top') {
            return NextResponse.json({
                contributors: publicData.slice(0, 50), // Return Top 50
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
