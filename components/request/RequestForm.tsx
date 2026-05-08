"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { TickerRequest } from "@/components/request/types";

const categoryOptions = [
  { value: "us_stock", label: "미국 주식" },
  { value: "us_etf", label: "미국 ETF" },
  { value: "kr_stock", label: "한국 주식" },
  { value: "kr_etf", label: "한국 ETF" },
  { value: "crypto", label: "암호화폐" },
];

const fieldClassName =
  "w-full rounded-md border border-border bg-card px-3 text-sm text-primary outline-none transition placeholder:text-secondary focus:ring-2 focus:ring-brand/30";

type SubmitState = "idle" | "submitting" | "success" | "error";

type RequestFormProps = {
  initialTicker?: string;
  onSuccess?: (request: TickerRequest) => void;
};

function translateStatusMessage(message: string) {
  const normalized = message.toLowerCase().trim();

  if (normalized.includes("already exists")) return "이미 등록된 종목입니다.";
  if (normalized.includes("added") || normalized.includes("success")) return "종목이 추가되었습니다.";
  if (normalized.includes("invalid")) return "유효하지 않은 종목 코드입니다.";
  if (normalized.includes("not found")) return "종목을 찾을 수 없습니다.";
  if (normalized.includes("processing")) return "처리 중입니다.";
  return message;
}

export function RequestForm({ initialTicker = "", onSuccess }: RequestFormProps) {
  const [ticker, setTicker] = useState(initialTicker.toUpperCase());
  const [nameKo, setNameKo] = useState("");
  const [category, setCategory] = useState(categoryOptions[0].value);
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setTicker(initialTicker.toUpperCase());
  }, [initialTicker]);

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
      setMessage(translateStatusMessage(payload?.message ?? "요청 저장에 실패했습니다."));
      return;
    }

    const submittedAt = new Date().toISOString();
    const submittedRequest: TickerRequest = {
      id: `optimistic-${submittedAt}-${ticker}`,
      submittedAt,
      ticker: ticker.toUpperCase(),
      nameKo,
      category,
      reason,
      status: "pending",
      comment: "",
    };

    setStatus("success");
    setMessage("요청이 저장되었습니다. 승인되면 주간 데이터 갱신 때 자동 반영됩니다.");
    setTicker("");
    setNameKo("");
    setReason("");
    setContact("");
    onSuccess?.(submittedRequest);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-primary">티커</span>
        <input
          value={ticker}
          onChange={(event) => setTicker(event.target.value.toUpperCase())}
          required
          maxLength={20}
          placeholder="예: AAPL, 005930.KS, BTC-USD"
          className={`${fieldClassName} h-11`}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-primary">표시 이름</span>
        <input
          value={nameKo}
          onChange={(event) => setNameKo(event.target.value)}
          required
          maxLength={60}
          placeholder="예: 애플, 삼성전자, 비트코인"
          className={`${fieldClassName} h-11`}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-primary">분류</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={`${fieldClassName} h-11`}
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-primary">요청 이유</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder="많이 쓰는 ETF, 국내 인기 종목 등 간단히 적어주세요."
          className={`${fieldClassName} resize-y py-3`}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-primary">연락처 또는 닉네임</span>
        <input
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          maxLength={80}
          placeholder="선택 입력"
          className={`${fieldClassName} h-11`}
        />
      </label>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "저장 중" : "종목 요청하기"}
      </Button>

      {message ? (
        <p
          className={`text-sm font-medium ${
            status === "error" ? "text-up" : "text-brand"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
