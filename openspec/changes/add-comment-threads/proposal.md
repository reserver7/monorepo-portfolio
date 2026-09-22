## Why

댓글이 평면 목록으로만 표시되어 특정 의견에 답변하기 어렵습니다.

## What Changes

- 댓글에 부모 댓글 ID를 저장합니다.
- 댓글 패널에서 답글을 작성할 수 있게 합니다.
- 답글을 기존 Socket.IO 댓글 동기화와 멘션 알림 흐름에 포함합니다.

## Capabilities

### New Capabilities

- `comment-threads`: 문서 댓글 답글

## Impact

- 공용 댓글 타입과 댓글 저장소
- 문서 댓글 Socket.IO payload
- 댓글 패널 UI
