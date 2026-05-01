"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const categoryOptions = [
  { value: "us_stock", label: "미국 주식" },
  { value: "us_etf", label: "미국 ETF" },
  { value: "kr_stock", label: "한국 주식" },
  { value: "kr_etf", label: "한국 ETF" },
  { value: "intl_stock", label: "해외 주식/ETF" },
  { value: "crypto", label: "암호화폐" },
];

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function RequestPage() {
  const [ticker, setTicker] = useState("");
  const [nameKo, setNameKo] = useState("");
  const [category, setCategory] = useState(categoryOptions[0].value);
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const response = await fetch("/api/ticker-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, nameKo, category, reason, contact }),
    });
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.message ?? "요청 저장에 실패했습니다.");
      return;
    }

    setStatus("success");
    setMessage("요청이 저장되었습니다. 승인되면 주간 데이터 갱신 때 자동 반영됩니다.");
    setTicker("");
    setNameKo("");
    setReason("");
    setContact("");
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-6 py-4 sm:py-8">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          커뮤니티 종목 요청
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-neutral-950 dark:text-neutral-50">
          원하는 종목을 요청하세요
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          Yahoo Finance 티커를 기준으로 요청을 모읍니다. 관리자가 승인하면
          GitHub Actions가 다음 데이터 갱신 때 종목을 추가합니다.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a1a1a]"
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            티커
          </span>
          <input
            value={ticker}
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
            required
            maxLength={20}
            placeholder="예: AAPL, 005930.KS, BTC-USD"
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-info focus:ring-2 focus:ring-info/30 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            표시 이름
          </span>
          <input
            value={nameKo}
            onChange={(event) => setNameKo(event.target.value)}
            required
            maxLength={60}
            placeholder="예: 애플, 삼성전자, 비트코인"
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-info focus:ring-2 focus:ring-info/30 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            분류
          </span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-info focus:ring-2 focus:ring-info/30 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            요청 이유
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="많이 쓰는 ETF, 국내 인기 종목 등 간단히 적어주세요."
            className="w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-950 outline-none transition focus:border-info focus:ring-2 focus:ring-info/30 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            연락처 또는 닉네임
          </span>
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            maxLength={80}
            placeholder="선택 입력"
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-info focus:ring-2 focus:ring-info/30 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50"
          />
        </label>

        <Button type="submit" disabled={status === "submitting"} className="w-full">
          {status === "submitting" ? "저장 중" : "종목 요청하기"}
        </Button>

        {message ? (
          <p
            className={`text-sm font-medium ${
              status === "error" ? "text-negative" : "text-positive"
            }`}
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
