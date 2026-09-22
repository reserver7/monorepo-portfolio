## Context

멤버 관리 이벤트와 작업 공간 활동 로그는 RealtimeStore를 통해 저장되며, 인증 계정 ID를 사용할 수 있는 이벤트가 있습니다.

## Goals / Non-Goals

**Goals:**

- 확정 계정 대상 멤버십 변경 알림을 저장한다.
- 전역 API와 간단한 웹 알림 센터를 제공한다.

**Non-Goals:**

- pending 이메일 초대 알림을 중복 발송하지 않는다.
- 푸시 알림이나 별도 알림 서비스는 추가하지 않는다.

## Decisions

- 알림은 문서·화이트보드 레코드에 optional 배열로 저장한다.
- `GET /api/notifications`로 최근 50개와 unreadCount를 반환한다.
- `PATCH /api/notifications/:id/read`로 본인 알림만 읽음 처리한다.
- 전역 레이아웃에 최근 알림과 읽지 않은 수를 표시한다.

## Risks / Trade-offs

- 계정 확정 전 초대는 알림 대상 ID가 없다. → 기존 이메일 초대만 사용한다.
