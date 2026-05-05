import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: false;
  href?: never;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonHrefProps = ComponentPropsWithoutRef<typeof Link> & {
  asChild?: false;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  asChild: true;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClass =
  "inline-flex items-center justify-center rounded-lg border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand/35 disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-brand bg-brand text-white hover:bg-brand-dark",
  secondary:
    "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700",
  ghost:
    "border-transparent bg-transparent text-primary hover:bg-card-subtle",
  danger: "border-up bg-up text-white hover:bg-up/90",
  outline:
    "border-border bg-transparent text-primary hover:bg-card-subtle",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-13 min-h-[52px] px-5",
};

export function Button(props: ButtonProps | ButtonHrefProps | ButtonLinkProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";
  const className = props.className
    ? `${baseClass} ${sizeClasses[size]} ${variantClasses[variant]} ${props.className}`
    : `${baseClass} ${sizeClasses[size]} ${variantClasses[variant]}`;

  if (props.asChild || ("href" in props && props.href !== undefined)) {
    const {
      asChild: _asChild,
      className: _className,
      variant: _variant,
      size: _size,
      ...linkProps
    } = props;
    return <Link className={className} {...linkProps} />;
  }

  const {
    asChild: _asChild,
    className: _className,
    variant: _variant,
    size: _size,
    ...buttonProps
  } = props;
  return <button className={className} {...buttonProps} />;
}
