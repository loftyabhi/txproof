const postgres = require('postgres');

// Use connection string from .env
const CONNECTION_STRING = 'postgresql://postgres.avklfjqhpizielvnkwyh:qtmbw5NWjoiBTkd4@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

const sql = postgres(CONNECTION_STRING, { ssl: 'require' });

async function migrate() {
    try {
        console.log('Running migration 006 (Enterprise Contributions)...');

        await sql`
            ALTER TABLE contributor_events 
            ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS invalid_reason TEXT,
            ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ;
        `;

        await sql`CREATE INDEX IF NOT EXISTS idx_contrib_valid ON contributor_events(is_valid);`;

        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await sql.end();
    }
}

migrate();
