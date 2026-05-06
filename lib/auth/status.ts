export function isAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export const authUnavailableMessage =
  "Supabase 환경 변수가 아직 설정되지 않았습니다. 기본 시뮬레이션은 그대로 사용 가능합니다.";
