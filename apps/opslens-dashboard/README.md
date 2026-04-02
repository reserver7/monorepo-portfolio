# OpsLens Dashboard App

운영 로그/이슈/배포 영향 분석을 위한 웹 대시보드입니다.

## 역할

- 운영 현황 대시보드
- 로그 분석 요청/결과 조회
- 이슈 목록/상세/상태 관리
- QA 시나리오 생성 결과 조회
- 배포 영향/리포트 화면 제공

## 로컬 실행

```bash
pnpm --filter @repo/opslens-dashboard dev
```

- URL: <http://localhost:3002>

## 실제 도메인

- 미배포

## 주요 의존성

- `@repo/ui`
- `@repo/react-query`
- `@repo/forms`
- `@repo/theme`
- `@repo/utils`
- `@repo/zustand`
- `recharts`

## 자주 쓰는 명령

```bash
pnpm --filter @repo/opslens-dashboard dev
pnpm --filter @repo/opslens-dashboard build
pnpm --filter @repo/opslens-dashboard lint
pnpm --filter @repo/opslens-dashboard typecheck
```

## 관련 문서

- 루트 모노레포 가이드: [`../../README.md`](../../README.md)
- OpsLens API: [`../opslens-api/README.md`](../opslens-api/README.md)
