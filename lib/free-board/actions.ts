"use client";

import { createClient } from "@/lib/supabase/client";
import type { FreeBoardSort, FreeComment, FreeLike, FreePost } from "@/lib/types/free-board";

export async function getPosts(
  searchQuery = "",
  sort: FreeBoardSort = "latest",
): Promise<FreePost[]> {
  const supabase = createClient();
  let query = supabase.from("free_posts").select("*");

  const keyword = searchQuery.trim();
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
  }

  if (sort === "popular") {
    query = query
      .order("like_count", { ascending: false })
      .order("comment_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPost(id: string): Promise<FreePost | null> {
  const supabase = createClient();
  await supabase.rpc("increment_free_post_view", { post_id: id });

  const { data, error } = await supabase
    .from("free_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createPost(title: string, content: string): Promise<FreePost> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("free_posts")
    .insert({ user_id: user.id, title, content })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("free_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function getComments(postId: string): Promise<FreeComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("free_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createComment(
  postId: string,
  content: string,
  parentCommentId?: string | null,
): Promise<FreeComment> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("free_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_comment_id: parentCommentId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("free_comments").delete().eq("id", id);
  if (error) throw error;
}

export async function getMyLike(postId: string): Promise<FreeLike | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("free_likes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function toggleLike(postId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const existing = await getMyLike(postId);
  if (existing) {
    const { error } = await supabase.from("free_likes").delete().eq("id", existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from("free_likes")
    .insert({ post_id: postId, user_id: user.id });

  if (error) throw error;
  return true;
}

export async function getHotPosts(limit = 5): Promise<FreePost[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("free_posts")
    .select("*")
    .or("like_count.gte.10,comment_count.gte.10")
    .order("like_count", { ascending: false })
    .order("comment_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
