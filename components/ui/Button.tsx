import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: false;
};

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  asChild: true;
  children: ReactNode;
  className?: string;
};

const baseClass =
  "inline-flex h-11 items-center justify-center rounded-md border border-neutral-900 bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-info disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-neutral-50 dark:text-neutral-950 dark:hover:bg-neutral-200";

export function Button(props: ButtonProps | ButtonLinkProps) {
  const className = props.className ? `${baseClass} ${props.className}` : baseClass;

  if (props.asChild) {
    const { asChild: _asChild, className: _className, ...linkProps } = props;
    return <Link className={className} {...linkProps} />;
  }

  const { asChild: _asChild, className: _className, ...buttonProps } = props;
  return <button className={className} {...buttonProps} />;
}
