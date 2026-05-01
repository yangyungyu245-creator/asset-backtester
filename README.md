# asset-backtester

실제 종목 데이터 기반 투자 시뮬레이터. 적립식 복리, 포트폴리오 백테스트, 기간별 적립액 변경 가능.

## Demo

[Vercel 배포 후 추가 예정]

## 주요 기능

- 간단 모드: 예금/적금 복리 계산기
- 고급 모드: 실제 종목 데이터 기반 포트폴리오 백테스트
  - 미국 주식/ETF (S&P 500 시총 상위 + 주요 ETF)
  - 한국 주식/ETF (KOSPI 시총 상위 + 주요 ETF)
  - 일본/중국/유럽 주요 종목
  - 총 300종목 + USD/JPY/EUR 환율
- 기간별 적립액 변경 (라이프스테이지 반영)
- 리밸런싱 (월/분기/연/없음)
- 시작 vs 최종 포트폴리오 비교
- 결과 URL 공유

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zustand (상태 관리)
- Recharts (차트)
- Fuse.js (종목 검색)
- Python + yfinance (데이터 수집)

## 데이터 출처

주가/배당 데이터: Yahoo Finance (yfinance 라이브러리)

## 개발 환경 설정

```bash
npm install --ignore-scripts
npm run dev
```

## 데이터 갱신

```bash
cd scripts
pip install -r requirements.txt
python fetch_data.py --stage pilot     # 10종목
python fetch_data.py --stage expanded  # 100종목
python fetch_data.py --stage full      # 300종목
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

빌드 캐시 꼬임. 다음 명령으로 해결:

```bash
npm run clean
npm run dev
```

## 면책 조항

본 시뮬레이터의 결과는 과거 데이터 기반의 추정이며, 실제 투자 결과를 보장하지 않습니다.

## Credits

Made by [WHY_N.ART](https://whyn.art) x asset-backtester
