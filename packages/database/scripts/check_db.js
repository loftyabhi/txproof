const postgres = require('postgres');

// Use connection string from .env
const CONNECTION_STRING = 'postgresql://postgres.avklfjqhpizielvnkwyh:qtmbw5NWjoiBTkd4@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

const sql = postgres(CONNECTION_STRING, { ssl: 'require' });

async function check() {
    try {
        console.log('--- Pending Contributions ---');
        const pending = await sql`SELECT * FROM pending_contributions ORDER BY created_at DESC LIMIT 5`;
        console.table(pending);

        console.log('\n--- Contributor Events ---');
        const events = await sql`SELECT * FROM contributor_events ORDER BY created_at DESC LIMIT 5`;
        console.table(events);

        console.log('\n--- Audit Logs (All) ---');
        const logs = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`;
        console.table(logs);

        if (logs.length > 0) {
            const lastLog = logs.find(l => l.action === 'CONTRIBUTION_SYNC');
            if (lastLog) {
                const txHash = lastLog.target_id;
                console.log(`\nChecking specific TxHash from Audit: ${txHash}`);

                const pending = await sql`SELECT * FROM pending_contributions WHERE tx_hash = ${txHash}`;
                console.log('Pending Record:', pending);

                const confirmed = await sql`SELECT * FROM contributor_events WHERE tx_hash = ${txHash}`;
                console.log('Confirmed Record:', confirmed);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}

check();
