import { RequestBoard } from "@/components/request/RequestBoard";
import type { TickerRequest } from "@/components/request/types";

export const revalidate = 300;

type RequestPageProps = {
  searchParams?: {
    ticker?: string;
  };
};

function getCell(row: Record<string, string>, index: number, ...names: string[]) {
  const lowered = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value.trim()]),
  );

  for (const name of names) {
    const value = lowered[name.toLowerCase()];
    if (value) {
      return value;
    }
  }

  return Object.values(row)[index]?.trim() ?? "";
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current);
  return cells;
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function toTimestamp(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

async function loadRequests() {
  const csvUrl =
    process.env.NEXT_PUBLIC_REQUEST_CSV_URL?.trim() ||
    process.env.GOOGLE_SHEETS_REQUEST_CSV_URL?.trim() ||
    "";

  if (!csvUrl) {
    return { requests: [] as TickerRequest[], csvConfigured: false };
  }

  try {
    const response = await fetch(csvUrl, { next: { revalidate } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rows = parseCsv(await response.text());
    const requests = rows
      .map((row, index): TickerRequest => {
        const submittedAt = getCell(row, 0, "timestamp", "submittedAt", "제출일", "날짜");
        const ticker = getCell(row, 1, "ticker", "티커", "symbol").toUpperCase();

        return {
          id: `${submittedAt}-${ticker}-${index}`,
          submittedAt,
          ticker,
          nameKo: getCell(row, 2, "name_ko", "nameKo", "표시 이름", "name"),
          category: getCell(row, 3, "category", "분류"),
          reason: getCell(row, 4, "reason", "요청 이유"),
          status: getCell(row, 6, "status", "상태") || "pending",
          comment: getCell(row, 7, "comment", "처리 코멘트", "답변"),
        };
      })
      .filter((request) => request.ticker)
      .sort((a, b) => toTimestamp(b.submittedAt) - toTimestamp(a.submittedAt));

    return { requests, csvConfigured: true };
  } catch (error) {
    console.error("[request board] failed to load CSV", error);
    return { requests: [] as TickerRequest[], csvConfigured: true };
  }
}

export default async function RequestPage({ searchParams }: RequestPageProps) {
  const { requests, csvConfigured } = await loadRequests();
  const initialTicker = searchParams?.ticker?.trim() ?? "";

  return (
    <section className="mx-auto grid max-w-5xl gap-6 py-4 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            커뮤니티 종목 요청
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-neutral-950 dark:text-neutral-50">
            종목 요청
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            원하는 종목이 사이트에 없나요? 미국, 한국, 암호화폐 종목을 Yahoo Finance
            데이터 기준으로 검증하고 매주 일요일 자동 처리합니다.
          </p>
        </div>
        <div className="grid gap-1 text-sm text-neutral-600 dark:text-neutral-400">
          <p>지원: 미국 / 한국 / 암호화폐</p>
          <p>검증: Yahoo Finance 데이터 기준</p>
          <p>처리: 매주 일요일 18:00 UTC</p>
        </div>
      </div>

      <RequestBoard
        requests={requests}
        initialTicker={initialTicker}
        csvConfigured={csvConfigured}
      />
    </section>
  );
}
