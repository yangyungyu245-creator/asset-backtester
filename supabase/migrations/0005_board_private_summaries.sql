create or replace view public.board_post_summaries as
select
  id,
  category,
  title,
  visibility,
  is_resolved,
  admin_reply,
  admin_reply_at,
  created_at,
  updated_at,
  auth.uid() = user_id as is_mine
from public.board_posts;

grant select on public.board_post_summaries to anon, authenticated;
