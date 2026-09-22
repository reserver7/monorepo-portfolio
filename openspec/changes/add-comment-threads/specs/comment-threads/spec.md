## ADDED Requirements

### Requirement: Comment threads

문서 사용자는 기존 댓글에 답글을 작성하고 실시간으로 확인할 수 있어야 합니다. The implementation MUST preserve existing comment permissions and mention behavior.

#### Scenario: Reply to a comment

- **WHEN** 사용자가 댓글의 답글을 작성한다
- **THEN** 답글은 부모 댓글 ID와 함께 저장되고 댓글 목록에 중첩되어 표시된다

#### Scenario: Realtime reply

- **WHEN** 다른 사용자가 답글을 작성한다
- **THEN** 현재 문서에 연결된 사용자에게 답글이 실시간으로 전달된다

#### Scenario: Reply notification

- **WHEN** 다른 사용자가 내 댓글에 답글을 작성한다
- **THEN** 원댓글 작성자에게 답글 위치를 가리키는 읽지 않은 알림이 생성된다
