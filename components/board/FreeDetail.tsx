"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  createComment,
  deleteComment,
  deletePost,
  getComments,
  getMyLike,
  getPost,
  toggleLike,
} from "@/lib/free-board/actions";
import { isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";
import type { FreeComment, FreePost } from "@/lib/types/free-board";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function CommentForm({
  placeholder,
  submitting,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  submitting: boolean;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }

    await onSubmit(content.trim());
    setContent("");
  }

  return (
    <form onSubmit={submit} className="grid gap-2">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="min-h-[108px] rounded-lg border border-border bg-card px-3 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-brand/30"
      />
      {error ? <p className="text-sm font-semibold text-up">{error}</p> : null}
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "등록 중..." : "등록"}
        </Button>
      </div>
    </form>
  );
}

export function FreeDetail({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<FreePost | null>(null);
  const [comments, setComments] = useState<FreeComment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState(false);
  const [error, setError] = useState("");

  const supabase = useMemo(() => (isAuthConfigured() ? createClient() : null), []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [supabase]);

  useEffect(() => {
    async function load() {
      try {
        const [nextPost, nextComments, myLike] = await Promise.all([
          getPost(id),
          getComments(id),
          getMyLike(id),
        ]);
        setPost(nextPost);
        setComments(nextComments);
        setLiked(Boolean(myLike));
      } catch {
        setError("글을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const parentComments = comments.filter((comment) => !comment.parent_comment_id);

  function requireLogin() {
    router.push(`/login?next=${encodeURIComponent(`/board/free/${id}`)}`);
  }

  async function submitComment(content: string, parentCommentId?: string | null) {
    if (!user) {
      requireLogin();
      return;
    }

    try {
      setSubmittingComment(true);
      const created = await createComment(id, content, parentCommentId);
      setComments((current) => [...current, created]);
      setPost((current) =>
        current ? { ...current, comment_count: current.comment_count + 1 } : current,
      );
      setReplyTo(null);
    } catch {
      setError("댓글을 등록하지 못했습니다.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function removeComment(commentId: string) {
    const confirmed = window.confirm("댓글을 삭제할까요?");
    if (!confirmed) return;

    try {
      await deleteComment(commentId);
      setComments((current) => {
        const removedIds = new Set<string>([commentId]);
        current.forEach((comment) => {
          if (comment.parent_comment_id === commentId) removedIds.add(comment.id);
        });
        const removedCount = current.filter((comment) => removedIds.has(comment.id)).length;
        setPost((nextPost) =>
          nextPost
            ? {
                ...nextPost,
                comment_count: Math.max(nextPost.comment_count - removedCount, 0),
              }
            : nextPost,
        );
        return current.filter((comment) => !removedIds.has(comment.id));
      });
    } catch {
      setError("댓글을 삭제하지 못했습니다.");
    }
  }

  async function removePost() {
    if (!post || deletingPost) return;
    const confirmed = window.confirm("이 글을 삭제할까요?");
    if (!confirmed) return;

    try {
      setDeletingPost(true);
      await deletePost(post.id);
      router.push("/board/free");
      router.refresh();
    } catch {
      setError("글을 삭제하지 못했습니다.");
      setDeletingPost(false);
    }
  }

  async function pressLike() {
    if (!user) {
      requireLogin();
      return;
    }

    try {
      const nextLiked = await toggleLike(id);
      setLiked(nextLiked);
      setPost((current) =>
        current
          ? {
              ...current,
              like_count: Math.max(current.like_count + (nextLiked ? 1 : -1), 0),
            }
          : current,
      );
    } catch {
      setError("좋아요를 처리하지 못했습니다.");
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl py-8">
        <Card rounded="xl" className="p-8 text-center text-sm text-secondary">
          불러오는 중입니다...
        </Card>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl py-8">
        <Card rounded="xl" className="p-8 text-center">
          <p className="text-sm text-secondary">글을 찾을 수 없습니다.</p>
          <Button href="/board/free" className="mt-5">
            목록으로
          </Button>
        </Card>
      </section>
    );
  }

  const isMine = user?.id === post.user_id;

  return (
    <section className="mx-auto grid max-w-3xl gap-6 py-4 sm:py-8">
      <Button href="/board/free" variant="ghost" className="w-fit">
        목록으로
      </Button>

      <article className="rounded-xl border border-border bg-card p-5 shadow-subtle sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-secondary">
          <span>익명</span>
          <span aria-hidden="true">·</span>
          <time>{formatDate(post.created_at)}</time>
          <span aria-hidden="true">·</span>
          <span>조회 {post.view_count}</span>
          {isMine ? (
            <span className="rounded bg-card-subtle px-2 py-1 text-xs font-bold text-secondary">
              내 글
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 break-words text-2xl font-bold leading-tight text-primary sm:text-3xl">
          {post.title}
        </h1>

        <div className="mt-6 whitespace-pre-wrap break-words border-y border-border py-6 text-base leading-8 text-primary">
          {post.content}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={liked ? "primary" : "outline"}
              size="sm"
              onClick={pressLike}
            >
              좋아요 {post.like_count}
            </Button>
            <span className="text-sm font-semibold text-secondary">
              댓글 {post.comment_count}
            </span>
          </div>
          {isMine ? (
            <Button type="button" variant="danger" size="sm" onClick={removePost} disabled={deletingPost}>
              {deletingPost ? "삭제 중..." : "삭제"}
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-5 rounded-lg border border-up/30 bg-up-bg px-3 py-2 text-sm font-semibold text-up">
            {error}
          </p>
        ) : null}
      </article>

      <section className="grid gap-4">
        <h2 className="text-lg font-bold text-primary">댓글 {post.comment_count}개</h2>

        <div className="grid gap-3">
          {parentComments.length > 0 ? (
            parentComments.map((comment) => {
              const replies = comments.filter(
                (reply) => reply.parent_comment_id === comment.id,
              );
              const mine = user?.id === comment.user_id;

              return (
                <div key={comment.id} className="grid gap-3">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-secondary">
                        <span>익명</span>
                        <span aria-hidden="true">·</span>
                        <time>{formatDate(comment.created_at)}</time>
                      </div>
                      {mine ? (
                        <button
                          type="button"
                          onClick={() => removeComment(comment.id)}
                          className="text-xs font-bold text-up"
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-primary">
                      {comment.content}
                    </p>
                    <button
                      type="button"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="mt-3 text-xs font-bold text-brand"
                    >
                      답글 달기
                    </button>
                  </div>

                  {replies.map((reply) => {
                    const replyMine = user?.id === reply.user_id;
                    return (
                      <div
                        key={reply.id}
                        className="ml-5 rounded-xl border border-border bg-card-subtle p-4 sm:ml-8"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-secondary">
                            <span>익명</span>
                            <span aria-hidden="true">·</span>
                            <time>{formatDate(reply.created_at)}</time>
                          </div>
                          {replyMine ? (
                            <button
                              type="button"
                              onClick={() => removeComment(reply.id)}
                              className="text-xs font-bold text-up"
                            >
                              삭제
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-primary">
                          {reply.content}
                        </p>
                      </div>
                    );
                  })}

                  {replyTo === comment.id ? (
                    <div className="ml-5 sm:ml-8">
                      <CommentForm
                        placeholder="답글을 입력하세요"
                        submitting={submittingComment}
                        onSubmit={(content) => submitComment(content, comment.id)}
                        onCancel={() => setReplyTo(null)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <Card rounded="xl" className="p-6 text-center text-sm text-secondary">
              아직 댓글이 없습니다.
            </Card>
          )}
        </div>

        <Card rounded="xl">
          <h3 className="mb-3 text-sm font-bold text-primary">댓글 작성</h3>
          <CommentForm
            placeholder={user ? "댓글을 입력하세요" : "로그인 후 댓글을 작성할 수 있습니다"}
            submitting={submittingComment}
            onSubmit={(content) => submitComment(content)}
          />
        </Card>
      </section>
    </section>
  );
}
