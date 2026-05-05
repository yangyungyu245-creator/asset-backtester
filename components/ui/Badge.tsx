import type { ComponentPropsWithoutRef } from "react";

type BadgeVariant = "default" | "brand" | "up" | "down" | "neutral";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-card-subtle text-secondary",
  brand: "bg-brand-bg text-brand",
  up: "bg-up-bg text-up",
  down: "bg-down-bg text-down",
  neutral: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-1 text-xs font-semibold leading-none ${variantClasses[variant]} ${
        className ?? ""
      }`}
      {...props}
    />
  );
}
