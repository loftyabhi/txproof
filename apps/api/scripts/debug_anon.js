const postgres = require('postgres');
require('dotenv').config({ path: 'apps/api/.env' });

const sql = postgres(process.env.DATABASE_URL);

async function check() {
    try {
        console.log('--- Checking contributor_events ---');
        // Check the specific tx that user screenshotted (starts with 0x6d0f)
        const events = await sql`SELECT tx_hash, donor_address, is_anonymous FROM contributor_events WHERE tx_hash LIKE '0x6d0f%'`;
        console.log('Events (0x6d0f...):', events);

        if (events.length > 0) {
            console.log('is_anonymous TYPE:', typeof events[0].is_anonymous);
            console.log('is_anonymous VALUE:', events[0].is_anonymous);
        }

        console.log('\n--- Checking contributors Table ---');
        // Check for the donor address 0x9c04
        const contributors = await sql`SELECT wallet_address, is_anonymous FROM contributors WHERE wallet_address ILIKE '0x9c04%'`;
        console.log('Contributors (0x9c04...):', contributors);

        if (contributors.length > 0) {
            console.log('is_anonymous TYPE:', typeof contributors[0].is_anonymous);
            console.log('is_anonymous VALUE:', contributors[0].is_anonymous);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

check();
