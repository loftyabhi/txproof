import postgres from 'postgres';

/**
 * TxProof Schema Smoke Tests
 * Verifies critical database availability and RLS status.
 */

async function runSmokeTests() {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL required for smoke tests');
        process.exit(1);
    }

    const sql = postgres(DATABASE_URL);
    console.log('🧪 Running Schema Smoke Tests...');

    try {
        // Test 1: Connection & basic query
        const [{ now }] = await sql`SELECT NOW()`;
        console.log(`✅ Connection established at ${now}`);

        // Test 2: Verify RLS is actually working (service role vs generic)
        // Since we are likely using a service role or admin key, we check metadata
        const billJobsRls = await sql`SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'bill_jobs'`;
        if (billJobsRls[0].relrowsecurity) {
            console.log('✅ RLS confirmed enabled for bill_jobs');
        } else {
            throw new Error('RLS is NOT enabled for bill_jobs');
        }

        // Test 3: Verify RPC exists and is callable
        // We'll just check if it exists in the catalog
        const claimFn = await sql`SELECT 1 FROM pg_proc WHERE proname = 'claim_next_bill_job_v2'`;
        if (claimFn.length > 0) {
            console.log('✅ claim_next_bill_job_v2 exists');
        } else {
            throw new Error('claim_next_bill_job_v2 missing');
        }

        console.log('🎉 All schema smoke tests passed!');
    } catch (err) {
        console.error('❌ Smoke test failure:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runSmokeTests();
