import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9.^=-]+$/i, "티커 형식이 올바르지 않습니다."),
  nameKo: z.string().trim().min(1).max(60),
  category: z.enum([
    "us_stock",
    "us_etf",
    "kr_stock",
    "kr_etf",
    "intl_stock",
    "intl_etf",
    "crypto",
  ]),
  reason: z.string().trim().max(500).optional().default(""),
  contact: z.string().trim().max(80).optional().default(""),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { message: "Google Sheets 저장 URL이 아직 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  const payload = {
    ...parsed.data,
    ticker: parsed.data.ticker.toUpperCase(),
    status: "pending",
    submittedAt: new Date().toISOString(),
    source: "asset-backtester",
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "Google Sheets에 요청을 저장하지 못했습니다." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
