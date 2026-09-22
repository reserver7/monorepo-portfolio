## Context

문서와 화이트보드 레코드는 이미 멤버 정보를 함께 저장하며, 모든 멤버 변경은 RealtimeStore를 거칩니다.

## Goals / Non-Goals

**Goals:**

- 두 작업 공간 종류에 동일한 활동 로그 모델을 사용한다.
- 로그는 최신 50개만 유지하고 조회는 소유자에게 제한한다.

**Non-Goals:**

- 문서 편집 history와 통합하지 않는다.
- 검색, 필터, 외부 알림은 추가하지 않는다.

## Decisions

- `WorkspaceActivity`에 action, memberEmail, actorId, at을 저장한다.
- `GET /api/documents/:id/activity`와 `GET /api/boards/:id/activity`를 제공한다.
- 초대·응답·역할 변경·제거 저장소 메서드가 성공 시 로그를 남긴다.
- 공유 패널에서 최근 10개를 간단한 텍스트 목록으로 표시한다.

## Risks / Trade-offs

- 기존 persisted 레코드에는 로그가 없다. → optional 필드로 읽고 새 이벤트부터 기록한다.
