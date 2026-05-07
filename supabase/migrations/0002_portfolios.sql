create table if not exists public.portfolios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.portfolio_holdings (
  id uuid default gen_random_uuid() primary key,
  portfolio_id uuid references public.portfolios(id) on delete cascade not null,
  symbol text not null,
  shares numeric not null default 0,
  avg_price numeric not null default 0,
  currency text not null default 'USD',
  created_at timestamptz default now() not null,
  unique(portfolio_id, symbol)
);

alter table public.portfolios enable row level security;
alter table public.portfolio_holdings enable row level security;

drop policy if exists "portfolio_owner_all" on public.portfolios;
create policy "portfolio_owner_all" on public.portfolios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "holding_via_portfolio_owner" on public.portfolio_holdings;
create policy "holding_via_portfolio_owner" on public.portfolio_holdings
  for all using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  ) with check (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

create index if not exists portfolios_user_idx on public.portfolios(user_id);
create index if not exists holdings_portfolio_idx on public.portfolio_holdings(portfolio_id);
