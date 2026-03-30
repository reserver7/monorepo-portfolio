# @repo/react-query

## 책임
- React Query 공통 엔트리 제공
- QueryClient 생성 정책 공통화

## 공개 API
- `createAppQueryClient`
- `@tanstack/react-query` re-export (`useQuery`, `useMutation`, `useQueryClient` 등)

## 원칙
- 네트워크 호출은 `@repo/http`에서 수행
- 서버 상태 관리는 `@repo/react-query`에서 수행
