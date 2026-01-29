-- MERGED MIGRATION: 001_initial_saas_schema.sql
-- DESCRIPTION: Sets up Plans, API Keys, Usage Tracking, Audit Logs, and Priority Queue Logic.
-- DATE: 2026-01-29

-- 1. PLANS & TIERS
create table if not exists plans (
  id uuid default gen_random_uuid() primary key,
  name text not null unique, -- 'Free', 'Pro', 'Enterprise'
  rate_limit_rps int default 1,     -- Realtime Token Bucket
  max_burst int default 5,          -- Token bucket capacity
  monthly_quota int default 100,    -- Hard Cap
  priority_level int default 0,     -- 0=Low/Free, 10=Pro, 20=Enterprise
  support_priority text default 'standard',
  created_at timestamptz default now()
);

-- Seed Plans
insert into plans (name, rate_limit_rps, max_burst, monthly_quota, priority_level)
values 
  ('Free', 1, 5, 100, 0),
  ('Pro', 10, 50, 10000, 10),
  ('Enterprise', 50, 200, 1000000, 20)
on conflict (name) do update 
set 
  max_burst = excluded.max_burst,
  monthly_quota = excluded.monthly_quota,
  rate_limit_rps = excluded.rate_limit_rps;

-- 2. API KEYS
create table if not exists api_keys (
  id uuid default gen_random_uuid() primary key,
  key_hash text not null unique, -- SHA-256 of 'sk_live_...'
  prefix text not null,          -- 'sk_live_1234' (first 8 chars) for display
  owner_id text,                 -- Supabase User ID or Org ID
  plan_id uuid references plans(id),
  environment text default 'live', -- 'live' or 'test'
  is_active boolean default true,
  permissions text[] default '{}', -- ['read:bills', 'write:bills']
  ip_allowlist text[] default null, -- IP Restriction (Security)
  abuse_flag boolean default false, -- Security Ban Flag
  secret_salt text,                 -- Future HMAC support
  created_at timestamptz default now()
);

create index if not exists idx_api_keys_hash on api_keys(key_hash);

-- 3. USAGE AGGREGATES (For Fast Quota Checking)
create table if not exists api_usage_aggregates (
  api_key_id uuid references api_keys(id),
  period_start date not null, -- First day of month e.g., '2026-01-01'
  request_count int default 0,
  primary key (api_key_id, period_start)
);

-- 4. USAGE LOGS (Granular Observability)
create table if not exists api_usage (
  id uuid default gen_random_uuid() primary key,
  api_key_id uuid references api_keys(id),
  endpoint text,
  status_code int,
  duration_ms int,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- 5. AUDIT LOGS (Immutable Security Ledger)
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id text not null, -- Admin ID or System
  action text not null,   -- 'KEY_CREATE', 'PLAN_CHANGE'
  target_id text,         -- The entity affected
  metadata jsonb default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_audit_target on audit_logs(target_id);

-- 6. EXTEND BILL JOBS (Priority & Metrics)
alter table bill_jobs 
add column if not exists api_key_id uuid references api_keys(id),
add column if not exists priority int default 0,
add column if not exists started_at timestamptz,
add column if not exists finished_at timestamptz,
add column if not exists duration_ms int,
add column if not exists wait_time_ms int,
add column if not exists processing_time_ms int,
add column if not exists cache_hit boolean default false;

create index if not exists idx_jobs_priority on bill_jobs(status, priority desc, created_at asc);

-- 7. RPC: INCREMENT USAGE (Atomic Quota Logic)
create or replace function increment_api_usage(
  p_key_id uuid, 
  p_cost int default 1
)
returns boolean
language plpgsql
as $$
declare
  v_quota int;
  v_current int;
  v_plan_id uuid;
  v_month date := date_trunc('month', now())::date;
begin
  -- Get Plan Quota
  select p.monthly_quota into v_quota
  from api_keys k
  join plans p on k.plan_id = p.id
  where k.id = p_key_id;

  -- Upsert Aggregate
  insert into api_usage_aggregates (api_key_id, period_start, request_count)
  values (p_key_id, v_month, p_cost)
  on conflict (api_key_id, period_start)
  do update set request_count = api_usage_aggregates.request_count + p_cost
  returning request_count into v_current;

  -- Check limit
  if v_current > v_quota then
    return false; -- Quota Exceeded
  end if;

  return true; -- Allowed
end;
$$;

-- 8. RPC: CLAIM NEXT JOB V2 (Priority Queue)
-- This replaces the simple FIFO logic with Priority Queue + Telemetry
create or replace function claim_next_bill_job_v2()
returns table (
  id uuid,
  tx_hash text,
  chain_id int,
  metadata jsonb,
  api_key_id uuid
) 
language plpgsql
as $$
declare
  v_job_id uuid;
begin
  -- Select next job: Pending, Highest Priority, Oldest Created
  -- Skip Locked is crucial for concurrency
  select bill_jobs.id into v_job_id
  from bill_jobs
  where status = 'pending'
  order by priority desc, created_at asc
  limit 1
  for update skip locked;

  if v_job_id is not null then
    update bill_jobs
    set 
      status = 'processing',
      started_at = now(),
      updated_at = now(),
      wait_time_ms = extract(epoch from (now() - created_at)) * 1000
    where bill_jobs.id = v_job_id;
    
    return query 
      select bill_jobs.id, bill_jobs.tx_hash, bill_jobs.chain_id, bill_jobs.metadata, bill_jobs.api_key_id 
      from bill_jobs 
      where bill_jobs.id = v_job_id;
  end if;
end;
$$;

-- 9. ANALYTICS VIEW (SLA)
create or replace view distinct_daily_metrics as
select 
  date_trunc('hour', finished_at) as hour_bucket,
  percentile_cont(0.5) within group (order by duration_ms) as p50_latency,
  percentile_cont(0.95) within group (order by duration_ms) as p95_latency,
  percentile_cont(0.99) within group (order by duration_ms) as p99_latency,
  avg(wait_time_ms) as avg_wait_time,
  count(*) filter (where status = 'failed') as failure_count,
  count(*) as total_count
from bill_jobs
where finished_at > now() - interval '24 hours'
group by 1;
