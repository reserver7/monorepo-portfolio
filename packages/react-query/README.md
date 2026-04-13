# @repo/react-query

실서비스 기준 React Query 공통 패키지입니다.

## 제공 기능

- QueryClient 기본 정책 (`retry`, `retryDelay`, `refetchOnReconnect`)
- HTTP 요청 유틸 (`requestJson`, `createResourceClient`)
- 쿼리 키 팩토리 (`createQueryKeys`)
- 무효화 헬퍼 (`invalidateQueryKeys`, `invalidateFromFactory`)
- 무한 조회 훅 (`useInfiniteResourceQuery`)

## 빠른 사용 예시

```ts
import { createQueryKeys, invalidateQueryKeys } from "@repo/react-query";

const userKeys = createQueryKeys("users");

// list: ["users", "list"]
userKeys.lists();

// detail: ["users", "detail", "u1"]
userKeys.detail("u1");

await invalidateQueryKeys(queryClient, [userKeys.lists()]);
```

## 무한 조회 예시

```ts
const query = useInfiniteResourceQuery({
  queryKey: ["logs", "list"],
  queryFn: async ({ cursor, signal }) => fetchLogs({ cursor, signal }),
  initialCursor: null
});
```
