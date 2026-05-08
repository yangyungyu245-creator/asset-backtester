-- Board categories
create type public.board_category as enum ('feedback', 'bug', 'feature', 'other');

-- Board post visibility
create type public.board_visibility as enum ('public', 'private');

create table public.board_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  category board_category not null default 'feedback',
  title text not null,
  content text not null,
  visibility board_visibility not null default 'public',
  is_resolved boolean default false,
  admin_reply text,
  admin_reply_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.board_posts enable row level security;

create policy "public_posts_read" on public.board_posts
  for select using (
    visibility = 'public' or auth.uid() = user_id
  );

create policy "own_posts_insert" on public.board_posts
  for insert with check (auth.uid() = user_id);

create policy "own_posts_update" on public.board_posts
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own_posts_delete" on public.board_posts
  for delete using (auth.uid() = user_id);

create index board_posts_category_idx on public.board_posts(category);
create index board_posts_created_idx on public.board_posts(created_at desc);
create index board_posts_user_idx on public.board_posts(user_id);
