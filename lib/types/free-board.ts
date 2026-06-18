export type FreePost = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_hot: boolean;
  created_at: string;
  updated_at: string;
};

export type FreeComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
};

export type FreeLike = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type FreeBoardSort = "latest" | "popular";
