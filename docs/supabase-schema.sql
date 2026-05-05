create table if not exists profiles (
  id uuid primary key,
  email text,
  created_at timestamptz default now()
);

create table if not exists saved_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  payload jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists saved_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  tickers jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  ticker text not null,
  created_at timestamptz default now(),
  unique (user_id, ticker)
);
