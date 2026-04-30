# 투자 시뮬레이터

과거 시세 데이터 기반 투자 시나리오 백테스트 웹사이트입니다.

## 개발 환경

- Next.js 14 App Router
- TypeScript strict mode
- Tailwind CSS
- Recharts
- Fuse.js
- Zustand
- Zod

## 실행

```bash
npm install
npm run dev
```

캐시를 비우고 새로 시작하려면:

```bash
npm run dev:fresh
```

## 빌드

```bash
npm run typecheck
npm run lint
npm run build
```

캐시를 비우고 빌드하려면:

```bash
npm run build:fresh
```

## 트러블슈팅

### "Cannot find module './XXX.js'" 에러

Next.js 빌드 캐시가 꼬인 경우가 많습니다. 다음 명령으로 정리 후 다시 실행하세요.

```bash
npm run clean
npm run dev
```
