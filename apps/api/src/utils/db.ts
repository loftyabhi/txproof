import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDatabasePool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/txproof',
        });
    }
    return pool;
}
