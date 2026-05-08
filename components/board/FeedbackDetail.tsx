"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deletePost, getPost } from "@/lib/board/actions";
import { isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORY_LABELS,
  VISIBILITY_LABELS,
  type BoardPost,
} from "@/lib/types/board";

function formatDate(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function FeedbackDetail({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<BoardPost | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const supabase = useMemo(() => (isAuthConfigured() ? createClient() : null), []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [supabase]);

  useEffect(() => {
    getPost(id)
      .then(setPost)
      .catch(() => setError("글을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  async function remove() {
    if (!post || deleting) return;
    const confirmed = window.confirm("이 글을 삭제할까요?");
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deletePost(post.id);
      router.push("/board/feedback");
      router.refresh();
    } catch {
      setError("글을 삭제하지 못했습니다.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl py-8">
        <Card rounded="2xl" className="p-8 text-center text-sm text-secondary">
          불러오는 중입니다...
        </Card>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl py-8">
        <Card rounded="2xl" className="p-8 text-center">
          <p className="text-sm text-secondary">글을 찾을 수 없습니다.</p>
          <Button href="/board/feedback" className="mt-5">
            목록으로
          </Button>
        </Card>
      </section>
    );
  }

  const isMine = user?.id === post.user_id;

  return (
    <section className="mx-auto grid max-w-3xl gap-6 py-4 sm:py-8">
      <Button href="/board/feedback" variant="ghost" className="w-fit">
        목록으로
      </Button>

      <article className="rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
            {CATEGORY_LABELS[post.category]}
          </span>
          <span className="rounded bg-card-subtle px-2 py-1 text-xs font-bold text-secondary">
            {VISIBILITY_LABELS[post.visibility]}
          </span>
          {isMine ? (
            <span className="rounded bg-card-subtle px-2 py-1 text-xs font-bold text-secondary">
              내 글
            </span>
          ) : null}
        </div>

        <h1 className="mt-4 break-words text-2xl font-bold leading-tight text-primary sm:text-3xl">
          {post.title}
        </h1>
        <time className="mt-3 block text-sm font-semibold text-secondary">
          {formatDate(post.created_at)}
        </time>

        <div className="mt-6 whitespace-pre-wrap break-words border-y border-border py-6 text-base leading-8 text-primary">
          {post.content}
        </div>

        {post.admin_reply ? (
          <section className="mt-6 rounded-xl bg-card-subtle p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-primary">관리자 답변</h2>
              <time className="text-xs font-semibold text-secondary">
                {formatDate(post.admin_reply_at)}
              </time>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-secondary">
              {post.admin_reply}
            </p>
          </section>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-lg border border-up/30 bg-up-bg px-3 py-2 text-sm font-semibold text-up">
            {error}
          </p>
        ) : null}

        {isMine ? (
          <div className="mt-6 flex justify-end">
            <Button type="button" variant="danger" onClick={remove} disabled={deleting}>
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </div>
        ) : null}
      </article>
    </section>
  );
}
