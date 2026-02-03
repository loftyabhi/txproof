import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

/**
 * TxProof Schema Drift Detector
 * Compares live database state against canonical master_schema.sql definitions.
 */

async function detectDrift() {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    const sql = postgres(DATABASE_URL);

    // Canonical expectations from master_schema.sql
    const expectedTables = [
        'chains', 'ad_profiles', 'supported_tokens', 'plans', 'api_keys',
        'users', 'contributors', 'contributor_events', 'bills', 'webhooks',
        'webhook_events', 'receipt_templates', 'bill_jobs', 'pending_contributions',
        'api_usage', 'api_usage_aggregates', 'api_logs', 'audit_logs'
    ];

    const expectedFunctions = [
        'update_timestamp', 'claim_next_bill_job_v2', 'increment_api_usage',
        'aggregate_usage_by_endpoint', 'update_contributors'
    ];

    console.log('🔍 Starting Schema Drift Detection...');
    let driftCount = 0;

    try {
        // 1. Check Tables
        const tables = await sql`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        `;
        const liveTables = tables.map(t => t.tablename);

        expectedTables.forEach(table => {
            if (!liveTables.includes(table)) {
                console.warn(`⚠️ MISSING TABLE: ${table}`);
                driftCount++;
            }
        });

        // 2. Check RLS
        const rlsStatus = await sql`
            SELECT tablename, rowsecurity FROM pg_tables 
            WHERE schemaname = 'public'
        `;

        rlsStatus.forEach(row => {
            if (expectedTables.includes(row.tablename) && !row.rowsecurity) {
                console.warn(`⚠️ RLS NOT ENABLED: ${row.tablename}`);
                driftCount++;
            }
        });

        // 3. Check Functions
        const functions = await sql`
            SELECT proname FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
        `;
        const liveFunctions = functions.map(f => f.proname);

        expectedFunctions.forEach(fn => {
            if (!liveFunctions.includes(fn)) {
                console.warn(`⚠️ MISSING FUNCTION: ${fn}`);
                driftCount++;
            }
        });

        if (driftCount === 0) {
            console.log('✅ PASS: No schema drift detected. Live database matches master_schema.sql');
        } else {
            console.log(`❌ FAIL: Detected ${driftCount} schema discrepancies.`);
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ ERROR connecting to database:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

detectDrift();
