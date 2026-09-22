## Context

활동 로그 저장·조회 API와 문서·화이트보드 Socket.IO room은 이미 존재합니다.

## Decisions

- `activity:update` 이벤트는 문서 또는 화이트보드 room에만 전송합니다.
- 이벤트 payload에는 scope와 entityId를 포함해 잘못된 패널 갱신을 방지합니다.
- 패널은 이벤트를 받으면 기존 활동 API를 다시 호출하며, 활동 데이터 자체를 socket payload로 복제하지 않습니다.

## Non-Goals

- 활동 로그 저장 구조 변경
- 브라우저 푸시 알림
