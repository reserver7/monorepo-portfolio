## Context

알림 API와 계정별 저장소는 이미 존재하며, Socket.IO 연결은 문서·화이트보드 room을 사용합니다.

## Goals / Non-Goals

**Goals:**

- 계정 전용 notification room을 추가한다.
- 멤버십 이벤트 성공 시 대상 계정 room에 갱신 이벤트를 보낸다.
- 읽음 일괄 처리 API와 UI를 추가한다.

**Non-Goals:**

- 브라우저 푸시 알림이나 이메일 재발송은 추가하지 않는다.

## Decisions

- `notifications:subscribe` 이벤트가 realtime account token을 검증하고 `account:<id>` room에 참가시킨다.
- 알림이 생성된 계정에는 `notifications:update` 이벤트를 보낸다.
- `PATCH /api/notifications/read-all`은 인증 계정의 알림만 갱신한다.

## Risks / Trade-offs

- 여러 서버 환경에서는 기존 Socket.IO adapter가 room fan-out을 담당한다.
