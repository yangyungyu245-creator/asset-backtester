import type { ComponentPropsWithoutRef, ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outline";
type CardPadding = "sm" | "md" | "lg";
type CardRounded = "lg" | "xl" | "2xl";

type CardProps = ComponentPropsWithoutRef<"div"> & {
  variant?: CardVariant;
  padding?: CardPadding;
  rounded?: CardRounded;
  children?: ReactNode;
};

const variantClasses: Record<CardVariant, string> = {
  default: "border border-border bg-card shadow-subtle",
  elevated: "border border-transparent bg-card shadow-medium",
  outline: "border border-border bg-transparent shadow-none",
};

const paddingClasses: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const roundedClasses: Record<CardRounded, string> = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

export function Card({
  className,
  variant = "default",
  padding = "md",
  rounded = "xl",
  ...props
}: CardProps) {
  return (
    <div
      className={`${roundedClasses[rounded]} ${variantClasses[variant]} ${paddingClasses[padding]} ${
        className ?? ""
      }`}
      {...props}
    />
  );
}
