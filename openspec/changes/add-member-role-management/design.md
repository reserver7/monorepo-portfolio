## Context

문서와 화이트보드는 이미 소유자 전용 멤버 초대·삭제 API와 공유 패널을 함께 사용합니다.

## Goals / Non-Goals

**Goals:**

- 기존 멤버 저장소에 역할 변경 경로를 추가한다.
- 문서·화이트보드에서 동일한 동작과 권한 검증을 사용한다.

**Non-Goals:**

- 새로운 역할 종류나 역할별 세부 권한은 추가하지 않는다.
- pending 초대의 역할 변경 UI는 추가하지 않는다.

## Decisions

- `PATCH /api/documents/:id/members` 및 `PATCH /api/boards/:id/members`를 사용한다.
- 요청 본문은 대상 `email`과 새 `role`을 받는다.
- 저장소가 멤버 상태와 역할을 함께 검증하며, accepted 멤버만 변경한다.
- 공유 패널은 accepted 멤버에 select를 표시하고 변경 성공 후 목록을 다시 불러온다.

## Risks / Trade-offs

- 이메일을 멤버 식별자로 사용한다. → 기존 멤버 관리 API와 동일한 식별 방식을 유지한다.
