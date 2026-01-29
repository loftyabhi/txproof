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
        const { data, error } = await supabaseAdmin
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
