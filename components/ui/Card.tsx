import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-[#1a1a1a] p-5 ${
        className ?? ""
      }`}
      {...props}
    />
  );
}
