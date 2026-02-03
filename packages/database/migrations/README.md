# TxProof Database Migrations

## Migration Files

This directory contains all database migrations for the TxProof SaaS platform.

### Complete Schema (Recommended for New Deployments)

**`000_complete_schema.sql`** - Single comprehensive migration file
- ✅ **Use this for fresh database setup**
- ✅ Merges all migrations (001-005) in correct order
- ✅ No conflicts or duplications
- ✅ Tested and production-ready

**Contents:**
1. Core SaaS infrastructure (plans, API keys, usage aggregates)
2. Enterprise features (webhooks with encryption, receipt templates)
3. API usage tracking (real-time metrics, detailed logs)
4. Security (RLS policies, access control)
5. Functions (quota management, aggregations, cleanup)
6. Triggers (auto-timestamps)
7. Analytics views (SLA monitoring)

---

### Individual Migration Files (Historical)

These files are kept for reference but should NOT be run separately on new databases:

- **`001_initial_saas_schema.sql`** - Core SaaS tables and priority queue
- **`002_enterprise_features.sql`** - Webhooks, templates, receipt proofs
- **`003_security_lockdown.sql`** - RLS policies and access control
- **`004_api_usage_tracking.sql`** - Real API usage tracking tables
- **`005_usage_aggregation_functions.sql`** - Statistics functions

---

## Quick Start

### For New Database

```bash
# Connect to your Supabase/PostgreSQL database
psql $DATABASE_URL -f packages/database/migrations/000_complete_schema.sql
```

### For Existing Database (Incremental Updates)

If you already ran migrations 001-003, only run the new ones:

```bash
# Run only new migrations
psql $DATABASE_URL -f packages/database/migrations/004_api_usage_tracking.sql
psql $DATABASE_URL -f packages/database/migrations/005_usage_aggregation_functions.sql
```

---

## Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `plans` | Subscription tiers | Free, Pro, Enterprise with quotas |
| `api_keys` | API authentication | Hashed keys, encrypted secrets, quota tracking |
| `bills` | Receipt storage | Cryptographic hashes (keccak256), immutable proofs |
| `bill_jobs` | Queue management | Priority-based, SLA tracking |

### Enterprise Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `webhooks` | Webhook configs | AES-256-GCM encrypted secrets, HTTPS-only |
| `webhook_events` | Delivery log | Bounded retries, dead-letter queue |
| `receipt_templates` | Custom branding | XSS-safe, presentation overlay only |

### Tracking Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `api_usage` | Request metrics | Per-endpoint stats, error rates, latency |
| `api_logs` | Detailed logs | Full request/response (30-day retention) |
| `audit_logs` | Security ledger | Immutable action log |

---

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- ✅ **Service role**: Full access (backend API)
- ✅ **Authenticated users**: View only their own data
- ✅ **Public users**: Read-only access to plans
- ✅ **Anonymous**: No access to sensitive data

### Encryption

- **Webhook secrets**: AES-256-GCM encrypted at rest
- **API keys**: SHA-256 hashed
- **Receipt proofs**: Keccak256 cryptographic hash

---

## Functions

### Quota Management

```sql
-- Check and increment usage atomically
SELECT increment_api_usage(api_key_id, 1);
```

### Job Queue

```sql
-- Claim next highest-priority job
SELECT * FROM claim_next_bill_job_v2();
```

### Usage Analytics

```sql
-- Get endpoint statistics
SELECT * FROM aggregate_usage_by_endpoint(
    'api_key_id', 
    '2026-01-01', 
    '2026-02-01'
);
```

### Cleanup

```sql
-- Remove old logs (run via cron)
SELECT cleanup_old_api_usage();
```

---

## Data Retention

- **API usage logs**: 90 days
- **API detailed logs**: 30 days
- **Audit logs**: Permanent
- **Bills**: 90 days (configurable via env)

---

## Migration Verification

After running migrations, verify:

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 13+ tables

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: All core tables

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%usage%';
-- Expected: increment_api_usage, aggregate_usage_by_*, cleanup_old_api_usage

-- Test quota function
SELECT increment_api_usage(
    (SELECT id FROM api_keys LIMIT 1), 
    1
);
-- Expected: true
```

---

## Rollback Procedure

⚠️ **Warning**: Only use in development or with full database backup

```sql
-- Drop all tables (destructive!)
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS receipt_templates CASCADE;
DROP TABLE IF EXISTS api_logs CASCADE;
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS api_usage_aggregates CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS bill_jobs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS increment_api_usage;
DROP FUNCTION IF EXISTS claim_next_bill_job_v2;
DROP FUNCTION IF EXISTS cleanup_old_api_usage;
DROP FUNCTION IF EXISTS aggregate_usage_by_endpoint;
DROP FUNCTION IF EXISTS aggregate_usage_by_status;
DROP FUNCTION IF EXISTS update_timestamp;
```

---

## Troubleshooting

### "relation already exists"

The schema handles this with `IF NOT EXISTS` clauses. Safe to re-run.

### "column already exists"

Individual migrations use conditional column additions. Safe to re-run.

### RLS blocking queries

Ensure you're using service role key for backend operations:

```typescript
const { data } = await supabase
    .from('api_usage')
    .select('*')
    // Uses service role key automatically
```

---

## Production Checklist

Before deploying to production:

- [ ] Run `000_complete_schema.sql` on staging first
- [ ] Verify all tables exist
- [ ] Test RLS policies with different roles
- [ ] Seed initial plans
- [ ] Create admin API key
- [ ] Test quota enforcement
- [ ] Verify webhook encryption works
- [ ] Run cleanup function manually
- [ ] Check performance with sample data
- [ ] Set up automated cleanup cron job

---

## Support

For issues or questions about migrations:
1. Check this README
2. Review individual migration files for details
3. Verify environment variables are set
4. Check Supabase dashboard for RLS policies
