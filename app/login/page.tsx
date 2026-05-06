import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginContent } from "./LoginContent";

export const metadata: Metadata = {
  title: "로그인",
  description: "FIRE LIFE 관심종목과 시뮬레이션 설정을 저장합니다.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
