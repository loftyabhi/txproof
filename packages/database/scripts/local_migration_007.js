const postgres = require('postgres');

const CONNECTION_STRING = 'postgresql://postgres.avklfjqhpizielvnkwyh:qtmbw5NWjoiBTkd4@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(CONNECTION_STRING, { ssl: 'require' });

async function migrate() {
    try {
        console.log('--- START MIGRATION 007 ---');

        // Step 0
        try {
            console.log('Step 0: Extensions');
            await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
            await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
        } catch (e) {
            console.error('Step 0 Failed:', e.message);
            throw e;
        }

        // Step 1: Auth Nonces
        try {
            console.log('Step 1: Checking auth_nonces');
            const exists = await sql`
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'auth_nonces' AND table_schema = 'public'
            `;
            if (exists.length === 0) {
                console.log('Creating auth_nonces...');
                await sql`
                    CREATE TABLE public.auth_nonces (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        wallet_address VARCHAR(42) NOT NULL,
                        nonce VARCHAR(255) NOT NULL UNIQUE,
                        expires_at TIMESTAMPTZ NOT NULL,
                        used_at TIMESTAMPTZ,
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    )
                `;
                console.log('Created auth_nonces.');
                await sql`CREATE INDEX IF NOT EXISTS idx_nonces_wallet ON public.auth_nonces(wallet_address)`;
                await sql`ALTER TABLE public.auth_nonces ENABLE ROW LEVEL SECURITY`;
            } else {
                console.log('auth_nonces exists.');
            }
        } catch (e) {
            console.error('Step 1 Failed:', e.message);
            throw e;
        }

        // Step 2: Users Table
        try {
            console.log('Step 2: Upgrading Users Table');
            // Check ID column
            const cols = await sql`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'id' AND table_schema = 'public'
            `;

            if (cols.length === 0) {
                console.log('Adding ID column to users...');
                // CAUTION: uuid-ossp function needs to be available. pgcrypto has gen_random_uuid().
                await sql`ALTER TABLE public.users ADD COLUMN id UUID DEFAULT gen_random_uuid()`;
                console.log('ID column added.');
            } else {
                console.log('ID column exists.');
            }

            // Check PK
            const pks = await sql`
                SELECT kcu.column_name 
                FROM information_schema.key_column_usage kcu
                JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY' 
                AND kcu.table_name = 'users' 
                AND kcu.table_schema = 'public'
            `;

            if (pks.length > 0) {
                const pkName = pks[0].column_name;
                console.log(`Current PK: ${pkName}`);
                if (pkName === 'wallet_address') {
                    console.log('Swapping PK to ID...');
                    await sql`ALTER TABLE public.users DROP CONSTRAINT users_pkey CASCADE`;
                    await sql`ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id)`;

                    // Ensure Wallet is Unique
                    const uniques = await sql`
                        SELECT constraint_name FROM information_schema.table_constraints
                        WHERE table_name = 'users' AND constraint_name = 'users_wallet_address_key'
                     `;
                    if (uniques.length === 0) {
                        console.log('Validating wallet uniqueness...');
                        await sql`ALTER TABLE public.users ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address)`;
                    }
                }
            }
        } catch (e) {
            console.error('Step 2 Failed:', e.message);
            throw e;
        }

        // Step 3: Plans Table
        try {
            console.log('Step 3: Upgrading Plans Table');
            await sql`ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS allows_webhooks BOOLEAN DEFAULT FALSE`;
            await sql`ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS allows_branding BOOLEAN DEFAULT FALSE`;
            await sql`ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS allows_bulk BOOLEAN DEFAULT FALSE`;

            await sql`UPDATE public.plans SET allows_webhooks = TRUE, allows_branding = TRUE, allows_bulk = TRUE WHERE name = 'Enterprise'`;
            await sql`UPDATE public.plans SET allows_webhooks = TRUE, allows_branding = FALSE, allows_bulk = FALSE WHERE name = 'Pro'`;
            await sql`UPDATE public.plans SET allows_webhooks = FALSE, allows_branding = FALSE, allows_bulk = FALSE WHERE name = 'Free'`;
        } catch (e) {
            console.error('Step 3 Failed:', e.message);
            throw e;
        }

        // Step 4: API Keys Table
        try {
            console.log('Step 4: Upgrading API Keys Table');
            // Check if users(id) is strictly ready
            const userIdcheck = await sql`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'id'
            `;
            if (userIdcheck.length === 0) throw new Error('Cannot run Step 4: users.id missing');

            await sql`ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.users(id)`;
            await sql`ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS overage_count INT DEFAULT 0`;
            await sql`ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS last_overage_at TIMESTAMPTZ`;

            // Backfill
            console.log('Step 4b: Backfilling');
            await sql`
                UPDATE public.api_keys
                SET owner_user_id = users.id
                FROM public.users
                WHERE api_keys.owner_id = users.wallet_address
                AND api_keys.owner_user_id IS NULL
            `;
        } catch (e) {
            console.error('Step 4 Failed:', e.message);
            throw e;
        }

        console.log('--- MIGRATION 007 SUCCESS ---');

    } catch (metricError) {
        console.error('--- MIGRATION ABORTED ---');
    } finally {
        await sql.end();
    }
}

migrate();
