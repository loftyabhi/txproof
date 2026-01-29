import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper (Shared)
function isAuthorized(request: Request) {
    const authHeader = request.headers.get('authorization');
    return !!(authHeader && authHeader.startsWith('Bearer '));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const { isActive, abuseFlag } = body;

        const updates: any = {};
        if (typeof isActive === 'boolean') updates.is_active = isActive;
        if (typeof abuseFlag === 'boolean') updates.abuse_flag = abuseFlag;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: 'No updates provided' });
        }

        const { error } = await supabaseAdmin
            .from('api_keys')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        // Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            actor_id: 'admin',
            action: 'KEY_UPDATE',
            target_id: id,
            metadata: updates
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
