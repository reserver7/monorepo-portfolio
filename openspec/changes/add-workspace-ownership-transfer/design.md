## Context

작업 공간 레코드는 ownerId를 저장하고, accepted 멤버는 accountId·email·role로 관리됩니다.

## Goals / Non-Goals

**Goals:**

- 문서와 화이트보드의 소유권을 동일한 저장소·API 흐름으로 이전한다.
- 기존 소유자가 이후 탈퇴할 수 있도록 editor 멤버 레코드를 만든다.

**Non-Goals:**

- 다중 소유자나 소유권 이전 승인 절차는 추가하지 않는다.

## Decisions

- `POST /api/documents/:id/members/transfer-ownership` 및 board 동등 API를 사용한다.
- 요청 본문은 대상 멤버 이메일을 받으며 accepted이고 accountId가 있는 멤버만 허용한다.
- 기존 소유자 이메일은 인증 계정 이메일로 editor 멤버에 저장한다.
- 활동 action은 `ownership-transferred`로 기록하고 연결된 두 계정의 역할을 editor로 갱신한다.

## Risks / Trade-offs

- 기존 레거시 owner에는 이메일이 없을 수 있다. → API 인증 계정 이메일을 새 editor 레코드에 사용한다.
