# Packages 구조 가이드

## 목적
패키지 경계를 명확히 분리해서 중복 구현과 책임 혼선을 줄입니다.

## 패키지 책임

| 패키지 | 책임 | 포함 대상 | 제외 대상 |
|---|---|---|---|
| `@repo/collab-types` | 앱/서버 간 계약 타입 | DTO, 이벤트 타입, 공용 enum | 런타임 로직, 네트워크 호출 |
| `@repo/http` | 네트워크 통신 표준화 | axios client, 인증 인터셉터, 401 공통 처리, REST/GraphQL 요청 함수 | React 상태 관리, UI 컴포넌트 |
| `@repo/react-query` | 서버 상태 관리 표준화 | QueryClient 생성, React Query 공개 엔트리 | HTTP 구현, 비즈니스 API 함수 |
| `@repo/collab-client` | 브라우저 공용 유틸 | env 파싱, navigation, storage, collab 유틸, 시간 포맷 | HTTP 호출, React Query |
| `@repo/ui` | 공용 UI 컴포넌트/훅 | form/layout/table/overlay/feedback 등 | 도메인 비즈니스 로직 |
| `@repo/icons` | 공용 아이콘 엔트리 | Lucide 아이콘 re-export | 앱 도메인 로직 |

## import 규칙

1. 네트워크 호출은 반드시 `@repo/http` 사용
2. 서버 상태는 `@repo/react-query` 사용
3. 브라우저 유틸은 `@repo/collab-client` 사용
4. 타입 계약은 `@repo/collab-types` 사용
5. 앱 내부에서는 패키지 내부 경로(`src/...`) 직접 import 금지

## 예시

```ts
// API 함수
import { requestJson, graphqlRequest } from "@repo/http";

// Query 훅
import { useQuery, useMutation, useQueryClient } from "@repo/react-query";

// 공통 유틸
import { createSessionStorage, navigateToApp } from "@repo/collab-client";
```
