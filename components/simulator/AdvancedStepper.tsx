"use client";

import Link from "next/link";

const steps = [
  { number: 1, label: "기간", href: "/advanced/dates" },
  { number: 2, label: "종목", href: "/advanced/tickers" },
  { number: 3, label: "금액·비중", href: "/advanced/setup" },
];

type AdvancedStepperProps = {
  currentStep: 1 | 2 | 3;
};

export function AdvancedStepper({ currentStep }: AdvancedStepperProps) {
  return (
    <nav aria-label="고급 모드 단계" className="mb-6">
      <ol className="grid grid-cols-3 gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-subtle">
        {steps.map((step) => {
          const isCurrent = step.number === currentStep;
          const isPast = step.number < currentStep;

          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className={`flex h-11 min-w-24 items-center justify-center rounded-lg text-sm font-bold transition ${
                  isCurrent
                    ? "bg-brand text-white"
                    : isPast
                      ? "text-primary hover:bg-card-subtle"
                      : "text-secondary hover:bg-card-subtle hover:text-primary"
                }`}
              >
                {step.number}. {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
