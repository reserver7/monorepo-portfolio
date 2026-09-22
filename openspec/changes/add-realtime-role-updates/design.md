## Context

역할 변경 API는 이미 저장소와 문서·화이트보드 HTTP 라우트에 존재하고, Socket.IO 참가자는 서버 메모리의 participant 맵으로 관리됩니다.

## Goals / Non-Goals

**Goals:**

- 연결된 참가자의 역할과 서버 쓰기 권한을 즉시 갱신한다.
- 문서와 화이트보드 클라이언트가 동일한 이벤트를 처리한다.

**Non-Goals:**

- 소켓 재연결 정책이나 새로운 권한 종류는 변경하지 않는다.

## Decisions

- `permission:update` 이벤트를 추가하고 `scope`, `currentRole`을 전달한다.
- 역할 변경 시 해당 멤버의 연결 소켓만 찾아 participant와 role lock을 갱신한다.
- 클라이언트는 이벤트 수신 즉시 로컬 역할 상태를 갱신한다.

## Risks / Trade-offs

- 다중 서버 환경에서는 참가자 조회가 현재 프로세스 범위다. → 기존 Redis 실시간 어댑터 확장 시 소켓 이벤트 fan-out을 추가한다.
