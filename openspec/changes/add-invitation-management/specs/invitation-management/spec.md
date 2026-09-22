## Purpose

소유자가 아직 응답하지 않은 작업 공간 초대를 공유 화면에서 취소하거나 다시 발송할 수 있게 합니다.

## ADDED Requirements

### Requirement: Pending invitation management

소유자는 pending 초대를 재전송하거나 취소할 수 있어야 하며, accepted 멤버의 권한 동작은 변경되지 않아야 합니다. 시스템은 이를 SHALL 제공해야 합니다.

#### Scenario: Resend pending invitation

- **WHEN** 소유자가 pending 초대의 재전송을 선택한다
- **THEN** 기존 역할과 이메일을 유지한 초대 이메일이 다시 발송된다

#### Scenario: Cancel pending invitation

- **WHEN** 소유자가 pending 초대의 취소를 선택한다
- **THEN** 해당 멤버가 제거되고 초대 대상자는 작업 공간에 접근할 수 없다

#### Scenario: Accepted member remains manageable

- **WHEN** 멤버가 accepted 상태다
- **THEN** 기존 멤버 제거 동작을 사용하고 재전송 버튼은 표시하지 않는다
