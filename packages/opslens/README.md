# @repo/opslens

OpsLens 도메인 공통 패키지입니다.

## 제공 기능

- OpsLens GraphQL API 호출 함수
- OpsLens 쿼리키(`opslensQueryKeys`)
- OpsLens 도메인 타입(`Issue`, `DashboardSummary` 등)
- 필터 변환 유틸(`toOptionalServiceName` 등)

## 사용법

```ts
import { configureOpslensClient, getDashboardSummary, opslensQueryKeys } from "@repo/opslens";

configureOpslensClient({ apiUrl: "https://api.example.com/graphql" });

const data = await getDashboardSummary({
  environment: "prod",
  serviceName: "docs",
  query: "timeout"
});
```

## 점검

```bash
pnpm --filter @repo/opslens lint
pnpm --filter @repo/opslens typecheck
```
