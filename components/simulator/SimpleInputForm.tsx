"use client";

import { z } from "zod";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RangeWithNumber } from "@/components/ui/RangeWithNumber";
import {
  type CompoundFrequency,
  type SimpleSimulationInput,
} from "@/lib/simulation/simple";
import type { InvestmentFrequency } from "@/lib/simulation/types";

const periodSchema = z.object({
  id: z.string(),
  durationYears: z
    .number()
    .min(1, "최소 1년 이상 입력하세요.")
    .max(50, "구간별 최대 50년까지 입력할 수 있습니다."),
  monthlyAmount: z
    .number()
    .min(0, "0원 이상 입력하세요.")
    .max(100_000_000, "최대 1억까지 입력할 수 있습니다."),
});

const inputSchema = z
  .object({
    initialAmount: z
      .number()
      .min(0, "0원 이상 입력하세요.")
      .max(1_000_000_000, "최대 10억까지 입력할 수 있습니다."),
    annualRatePercent: z
      .number()
      .min(-50, "최소 -50%까지 입력할 수 있습니다.")
      .max(100, "최대 100%까지 입력할 수 있습니다."),
    compoundFrequency: z.enum(["monthly", "quarterly", "annually"]),
    contributionFrequency: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
    contributionSchedule: z.array(periodSchema).min(1),
  })
  .refine(
    (value) =>
      value.contributionSchedule.reduce(
        (total, period) => total + period.durationYears,
        0,
      ) <= 50,
    {
      path: ["contributionSchedule"],
      message: "전체 기간은 최대 50년까지 입력할 수 있습니다.",
    },
  );

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

const contributionFrequencyOptions: Array<{
  value: InvestmentFrequency;
  label: string;
}> = [
  { value: "daily", label: "매일" },
  { value: "weekly", label: "매주" },
  { value: "monthly", label: "매월" },
];

const contributionAmountLabel: Record<InvestmentFrequency, string> = {
  daily: "일 적립액",
  weekly: "주 적립액",
  monthly: "월 적립액",
};

function createPeriod() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    durationYears: 1,
    monthlyAmount: 0,
  };
}

export function SimpleInputForm({ input, onChange, onSubmit }: SimpleInputFormProps) {
  const validation = inputSchema.safeParse(input);
  const errors = validation.success
    ? {}
    : validation.error.flatten().fieldErrors;
  const totalYears = input.contributionSchedule.reduce(
    (total, period) => total + period.durationYears,
    0,
  );

  const update = <Key extends keyof SimpleSimulationInput>(
    key: Key,
    value: SimpleSimulationInput[Key],
  ) => {
    onChange({ ...input, [key]: value });
  };

  const updatePeriod = (
    id: string,
    patch: Partial<SimpleSimulationInput["contributionSchedule"][number]>,
  ) => {
    update(
      "contributionSchedule",
      input.contributionSchedule.map((period) =>
        period.id === id ? { ...period, ...patch } : period,
      ),
    );
  };

  const addPeriod = () => {
    update("contributionSchedule", [...input.contributionSchedule, createPeriod()]);
  };

  const removePeriod = (id: string) => {
    if (input.contributionSchedule.length < 2) {
      return;
    }

    update(
      "contributionSchedule",
      input.contributionSchedule.filter((period) => period.id !== id),
    );
  };

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (validation.success) {
          onSubmit();
        }
      }}
    >
      <Card rounded="2xl" padding="lg" className="grid gap-5">
        <div className="rounded-xl bg-card-subtle p-4 text-sm leading-6 text-secondary">
          <p>지금부터 {totalYears}년 동안의 적립 시나리오를 시뮬레이션합니다.</p>
          <p>각 구간별로 다른 적립액을 설정할 수 있습니다.</p>
        </div>

        <NumberInput
          id="initialAmount"
          label="초기 투자금"
          value={input.initialAmount}
          onChange={(value) => update("initialAmount", value)}
          error={errors.initialAmount?.[0]}
          min={0}
          placeholder="예: 10,000,000"
          suffix="원"
        />

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary">
                적립 일정
              </h2>
              <p className="mt-1 text-sm text-secondary">
                예: 1년 100만 → 3년 150만 → 5년 200만
              </p>
            </div>
            <button
              type="button"
              onClick={addPeriod}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-brand transition hover:bg-brand-bg"
            >
              + 구간 추가
            </button>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-bold text-primary">
              적립 주기
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {contributionFrequencyOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex h-10 cursor-pointer items-center justify-center rounded-md border text-sm transition ${
                    input.contributionFrequency === option.value
                      ? "border-brand bg-brand text-white"
                      : "border-border text-secondary hover:bg-card-subtle hover:text-primary"
                  }`}
                >
                  <input
                    type="radio"
                    name="contributionFrequency"
                    value={option.value}
                    checked={input.contributionFrequency === option.value}
                    onChange={() => update("contributionFrequency", option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-3 grid gap-3">
            {input.contributionSchedule.map((period, index) => (
              <div
                key={period.id}
                className="grid gap-4 rounded-xl bg-card-subtle p-4 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.8fr)_auto] lg:items-end"
              >
                <RangeWithNumber
                  id={`durationYears-${period.id}`}
                  label={`구간 ${index + 1}: 기간`}
                  value={period.durationYears}
                  onChange={(durationYears) =>
                    updatePeriod(period.id, { durationYears })
                  }
                  min={1}
                  max={50}
                  step={1}
                  unit="년"
                />
                <NumberInput
                  id={`monthlyAmount-${period.id}`}
                  label={contributionAmountLabel[input.contributionFrequency ?? "monthly"]}
                  value={period.monthlyAmount}
                  onChange={(monthlyAmount) =>
                    updatePeriod(period.id, { monthlyAmount })
                  }
                  min={0}
                  max={100_000_000}
                  placeholder="예: 300,000"
                  suffix="원"
                />
                <button
                  type="button"
                  onClick={() => removePeriod(period.id)}
                  disabled={input.contributionSchedule.length < 2}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-secondary transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-40"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          {errors.contributionSchedule?.[0] ? (
            <p className="mt-2 text-xs text-up">
              {errors.contributionSchedule[0]}
            </p>
          ) : null}
        </div>

        <NumberInput
          id="annualRatePercent"
          label="연 수익률"
          value={input.annualRatePercent}
          onChange={(value) => update("annualRatePercent", value)}
          error={errors.annualRatePercent?.[0]}
          min={-50}
          max={100}
          step={0.01}
          placeholder="예: 5"
          suffix="%"
        />

        <fieldset>
          <legend className="text-sm font-bold text-primary">
            복리 주기
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {frequencyOptions.map((option) => (
              <label
                key={option.value}
                className={`flex h-10 cursor-pointer items-center justify-center rounded-md border text-sm transition ${
                  input.compoundFrequency === option.value
                    ? "border-brand bg-brand text-white"
                    : "border-border text-secondary hover:bg-card-subtle hover:text-primary"
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
      </Card>
    </form>
  );
}
