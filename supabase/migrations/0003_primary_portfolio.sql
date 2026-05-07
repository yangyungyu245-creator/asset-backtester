alter table public.portfolios
add column if not exists is_primary boolean default false;

create unique index if not exists portfolios_user_primary_idx
on public.portfolios(user_id)
where is_primary = true;
