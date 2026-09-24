create table if not exists public.timewall_postbacks (
  transaction_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  raw_coins integer not null,
  credited_coins integer not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_referral_code_lower_idx on public.profiles (lower(referral_code));

alter table public.timewall_postbacks enable row level security;

create policy "Service role manages Timewall postbacks"
  on public.timewall_postbacks for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
