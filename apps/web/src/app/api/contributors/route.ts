import { NextResponse } from 'next/server';
import { formatEther } from 'viem';
import { supabaseAdmin } from '@/lib/supabase-admin';

// --- Configuration ---
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Use the Admin client to bypass RLS for reading contributor data.
// We strictly control what is returned in the GET handler below.
const supabase = supabaseAdmin;

// --- Strict Types ---
interface ContributorDBRow {
    wallet_address: string;
    total_amount_wei: string; // Database returns string for big numbers
    contribution_count: number;
    last_contribution_at: string;
    is_anonymous: boolean;
}

interface ContributorModel {
    address: string;
    totalWei: bigint;
    count: number;
    lastDate: number; // Unix timestamp in seconds
    anonymous: boolean;
    rank: number;
}

async function getContributors(): Promise<ContributorModel[]> {
    try {
        const { data: allData, error } = await supabase
            .from('contributors')
            .select('wallet_address, total_amount_wei, contribution_count, last_contribution_at, is_anonymous')
            .order('total_amount_wei', { ascending: false })
            .limit(50);

        if (error) throw error;
        if (!allData) return [];

        // Map and Ranking (Precomputed)
        return (allData as unknown as ContributorDBRow[]).map((c, index) => ({
            address: c.wallet_address,
            totalWei: BigInt(c.total_amount_wei),
            count: c.contribution_count,
            lastDate: new Date(c.last_contribution_at).getTime() / 1000,
            anonymous: c.is_anonymous,
            rank: index + 1
        }));

    } catch (e) {
        console.error("DB Read Failed:", e);
        return [];
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'top';
        const userAddress = searchParams.get('address')?.toLowerCase();

        const allContributors = await getContributors();

        // Helper to convert BigInt Wei to Number ETH at boundary
        const toEth = (wei: bigint): number => parseFloat(formatEther(wei));

        if (type === 'top') {
            const publicData = allContributors.map(c => ({
                address: c.anonymous ? null : c.address,
                displayName: c.anonymous ? "Anonymous Supporter" : c.address,
                total: toEth(c.totalWei),
                count: c.count,
                lastDate: c.lastDate,
                isAnonymous: c.anonymous
            }));

            return NextResponse.json({
                contributors: publicData,
                lastUpdated: Date.now()
            });
        }

        if (type === 'stats') {
            const totalRaisedWei = allContributors.reduce((acc, curr) => acc + curr.totalWei, BigInt(0));
            return NextResponse.json({
                totalRaised: toEth(totalRaisedWei),
                contributorCount: allContributors.length
            });
        }

        if (type === 'me' && userAddress) {
            const found = allContributors.find(c => c.address.toLowerCase() === userAddress);
            return NextResponse.json({
                you: found ? {
                    total: toEth(found.totalWei),
                    rank: found.rank, // Precomputed O(1)
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
