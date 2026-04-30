import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "primary" | "outline";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: false;
  variant?: ButtonVariant;
};

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  asChild: true;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

const baseClass =
  "inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-info disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-neutral-900 bg-neutral-950 text-white hover:bg-neutral-800 dark:border-white/10 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200",
  outline:
    "border-neutral-300 bg-transparent text-neutral-950 hover:bg-neutral-100 dark:border-white/25 dark:text-neutral-50 dark:hover:bg-white/10",
};

export function Button(props: ButtonProps | ButtonLinkProps) {
  const variant = props.variant ?? "primary";
  const className = props.className
    ? `${baseClass} ${variantClasses[variant]} ${props.className}`
    : `${baseClass} ${variantClasses[variant]}`;

  if (props.asChild) {
    const {
      asChild: _asChild,
      className: _className,
      variant: _variant,
      ...linkProps
    } = props;
    return <Link className={className} {...linkProps} />;
  }

  const {
    asChild: _asChild,
    className: _className,
    variant: _variant,
    ...buttonProps
  } = props;
  return <button className={className} {...buttonProps} />;
}
