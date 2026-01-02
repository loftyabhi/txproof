
import postgres from 'postgres';

// Connection string should be provided via DATABASE_URL environment variable
// For Transaction Pooler: postgres://[user]:[password]@[host]:6543/[db_name]?pooler=transaction
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    // Warn but don't crash immediately to allow build time which might not have env vars
    console.warn('WARNING: DATABASE_URL is not defined');
}

// In production, we create a single client.
// In development, we prevent creating multiple connections during hot reloading.
declare global {
    var sql: postgres.Sql<{}> | undefined;
}

const sql = global.sql || postgres(connectionString || '');

if (process.env.NODE_ENV !== 'production') {
    global.sql = sql;
}

export { sql };
