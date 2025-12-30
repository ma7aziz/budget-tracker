-- Supabase schema for Budget Tracker
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  "order" integer not null default 0,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'card', 'wallet')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  month text not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  limit_cents integer not null check (limit_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category_id)
);

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  month text not null,
  limit_cents integer not null check (limit_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('expense', 'income')),
  amount_cents integer not null check (amount_cents >= 0),
  date date not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete set null,
  merchant text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  currency text not null,
  locale text not null,
  week_start integer not null,
  theme text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_date on public.transactions(date);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_transactions_user_date on public.transactions(user_id, date);

create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_accounts_user_id on public.accounts(user_id);
create index if not exists idx_budgets_user_id on public.budgets(user_id);
create index if not exists idx_budgets_user_month on public.budgets(user_id, month);
create index if not exists idx_monthly_budgets_user_id on public.monthly_budgets(user_id);
create index if not exists idx_monthly_budgets_user_month on public.monthly_budgets(user_id, month);
create index if not exists idx_settings_user_id on public.settings(user_id);

alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.budgets enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.transactions enable row level security;
alter table public.settings enable row level security;

create policy "Categories are user-owned" on public.categories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Accounts are user-owned" on public.accounts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Budgets are user-owned" on public.budgets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Monthly budgets are user-owned" on public.monthly_budgets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Transactions are user-owned" on public.transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Settings are user-owned" on public.settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
