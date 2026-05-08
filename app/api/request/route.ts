import { NextResponse } from "next/server";
import { loadTickerRequests } from "@/lib/request/requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { requests, csvConfigured } = await loadTickerRequests();

  return NextResponse.json(
    {
      requests,
      csvConfigured,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );
}
