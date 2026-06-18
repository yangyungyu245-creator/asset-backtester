"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authUnavailableMessage, isAuthConfigured } from "@/lib/auth/status";
import { createPost } from "@/lib/free-board/actions";
import { createClient } from "@/lib/supabase/client";

export function FreeWriteForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = useMemo(() => (isAuthConfigured() ? createClient() : null), []);

  useEffect(() => {
    if (!supabase) {
      setError(authUnavailableMessage);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent("/board/free/write")}`);
      }
    });
  }, [router, supabase]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const post = await createPost(title.trim(), content.trim());
      router.push(`/board/free/${post.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "글을 등록하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-6 py-4 sm:py-8">
      <div>
        <p className="text-sm font-semibold text-secondary">자유게시판</p>
        <h1 className="mt-3 text-3xl font-bold text-primary">글쓰기</h1>
      </div>

      <Card rounded="xl" padding="lg">
        <form onSubmit={submit} className="grid gap-5">
          <label className="grid gap-2 text-sm font-bold text-primary">
            제목
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              className="h-11 rounded-md border border-border bg-card px-3 text-base font-medium outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-primary">
            내용
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={12}
              className="min-h-[260px] rounded-md border border-border bg-card px-3 py-3 text-base leading-7 outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-up/30 bg-up-bg px-3 py-2 text-sm font-semibold text-up">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.push("/board/free")}>
              취소
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "등록 중..." : "등록"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
