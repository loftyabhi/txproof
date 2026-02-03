const postgres = require('postgres');

const CONNECTION_STRING = 'postgresql://postgres.avklfjqhpizielvnkwyh:qtmbw5NWjoiBTkd4@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(CONNECTION_STRING, { ssl: 'require' });

async function migrate() {
    try {
        console.log('--- START MIGRATION 009 ---');

        await sql`
            CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMPTZ NOT NULL,
                last_requested_at TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_email_verification_user ON public.email_verification_tokens(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_email_verification_token ON public.email_verification_tokens(token)`;

        await sql`ALTER TABLE public.email_verification_tokens DISABLE ROW LEVEL SECURITY`;
        await sql`GRANT ALL ON public.email_verification_tokens TO service_role`;
        await sql`GRANT ALL ON public.email_verification_tokens TO postgres`;

        console.log('Migration 009 applied successfully.');
    } catch (e) {
        console.error('Migration Failed:', e.message);
    } finally {
        await sql.end();
    }
}

migrate();
