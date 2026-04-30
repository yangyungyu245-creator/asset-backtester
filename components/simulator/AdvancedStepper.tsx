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
      <ol className="grid grid-cols-3 gap-2 rounded-lg border border-neutral-200 bg-white p-2 dark:border-white/10 dark:bg-[#1a1a1a]">
        {steps.map((step) => {
          const isCurrent = step.number === currentStep;
          const isPast = step.number < currentStep;

          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className={`flex h-10 items-center justify-center rounded-md text-sm font-medium transition ${
                  isCurrent
                    ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                    : isPast
                      ? "text-info hover:bg-info/10"
                      : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5"
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
