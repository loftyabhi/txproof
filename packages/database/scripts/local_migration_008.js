const postgres = require('postgres');

const CONNECTION_STRING = 'postgresql://postgres.avklfjqhpizielvnkwyh:qtmbw5NWjoiBTkd4@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(CONNECTION_STRING, { ssl: 'require' });

async function migrate() {
    try {
        console.log('--- START MIGRATION 008 ---');

        await sql`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT`;
        await sql`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT`;
        await sql`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE`;
        await sql`ALTER TABLE public.users ADD COLUMN IF NOT EXISTS social_config JSONB DEFAULT '{}'::jsonb`;

        await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email)`;

        console.log('Migration 008 applied successfully.');
    } catch (e) {
        console.error('Migration Failed:', e.message);
    } finally {
        await sql.end();
    }
}

migrate();
