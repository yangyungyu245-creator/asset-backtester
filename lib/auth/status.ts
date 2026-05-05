export function isAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export const authUnavailableMessage =
  "로그인 기능은 아직 연결 중입니다. 기본 시뮬레이션은 그대로 사용 가능합니다.";
