import type { Metadata } from "next";
import { PortfolioManager } from "@/components/portfolio/PortfolioManager";

export const metadata: Metadata = {
  title: "포트폴리오",
  description: "내 보유 포트폴리오와 예상 배당금을 관리합니다.",
};

export default function PortfolioPage() {
  return <PortfolioManager />;
}
