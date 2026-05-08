import type { TickerRequest } from "@/components/request/types";

export type RequestLoadResult = {
  requests: TickerRequest[];
  csvConfigured: boolean;
};

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

function parseCsvRows(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map(parseCsvLine);
}

function normalizeStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized || "pending";
}

function toTimestamp(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getRequestCsvUrl() {
  return (
    process.env.NEXT_PUBLIC_REQUEST_CSV_URL?.trim() ||
    process.env.GOOGLE_SHEETS_REQUEST_CSV_URL?.trim() ||
    ""
  );
}

export async function loadTickerRequests(): Promise<RequestLoadResult> {
  const csvUrl = getRequestCsvUrl();

  if (!csvUrl) {
    return { requests: [], csvConfigured: false };
  }

  try {
    const response = await fetch(csvUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rows = parseCsvRows(await response.text());
    const requests = rows
      .map((cells, index): TickerRequest => {
        const submittedAt = cells[0]?.trim() ?? "";
        const ticker = (cells[1]?.trim() ?? "").toUpperCase();

        return {
          id: `${submittedAt}-${ticker}-${index}`,
          submittedAt,
          ticker,
          nameKo: cells[2]?.trim() ?? "",
          category: cells[3]?.trim() ?? "",
          reason: cells[4]?.trim() ?? "",
          status: normalizeStatus(cells[6] ?? ""),
          comment: cells.slice(7).join(",").trim(),
        };
      })
      .filter((request) => request.ticker)
      .sort((a, b) => toTimestamp(b.submittedAt) - toTimestamp(a.submittedAt));

    return { requests, csvConfigured: true };
  } catch (error) {
    console.error("[request board] failed to load CSV", error);
    return { requests: [], csvConfigured: true };
  }
}
