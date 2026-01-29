-- SECURITY MIGRATION: 003_security_lockdown.sql
-- DESCRIPTION: Enables Row Level Security (RLS) on all tables to enforcing Zero Trust access.
-- DATE: 2026-01-29

-- =========================================================================
-- 1. ENABLE RLS ON ALL GOVERNANCE TABLES
-- =========================================================================

-- Core SaaS Tables
alter table if exists plans enable row level security;
alter table if exists api_keys enable row level security;
alter table if exists api_usage enable row level security;
alter table if exists api_usage_aggregates enable row level security;
alter table if exists audit_logs enable row level security;

-- Job & Bill Tables
alter table if exists bill_jobs enable row level security;
alter table if exists bills enable row level security;

-- User / Contribution Tables (If they exist in this schema or public)
alter table if exists users enable row level security;
alter table if exists contributors enable row level security;
alter table if exists contributor_events enable row level security;
alter table if exists pending_contributions enable row level security;

-- =========================================================================
-- 2. CREATE POLICIES (DENY BY DEFAULT)
-- Note: Service Role (Backend) bypasses RLS automatically.
-- These policies control what 'anon' (public) and 'authenticated' (Supabase Auth) users can see.
-- =========================================================================

-- A. PLANS
-- Public: Read Only (Everyone should be able to see pricing)
-- Backend: Full Access
drop policy if exists "Public Read Plans" on plans;
create policy "Public Read Plans" on plans for select using (true);

-- B. API KEYS
-- Public: None
-- Auth Users: View OWN keys only (linked by owner_id to auth.uid())
drop policy if exists "Users view own keys" on api_keys;
create policy "Users view own keys" on api_keys
  for select
  to authenticated
  using (owner_id = auth.uid()::text);

-- C. USAGE & AUDIT (Strict)
-- Public: None
-- Auth Users: None (Usage data is aggregated/served via Admin API)
-- Only Backend can write/read explicitly.

-- D. BILLS
-- Public: None (Bills are private receipts)
-- Auth Users: View OWN bills
drop policy if exists "Users view own bills" on bills;
create policy "Users view own bills" on bills
  for select
  to authenticated
  using (user_id = auth.uid()); -- Assuming user_id exists

-- E. METADATA TABLES (Safe Public Data)
-- If 'chains' or 'supported_tokens' exist, they should be public readable
-- Example:
create table if not exists chains (
  id int primary key, 
  name text, 
  rpc_url text
);
alter table chains enable row level security;
drop policy if exists "Public Read Chains" on chains;
create policy "Public Read Chains" on chains for select using (true);


-- =========================================================================
-- 3. AUDIT & VALIDATION
-- =========================================================================
-- Confirm RLS is ON:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public';

-- =========================================================================
-- END OF MIGRATION
-- =========================================================================
