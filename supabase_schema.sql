-- ============================================================
-- CleanCar 360 ERP — Supabase Schema v13
-- Paste ENTIRE file into:
--   Supabase Dashboard → SQL Editor → New Query → Run
-- Expected: "Success. No rows returned."
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Tables ───────────────────────────────────────────────────

create table if not exists employees (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists attendance_records (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  employee_id text not null,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payroll_runs (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  month text not null,
  year integer not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists salary_structures (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists leave_balances (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  employee_id text not null,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

create table if not exists advance_requests (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  employee_id text not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists other_adjustments (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  type text not null check (type in ('OtherEarning','OtherDeduction')),
  employee_id text not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists customers (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists subscriptions (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  customer_id text not null,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists jobs (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  customer_id text,
  washer_id text,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists leads (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists inventory_items (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

create table if not exists finance_revenues (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  month text,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists finance_payables (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists finance_mrr (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  month text,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists finance_ledger (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists gst_vendors (
  id text primary key,
  gstin text not null,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists gst_customers (
  id text primary key,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists gst_transactions (
  id text primary key,
  city_id text not null default 'CITY-SURAT',
  month text,
  year integer,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists gst_reconciliation (
  id text primary key,
  month text,
  year integer,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────

create index if not exists idx_att_emp    on attendance_records(employee_id);
create index if not exists idx_att_city   on attendance_records(city_id);
create index if not exists idx_leave_emp  on leave_balances(employee_id);
create index if not exists idx_adj_emp    on other_adjustments(employee_id);
create index if not exists idx_adj_type   on other_adjustments(type);
create index if not exists idx_cust_city  on customers(city_id);
create index if not exists idx_sub_cust   on subscriptions(customer_id);
create index if not exists idx_jobs_city  on jobs(city_id);
create index if not exists idx_jobs_wash  on jobs(washer_id);
create index if not exists idx_gst_gstin  on gst_vendors(gstin);
create index if not exists idx_gst_month  on gst_transactions(month, year);
create index if not exists idx_gst_city   on gst_transactions(city_id);

-- ── Auto updated_at trigger ───────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists t_upd_employees         on employees;
create trigger t_upd_employees
  before update on employees for each row execute function update_updated_at();

drop trigger if exists t_upd_attendance        on attendance_records;
create trigger t_upd_attendance
  before update on attendance_records for each row execute function update_updated_at();

drop trigger if exists t_upd_salary_structures on salary_structures;
create trigger t_upd_salary_structures
  before update on salary_structures for each row execute function update_updated_at();

drop trigger if exists t_upd_leave_balances    on leave_balances;
create trigger t_upd_leave_balances
  before update on leave_balances for each row execute function update_updated_at();

drop trigger if exists t_upd_customers         on customers;
create trigger t_upd_customers
  before update on customers for each row execute function update_updated_at();

drop trigger if exists t_upd_jobs              on jobs;
create trigger t_upd_jobs
  before update on jobs for each row execute function update_updated_at();

drop trigger if exists t_upd_leads             on leads;
create trigger t_upd_leads
  before update on leads for each row execute function update_updated_at();

drop trigger if exists t_upd_inventory         on inventory_items;
create trigger t_upd_inventory
  before update on inventory_items for each row execute function update_updated_at();

drop trigger if exists t_upd_fin_payables      on finance_payables;
create trigger t_upd_fin_payables
  before update on finance_payables for each row execute function update_updated_at();

drop trigger if exists t_upd_gst_vendors       on gst_vendors;
create trigger t_upd_gst_vendors
  before update on gst_vendors for each row execute function update_updated_at();

drop trigger if exists t_upd_gst_transactions  on gst_transactions;
create trigger t_upd_gst_transactions
  before update on gst_transactions for each row execute function update_updated_at();

-- ── Row Level Security ────────────────────────────────────────

alter table employees          enable row level security;
alter table attendance_records enable row level security;
alter table payroll_runs       enable row level security;
alter table salary_structures  enable row level security;
alter table leave_balances     enable row level security;
alter table advance_requests   enable row level security;
alter table other_adjustments  enable row level security;
alter table customers          enable row level security;
alter table subscriptions      enable row level security;
alter table jobs               enable row level security;
alter table leads              enable row level security;
alter table inventory_items    enable row level security;
alter table finance_revenues   enable row level security;
alter table finance_payables   enable row level security;
alter table finance_mrr        enable row level security;
alter table finance_ledger     enable row level security;
alter table gst_vendors        enable row level security;
alter table gst_customers      enable row level security;
alter table gst_transactions   enable row level security;
alter table gst_reconciliation enable row level security;

-- ── RLS Policies (explicit — no dynamic DO blocks) ────────────

drop policy if exists pol_employees          on employees;
create policy pol_employees
  on employees for all to anon using (true) with check (true);

drop policy if exists pol_attendance         on attendance_records;
create policy pol_attendance
  on attendance_records for all to anon using (true) with check (true);

drop policy if exists pol_payroll_runs       on payroll_runs;
create policy pol_payroll_runs
  on payroll_runs for all to anon using (true) with check (true);

drop policy if exists pol_salary_structures  on salary_structures;
create policy pol_salary_structures
  on salary_structures for all to anon using (true) with check (true);

drop policy if exists pol_leave_balances     on leave_balances;
create policy pol_leave_balances
  on leave_balances for all to anon using (true) with check (true);

drop policy if exists pol_advance_requests   on advance_requests;
create policy pol_advance_requests
  on advance_requests for all to anon using (true) with check (true);

drop policy if exists pol_other_adjustments  on other_adjustments;
create policy pol_other_adjustments
  on other_adjustments for all to anon using (true) with check (true);

drop policy if exists pol_customers          on customers;
create policy pol_customers
  on customers for all to anon using (true) with check (true);

drop policy if exists pol_subscriptions      on subscriptions;
create policy pol_subscriptions
  on subscriptions for all to anon using (true) with check (true);

drop policy if exists pol_jobs               on jobs;
create policy pol_jobs
  on jobs for all to anon using (true) with check (true);

drop policy if exists pol_leads              on leads;
create policy pol_leads
  on leads for all to anon using (true) with check (true);

drop policy if exists pol_inventory_items    on inventory_items;
create policy pol_inventory_items
  on inventory_items for all to anon using (true) with check (true);

drop policy if exists pol_finance_revenues   on finance_revenues;
create policy pol_finance_revenues
  on finance_revenues for all to anon using (true) with check (true);

drop policy if exists pol_finance_payables   on finance_payables;
create policy pol_finance_payables
  on finance_payables for all to anon using (true) with check (true);

drop policy if exists pol_finance_mrr        on finance_mrr;
create policy pol_finance_mrr
  on finance_mrr for all to anon using (true) with check (true);

drop policy if exists pol_finance_ledger     on finance_ledger;
create policy pol_finance_ledger
  on finance_ledger for all to anon using (true) with check (true);

drop policy if exists pol_gst_vendors        on gst_vendors;
create policy pol_gst_vendors
  on gst_vendors for all to anon using (true) with check (true);

drop policy if exists pol_gst_customers      on gst_customers;
create policy pol_gst_customers
  on gst_customers for all to anon using (true) with check (true);

drop policy if exists pol_gst_transactions   on gst_transactions;
create policy pol_gst_transactions
  on gst_transactions for all to anon using (true) with check (true);

drop policy if exists pol_gst_reconciliation on gst_reconciliation;
create policy pol_gst_reconciliation
  on gst_reconciliation for all to anon using (true) with check (true);

-- Done: 20 tables, 12 indexes, 11 triggers, 20 RLS policies.
