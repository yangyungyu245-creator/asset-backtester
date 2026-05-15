"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  BoardCategory,
  BoardPost,
  BoardPostSummary,
  BoardVisibility,
} from "@/lib/types/board";

export async function getPostSummaries(
  category?: BoardCategory,
): Promise<BoardPostSummary[]> {
  const supabase = createClient();
  let query = supabase
    .from("board_post_summaries")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPostSummary(id: string): Promise<BoardPostSummary | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("board_post_summaries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getPost(id: string): Promise<BoardPost | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("board_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createPost(
  title: string,
  content: string,
  category: BoardCategory,
  visibility: BoardVisibility,
): Promise<BoardPost> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다");

  const { data, error } = await supabase
    .from("board_posts")
    .insert({ user_id: user.id, title, content, category, visibility })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("board_posts").delete().eq("id", id);
  if (error) throw error;
}
