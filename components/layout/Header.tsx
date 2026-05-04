"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navItems = [
  { href: "/simple", label: "간단 모드" },
  { href: "/advanced/dates", label: "고급 모드" },
  { href: "/request", label: "종목 요청" },
  { href: "/about", label: "소개" },
];

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-base text-neutral-950 focus:outline-none focus:ring-2 focus:ring-info dark:text-neutral-50"
          onClick={() => setIsOpen(false)}
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            📈
          </span>
          <span className="font-extrabold tracking-wide">FIRE LIFE</span>
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          <nav className="flex items-center gap-1" aria-label="주요 메뉴">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-info ${
                    active
                      ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-neutral-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-300 text-neutral-800 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:text-neutral-100 dark:hover:bg-white/10"
          >
            <span className="grid gap-1.5" aria-hidden="true">
              <span className={`h-0.5 w-5 rounded bg-current transition ${isOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-5 rounded bg-current transition ${isOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-5 rounded bg-current transition ${isOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>
      {isOpen ? (
        <nav
          className="border-t border-neutral-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-950 md:hidden"
          aria-label="모바일 주요 메뉴"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-md px-3 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-info ${
                    active
                      ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
