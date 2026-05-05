"use client";

import { authUnavailableMessage } from "@/lib/auth/status";

type SaveActionButtonProps = {
  label: string;
  disabledLabel?: string;
  className?: string;
};

export function SaveActionButton({
  label,
  disabledLabel,
  className,
}: SaveActionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => alert(authUnavailableMessage)}
      className={
        className ??
        "inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-info dark:border-white/10 dark:text-neutral-100 dark:hover:bg-white/5"
      }
      aria-label={disabledLabel ?? label}
    >
      {label}
    </button>
  );
}
