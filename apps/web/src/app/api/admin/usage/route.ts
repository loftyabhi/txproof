import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function isAuthorized(request: Request) {
    const authHeader = request.headers.get('authorization');
    return !!(authHeader && authHeader.startsWith('Bearer '));
}

export async function GET(request: Request) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Basic Stats (Requests Today)
        // Since we don't have a simple daily aggregate table for 'today' specifically without querying logs, 
        // we'll check the 'api_usage_aggregates' for the current month as a proxy or use the view if available.
        // Let's use the 'api_usage' table count for today (might be heavy without dedicated view, but RLS bypass allows it).
        // A better approach is using the `distinct_daily_metrics` view we created in migration.

        const { data: slaData, error: slaError } = await supabaseAdmin
            .from('distinct_daily_metrics')
            .select('*')
            .order('hour_bucket', { ascending: false })
            .limit(1)
            .single();

        // 2. Active Keys Count
        const { count: activeKeyCount } = await supabaseAdmin
            .from('api_keys')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        // 3. Top Consumers (Aggregation)
        // We'll query api_usage_aggregates for this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const dateStr = startOfMonth.toISOString().split('T')[0];

        const { data: topKeys, error: topError } = await supabaseAdmin
            .from('api_usage_aggregates')
            .select(`
                request_count,
                api_keys!inner (
                    id, prefix, owner_id
                )
            `)
            .eq('period_start', dateStr)
            .order('request_count', { ascending: false })
            .limit(5);

        if (slaError && slaError.code !== 'PGRST116') {
            // PGRST116 is "Resulst contain 0 rows" for .single(), which is fine if no traffic
            console.warn("SLA Fetch Error", slaError);
        }

        return NextResponse.json({
            metrics: {
                requestsToday: slaData?.total_count || 0,
                activeKeys: activeKeyCount || 0
            },
            sla: {
                p50_latency: slaData?.p50_latency || 0,
                p95_latency: slaData?.p95_latency || 0,
                failure_count: slaData?.failure_count || 0
            },
            topKeys: topKeys || []
        });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
