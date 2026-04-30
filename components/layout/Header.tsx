import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-white/10 bg-neutral-950/90">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold text-neutral-50 focus:outline-none focus:ring-2 focus:ring-info"
        >
          투자 시뮬레이터
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
