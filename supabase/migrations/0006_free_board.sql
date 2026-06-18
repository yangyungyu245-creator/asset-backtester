create table public.free_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  view_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  is_hot boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.free_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.free_posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  parent_comment_id uuid references public.free_comments(id) on delete cascade,
  created_at timestamptz default now() not null
);

create table public.free_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.free_posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(post_id, user_id)
);

alter table public.free_posts enable row level security;
alter table public.free_comments enable row level security;
alter table public.free_likes enable row level security;

create policy "free_posts_read" on public.free_posts for select using (true);
create policy "free_posts_insert" on public.free_posts for insert with check (auth.uid() = user_id);
create policy "free_posts_update" on public.free_posts for update using (auth.uid() = user_id);
create policy "free_posts_delete" on public.free_posts for delete using (auth.uid() = user_id);

create policy "free_comments_read" on public.free_comments for select using (true);
create policy "free_comments_insert" on public.free_comments for insert with check (auth.uid() = user_id);
create policy "free_comments_delete" on public.free_comments for delete using (auth.uid() = user_id);

create policy "free_likes_read" on public.free_likes for select using (true);
create policy "free_likes_insert" on public.free_likes for insert with check (auth.uid() = user_id);
create policy "free_likes_delete" on public.free_likes for delete using (auth.uid() = user_id);

grant select on public.free_posts to anon;
grant select on public.free_comments to anon;
grant select on public.free_likes to anon;

create index free_posts_created_idx on public.free_posts(created_at desc);
create index free_posts_hot_idx on public.free_posts(is_hot, like_count desc);
create index free_comments_post_idx on public.free_comments(post_id, created_at);
create index free_likes_post_idx on public.free_likes(post_id);

create or replace function public.set_free_post_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger free_posts_set_updated_at
before update on public.free_posts
for each row execute function public.set_free_post_updated_at();

create or replace function public.refresh_free_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.free_posts
      set comment_count = comment_count + 1
      where id = new.post_id;
    return new;
  end if;

  update public.free_posts
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.post_id;
  return old;
end;
$$;

create trigger free_comments_count_insert
after insert on public.free_comments
for each row execute function public.refresh_free_post_comment_count();

create trigger free_comments_count_delete
after delete on public.free_comments
for each row execute function public.refresh_free_post_comment_count();

create or replace function public.refresh_free_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.free_posts
      set like_count = like_count + 1
      where id = new.post_id;
    return new;
  end if;

  update public.free_posts
    set like_count = greatest(like_count - 1, 0)
    where id = old.post_id;
  return old;
end;
$$;

create trigger free_likes_count_insert
after insert on public.free_likes
for each row execute function public.refresh_free_post_like_count();

create trigger free_likes_count_delete
after delete on public.free_likes
for each row execute function public.refresh_free_post_like_count();

create or replace function public.increment_free_post_view(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.free_posts
    set view_count = view_count + 1
    where id = post_id;
$$;

grant execute on function public.increment_free_post_view(uuid) to anon, authenticated;
