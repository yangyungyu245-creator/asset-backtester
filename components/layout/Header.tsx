"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { isAuthConfigured } from "@/lib/auth/status";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/simple", label: "간단 모드" },
  { href: "/advanced/dates", label: "고급 모드", match: "/advanced" },
  { href: "/search", label: "종목 검색" },
  { href: "/about", label: "소개" },
];

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const authConfigured = isAuthConfigured();
  const supabase = useMemo(
    () => (authConfigured ? createClient() : null),
    [authConfigured],
  );
  const loginHref = `/login?next=${encodeURIComponent(pathname || "/")}`;
  const userLabel =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "내 계정";

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg text-base text-primary focus:outline-none focus:ring-2 focus:ring-brand/35"
          onClick={() => setIsOpen(false)}
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            🔥
          </span>
          <span className="font-extrabold tracking-wide">FIRE LIFE</span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex items-center gap-1" aria-label="주요 메뉴">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.match ? pathname.startsWith(item.match) : false);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand/35 ${
                    active
                      ? "bg-card-subtle text-primary"
                      : "text-secondary hover:bg-card-subtle hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {user ? (
            <>
              <Link
                href="/mypage"
                className="max-w-[150px] truncate rounded-lg px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-card-subtle hover:text-primary focus:outline-none focus:ring-2 focus:ring-brand/35"
              >
                {userLabel}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-card-subtle hover:text-primary focus:outline-none focus:ring-2 focus:ring-brand/35"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href={loginHref}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-card-subtle hover:text-primary focus:outline-none focus:ring-2 focus:ring-brand/35"
            >
              로그인
            </Link>
          )}
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-primary transition hover:bg-card-subtle focus:outline-none focus:ring-2 focus:ring-brand/35"
          >
            <span className="grid gap-1.5" aria-hidden="true">
              <span
                className={`h-0.5 w-5 rounded bg-current transition ${
                  isOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded bg-current transition ${
                  isOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 w-5 rounded bg-current transition ${
                  isOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {isOpen ? (
        <nav
          className="border-t border-border bg-page px-4 py-3 md:hidden"
          aria-label="주요 메뉴"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.match ? pathname.startsWith(item.match) : false);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-xl px-4 py-4 text-base font-bold transition focus:outline-none focus:ring-2 focus:ring-brand/35 ${
                    active
                      ? "bg-card-subtle text-primary"
                      : "text-primary hover:bg-card-subtle"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {user ? (
              <>
                <Link
                  href="/mypage"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-4 text-base font-bold text-primary hover:bg-card-subtle"
                >
                  마이페이지
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-xl px-4 py-4 text-left text-base font-bold text-primary hover:bg-card-subtle"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href={loginHref}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-4 text-base font-bold text-primary hover:bg-card-subtle"
              >
                로그인
              </Link>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
