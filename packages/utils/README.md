# @repo/utils

앱 전역에서 재사용하는 범용/협업 유틸 패키지입니다.

## 영역

- `class`: `cn` 등 className 유틸
- `string`: 문자열 포맷/검색 유틸
- `file`: 파일 다운로드 유틸
- `style`: 스타일 함수 유틸
- `collab`: 협업 도메인 공통 로직
- `runtime`: 브라우저/네트워크 런타임 유틸
- `assert`: 런타임 검증 유틸
- `error`: 에러 메시지 표준화 유틸

## 사용 예시

```ts
import { invariant, toErrorMessage, trimTrailingSlash } from "@repo/utils";

invariant(userId, "userId가 필요합니다.");
const apiBaseUrl = trimTrailingSlash(env.API_URL);
const errorMessage = toErrorMessage(error);
```
