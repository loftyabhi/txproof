const postgres = require('postgres');

const CONNECTION_STRING = 'postgresql://postgres.avklfjqhpizielvnkwyh:qtmbw5NWjoiBTkd4@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(CONNECTION_STRING, { ssl: 'require' });

async function fixPermissions() {
    try {
        console.log('Fixing permissions for auth_nonces...');

        // Grant usage on public schema just in case
        await sql`GRANT USAGE ON SCHEMA public TO service_role`;

        // Grant table permissions
        await sql`GRANT ALL ON TABLE public.auth_nonces TO service_role`;
        await sql`GRANT ALL ON TABLE public.auth_nonces TO postgres`;

        console.log('Permissions granted to service_role and postgres.');
    } catch (e) {
        console.error('Failed:', e.message);
    } finally {
        await sql.end();
    }
}

fixPermissions();
