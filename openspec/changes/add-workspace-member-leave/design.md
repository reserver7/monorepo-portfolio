## Context

멤버 제거는 현재 소유자 전용 API와 RealtimeStore에 구현되어 있고, 활동 로그와 연결 세션 관리도 존재합니다.

## Goals / Non-Goals

**Goals:**

- 계정이 자신의 accepted 멤버 레코드만 삭제하게 한다.
- 문서·화이트보드에 동일한 탈퇴 API와 세션 철회를 적용한다.

**Non-Goals:**

- 소유권 이전이나 탈퇴 후 데이터 복구는 추가하지 않는다.

## Decisions

- `DELETE /api/documents/:id/members/self` 및 board 동등 API를 사용한다.
- 저장소는 accountId 우선, 이메일 보조로 본인 멤버를 찾는다.
- 활동 action은 `left`로 기록한다.
- 연결된 세션에는 `workspace:access-revoked` 이벤트를 보내고 소켓을 종료한다.

## Risks / Trade-offs

- 소켓 종료는 일시적인 네트워크 지연 중에도 클라이언트가 탈퇴를 인지하도록 명시 이벤트를 먼저 보낸다.
