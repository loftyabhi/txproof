const postgres = require('postgres');

// Use connection string from .env or hardcoded for now (as seen in 006)
const CONNECTION_STRING = 'postgresql://postgres.avklfjqhpizielvnkwyh:qtmbw5NWjoiBTkd4@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

const sql = postgres(CONNECTION_STRING, { ssl: 'require' });

async function debug() {
    try {
        console.log('Checking users table columns...');
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = 'public';
        `;
        console.log('Users Columns:', columns);

        console.log('Checking constraints...');
        const constraints = await sql`
            SELECT conname, contype 
            FROM pg_constraint 
            WHERE conrelid = 'public.users'::regclass;
        `;
        console.log('Users Constraints:', constraints);

        console.log('Checking auth_nonces table...');
        const nonces = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'auth_nonces' AND table_schema = 'public';
        `;
        console.log('Auth Nonces Exists:', nonces.length > 0);

    } catch (e) {
        console.error('Debug failed:', e);
    } finally {
        await sql.end();
    }
}

debug();
