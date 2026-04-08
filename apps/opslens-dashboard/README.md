# OpsLens Dashboard App

운영 분석 대시보드 앱입니다.

## 역할

- 운영 현황 대시보드
- 로그 분석 요청/결과 조회
- 이슈 목록/상세/상태 관리
- QA 시나리오 조회
- 리포트/배포 영향 화면

## 실행

```bash
pnpm --filter @repo/opslens-dashboard dev
pnpm --filter @repo/opslens-dashboard build
pnpm --filter @repo/opslens-dashboard lint
pnpm --filter @repo/opslens-dashboard typecheck
```

- Local: <http://localhost:3002>
- Domain: 미배포

## 의존성

- `@repo/ui`, `@repo/theme`, `@repo/forms`, `@repo/react-query`, `@repo/utils`, `@repo/zustand`, `recharts`

## 관련 문서

- API: [`../opslens-api/README.md`](../opslens-api/README.md)
- 루트: [`../../README.md`](../../README.md)
