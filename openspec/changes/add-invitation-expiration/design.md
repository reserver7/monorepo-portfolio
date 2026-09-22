## Context

멤버 레코드는 문서·화이트보드에 함께 저장되며 pending 상태와 수락 API가 이미 존재합니다.

## Goals / Non-Goals

**Goals:**

- pending 초대에 고정된 7일 TTL을 적용한다.
- HTTP, WebSocket, 수락 API가 동일하게 만료 초대를 거부한다.

**Non-Goals:**

- 별도 백그라운드 만료 작업이나 데이터 정리는 추가하지 않는다.

## Decisions

- `expiresAt` ISO 시각을 멤버에 저장하고 요청 시 현재 시각과 비교한다.
- accepted·declined 멤버에는 만료 시각을 적용하지 않는다.
- 재전송은 기존 upsert 경로에서 pending 초대의 `expiresAt`을 갱신한다.

## Risks / Trade-offs

- 서버 시계에 의존한다. → 모든 비교는 ISO UTC 시각으로 처리한다.
