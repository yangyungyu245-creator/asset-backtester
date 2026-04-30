"use client";

import { z } from "zod";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import {
  type CompoundFrequency,
  type SimpleSimulationInput,
  simulateSimple,
} from "@/lib/simulation/simple";
import { formatKRW } from "@/lib/utils/format";

const inputSchema = z.object({
  initialAmount: z.number().min(0, "0원 이상 입력하세요.").max(1_000_000_000, "최대 100억까지 입력할 수 있습니다."),
  monthlyContribution: z.number().min(0, "0원 이상 입력하세요.").max(100_000_000, "최대 1억까지 입력할 수 있습니다."),
  annualRatePercent: z.number().min(-50, "최소 -50%까지 입력할 수 있습니다.").max(100, "최대 100%까지 입력할 수 있습니다."),
  years: z.number().min(1, "최소 1년 이상 입력하세요.").max(50, "최대 50년까지 입력할 수 있습니다."),
  compoundFrequency: z.enum(["monthly", "quarterly", "annually"]),
});

type SimpleInputFormProps = {
  input: SimpleSimulationInput;
  onChange: (input: SimpleSimulationInput) => void;
  onSubmit: () => void;
};

const frequencyOptions: { value: CompoundFrequency; label: string }[] = [
  { value: "monthly", label: "월" },
  { value: "quarterly", label: "분기" },
  { value: "annually", label: "연" },
];

export function SimpleInputForm({ input, onChange, onSubmit }: SimpleInputFormProps) {
  const validation = inputSchema.safeParse(input);
  const errors = validation.success
    ? {}
    : validation.error.flatten().fieldErrors;
  const preview = validation.success ? simulateSimple(input).finalValue : null;

  const update = <Key extends keyof SimpleSimulationInput>(
    key: Key,
    value: SimpleSimulationInput[Key],
  ) => {
    onChange({ ...input, [key]: value });
  };

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
      onSubmit={(event) => {
        event.preventDefault();
        if (validation.success) {
          onSubmit();
        }
      }}
    >
      <div className="grid gap-5 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]">
        <NumberInput
          id="initialAmount"
          label="초기 투자금"
          value={input.initialAmount}
          onChange={(value) => update("initialAmount", value)}
          error={errors.initialAmount?.[0]}
          min={0}
          suffix="원"
        />
        <NumberInput
          id="monthlyContribution"
          label="월 적립액"
          value={input.monthlyContribution}
          onChange={(value) => update("monthlyContribution", value)}
          error={errors.monthlyContribution?.[0]}
          min={0}
          suffix="원"
        />

        <div>
          <label
            htmlFor="annualRatePercent"
            className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
          >
            연 수익률
          </label>
          <div className="mt-2 flex h-11 items-center rounded-md border border-neutral-300 bg-white px-3 focus-within:ring-2 focus-within:ring-info dark:border-white/10 dark:bg-neutral-950">
            <input
              id="annualRatePercent"
              type="number"
              step="0.01"
              value={input.annualRatePercent}
              onChange={(event) =>
                update("annualRatePercent", Number(event.target.value))
              }
              className="min-w-0 flex-1 bg-transparent text-sm text-neutral-950 outline-none dark:text-neutral-50"
            />
            <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
              %
            </span>
          </div>
          {errors.annualRatePercent?.[0] ? (
            <p className="mt-1 text-xs text-negative">
              {errors.annualRatePercent[0]}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="years"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              투자 기간
            </label>
            <span className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
              {input.years}년
            </span>
          </div>
          <input
            id="years"
            type="range"
            min={1}
            max={50}
            value={input.years}
            onChange={(event) => update("years", Number(event.target.value))}
            className="mt-3 w-full accent-info"
          />
          {errors.years?.[0] ? (
            <p className="mt-1 text-xs text-negative">{errors.years[0]}</p>
          ) : null}
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            복리 주기
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {frequencyOptions.map((option) => (
              <label
                key={option.value}
                className={`flex h-10 cursor-pointer items-center justify-center rounded-md border text-sm transition ${
                  input.compoundFrequency === option.value
                    ? "border-info bg-info text-white"
                    : "border-neutral-300 text-neutral-700 hover:border-info dark:border-white/10 dark:text-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="compoundFrequency"
                  value={option.value}
                  checked={input.compoundFrequency === option.value}
                  onChange={() => update("compoundFrequency", option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Button type="submit" disabled={!validation.success} className="w-full">
          계산하기
        </Button>
      </div>

      <aside className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          예상 최종 자산
        </p>
        <p className="mt-3 text-3xl font-semibold text-neutral-950 dark:text-neutral-50">
          {preview === null ? "-" : formatKRW(preview)}
        </p>
        <p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          입력값을 바꾸면 결과가 즉시 갱신됩니다. 실제 세금, 수수료, 상품별 이자
          지급 방식은 반영하지 않은 단순 복리 계산입니다.
        </p>
      </aside>
    </form>
  );
}
