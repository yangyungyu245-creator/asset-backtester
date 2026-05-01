import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const webhookEnvNames = [
  "GOOGLE_SHEETS_WEBHOOK_URL",
  "SHEETS_WEBHOOK_URL",
  "GOOGLE_APPS_SCRIPT_WEBHOOK_URL",
  "NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL",
] as const;

function normalizeWebhookUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^['"]|['"]$/g, "");
}

function getWebhookUrl() {
  for (const name of webhookEnvNames) {
    const url = normalizeWebhookUrl(process.env[name]);

    if (url) {
      return url;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 },
    );
  }

  const webhookUrl = getWebhookUrl();

  if (!webhookUrl) {
    return NextResponse.json(
      {
        message:
          "Google Sheets 저장 URL이 아직 설정되지 않았습니다. Vercel 환경변수 GOOGLE_SHEETS_WEBHOOK_URL을 확인해 주세요.",
      },
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
