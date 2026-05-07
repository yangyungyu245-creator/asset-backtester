"use client";

import { createClient } from "@/lib/supabase/client";
import type { Portfolio, PortfolioHolding } from "@/lib/types/portfolio";

function normalizeHolding(row: PortfolioHolding): PortfolioHolding {
  return {
    ...row,
    shares: Number(row.shares) || 0,
    avg_price: Number(row.avg_price) || 0,
  };
}

export async function getPortfolios(): Promise<Portfolio[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Portfolio[];
}

export async function createPortfolio(
  name: string,
  description?: string,
): Promise<Portfolio> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다");

  const { data, error } = await supabase
    .from("portfolios")
    .insert({ user_id: user.id, name, description: description || null })
    .select()
    .single();

  if (error) throw error;
  return data as Portfolio;
}

export async function deletePortfolio(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("portfolios").delete().eq("id", id);

  if (error) throw error;
}

export async function updatePortfolio(
  id: string,
  name: string,
  description?: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("portfolios")
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function getHoldings(portfolioId: string): Promise<PortfolioHolding[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as PortfolioHolding[]).map(normalizeHolding);
}

export async function upsertHolding(
  portfolioId: string,
  symbol: string,
  shares: number,
  avgPrice: number,
  currency = "USD",
): Promise<void> {
  const supabase = createClient();
  const cleanSymbol = symbol.trim().toUpperCase();
  const { error } = await supabase.from("portfolio_holdings").upsert(
    {
      portfolio_id: portfolioId,
      symbol: cleanSymbol,
      shares,
      avg_price: avgPrice,
      currency,
    },
    { onConflict: "portfolio_id,symbol" },
  );

  if (error) throw error;

  await supabase
    .from("portfolios")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", portfolioId);
}

export async function deleteHolding(holdingId: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase
    .from("portfolio_holdings")
    .select("portfolio_id")
    .eq("id", holdingId)
    .maybeSingle();
  const { error } = await supabase.from("portfolio_holdings").delete().eq("id", holdingId);

  if (error) throw error;

  if (data?.portfolio_id) {
    await supabase
      .from("portfolios")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.portfolio_id);
  }
}
