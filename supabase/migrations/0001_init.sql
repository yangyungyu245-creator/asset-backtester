create table if not exists public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  added_at timestamptz default now() not null,
  unique(user_id, symbol)
);

create table if not exists public.saved_simulations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  mode text not null check (mode in ('simple', 'advanced')),
  config jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.watchlist enable row level security;
alter table public.saved_simulations enable row level security;

drop policy if exists "watchlist_owner_all" on public.watchlist;
create policy "watchlist_owner_all" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_sim_owner_all" on public.saved_simulations;
create policy "saved_sim_owner_all" on public.saved_simulations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists watchlist_user_idx on public.watchlist(user_id);
create index if not exists saved_sim_user_idx on public.saved_simulations(user_id);

