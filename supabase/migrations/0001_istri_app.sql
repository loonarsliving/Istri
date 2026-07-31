-- Istri Keuangan & Pengingat app
-- All tables are prefixed with istri_ to stay isolated inside a shared Supabase project.
-- Every row is scoped to owner_id = auth.uid() via RLS, so this app's data never
-- crosses over with any other app sharing this project.

create table if not exists public.istri_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'cash' check (type in ('cash', 'bank', 'e_wallet', 'other')),
  starting_balance numeric(14,2) not null default 0,
  color text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.istri_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.istri_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.istri_accounts(id) on delete cascade,
  transfer_to_account_id uuid references public.istri_accounts(id) on delete set null,
  category_id uuid references public.istri_categories(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(14,2) not null check (amount > 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.istri_debts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('hutang', 'piutang')),
  counterparty text not null,
  principal_amount numeric(14,2) not null check (principal_amount > 0),
  remaining_amount numeric(14,2) not null check (remaining_amount >= 0),
  due_date date,
  note text,
  status text not null default 'active' check (status in ('active', 'paid_off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.istri_debt_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null references public.istri_debts(id) on delete cascade,
  account_id uuid references public.istri_accounts(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.istri_reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'lainnya' check (category in ('keuangan', 'utang', 'aktivitas', 'lainnya')),
  related_debt_id uuid references public.istri_debts(id) on delete set null,
  due_at timestamptz not null,
  repeat_rule text not null default 'none' check (repeat_rule in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'done', 'snoozed')),
  notify_whatsapp boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists istri_accounts_owner_idx on public.istri_accounts(owner_id);
create index if not exists istri_categories_owner_idx on public.istri_categories(owner_id);
create index if not exists istri_transactions_owner_idx on public.istri_transactions(owner_id, occurred_at desc);
create index if not exists istri_transactions_account_idx on public.istri_transactions(account_id);
create index if not exists istri_debts_owner_idx on public.istri_debts(owner_id);
create index if not exists istri_debt_payments_owner_idx on public.istri_debt_payments(owner_id);
create index if not exists istri_debt_payments_debt_idx on public.istri_debt_payments(debt_id);
create index if not exists istri_reminders_owner_idx on public.istri_reminders(owner_id, due_at);

alter table public.istri_accounts enable row level security;
alter table public.istri_categories enable row level security;
alter table public.istri_transactions enable row level security;
alter table public.istri_debts enable row level security;
alter table public.istri_debt_payments enable row level security;
alter table public.istri_reminders enable row level security;

create policy istri_accounts_owner_all on public.istri_accounts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy istri_categories_owner_all on public.istri_categories
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy istri_transactions_owner_all on public.istri_transactions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy istri_debts_owner_all on public.istri_debts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy istri_debt_payments_owner_all on public.istri_debt_payments
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy istri_reminders_owner_all on public.istri_reminders
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Keep updated_at fresh on edits.
create or replace function public.istri_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger istri_accounts_set_updated_at
  before update on public.istri_accounts
  for each row execute function public.istri_set_updated_at();

create trigger istri_debts_set_updated_at
  before update on public.istri_debts
  for each row execute function public.istri_set_updated_at();

create trigger istri_reminders_set_updated_at
  before update on public.istri_reminders
  for each row execute function public.istri_set_updated_at();

-- Automatically decrement remaining_amount and close out debts when a payment is logged.
create or replace function public.istri_apply_debt_payment()
returns trigger as $$
begin
  update public.istri_debts
  set remaining_amount = greatest(remaining_amount - new.amount, 0),
      status = case when remaining_amount - new.amount <= 0 then 'paid_off' else status end
  where id = new.debt_id;
  return new;
end;
$$ language plpgsql;

create trigger istri_debt_payments_apply
  after insert on public.istri_debt_payments
  for each row execute function public.istri_apply_debt_payment();
