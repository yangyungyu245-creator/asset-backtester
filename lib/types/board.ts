export type BoardCategory = "feedback" | "bug" | "feature" | "other";
export type BoardVisibility = "public" | "private";

export type BoardPost = {
  id: string;
  user_id: string;
  category: BoardCategory;
  title: string;
  content: string;
  visibility: BoardVisibility;
  is_resolved: boolean;
  admin_reply: string | null;
  admin_reply_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BoardPostSummary = {
  id: string;
  category: BoardCategory;
  title: string;
  visibility: BoardVisibility;
  is_resolved: boolean;
  admin_reply: string | null;
  admin_reply_at: string | null;
  created_at: string;
  updated_at: string;
  is_mine: boolean;
};

export const CATEGORY_LABELS: Record<BoardCategory, string> = {
  feedback: "건의/피드백",
  bug: "버그 신고",
  feature: "기능 요청",
  other: "기타",
};

export const VISIBILITY_LABELS: Record<BoardVisibility, string> = {
  public: "공개",
  private: "나만",
};
