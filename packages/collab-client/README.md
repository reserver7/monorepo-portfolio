# @repo/collab-client

## 책임
- 브라우저 공용 유틸 제공
- 문서/화이트보드 등 다중 앱에서 재사용되는 클라이언트 로직 공통화

## 포함 범위
- `config`: env 파싱
- `navigation`: 앱 간 이동 유틸
- `collab`: 역할/문구/이벤트 로그 유틸
- `storage`: local/session storage 유틸
- `time`: 시간 포맷 유틸

## 제외 범위
- HTTP 호출 (`@repo/http` 사용)
- 서버 상태 관리 (`@repo/react-query` 사용)
