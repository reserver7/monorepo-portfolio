# @repo/http

## 책임
- axios 기반 HTTP 클라이언트 표준화
- 인증 토큰 인터셉터(`Authorization: Bearer ...`)
- `401 Unauthorized` 공통 이벤트 처리
- REST/GraphQL 요청 유틸 제공

## 공개 API
- `requestJson`
- `graphqlRequest`
- `configureHttpAuth`
- `setHttpAccessToken`
- `resolveHttpAccessToken`
- `subscribeHttpUnauthorized`

## 사용 예시

```ts
import { configureHttpAuth, requestJson } from "@repo/http";

configureHttpAuth({
  getAccessToken: () => localStorage.getItem("app.accessToken")
});

const data = await requestJson<{ ok: boolean }>("https://api.example.com", "/health");
```
