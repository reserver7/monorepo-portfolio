## Purpose

작업 공간 초대 대상자가 자신의 계정으로 초대를 검토하고 수락하거나 거절하도록 하여, 명시적 동의가 있는 경우에만 접근 권한을 부여합니다.

## ADDED Requirements

### Requirement: Invitation status

멤버 초대는 `pending`, `accepted`, `declined` 중 하나의 상태를 SHALL 가지며, 새 초대는 `pending` 상태로 생성되어야 합니다.

#### Scenario: New invitation is pending

- **WHEN** 소유자가 이메일과 역할을 지정해 멤버를 초대한다
- **THEN** API는 `pending` 상태의 멤버를 반환하고 초대 대상자는 아직 작업 공간에 접근할 수 없다

#### Scenario: Legacy member remains accessible

- **WHEN** 기존 저장 데이터의 멤버에 상태 필드가 없다
- **THEN** 시스템은 해당 멤버를 승인된 멤버로 취급한다

### Requirement: Invitation response

인증된 계정은 자신의 이메일과 일치하는 초대만 수락하거나 거절할 수 있어야 하며, 수락 시 지정된 역할의 접근 권한을 얻어야 합니다. 시스템은 이 동작을 SHALL 보장해야 합니다.

#### Scenario: Invitee accepts

- **WHEN** 초대 대상 계정이 자신의 `pending` 초대를 수락한다
- **THEN** 멤버 상태가 `accepted`로 바뀌고 계정 ID가 연결되며 작업 공간에 접근할 수 있다

#### Scenario: Invitee declines

- **WHEN** 초대 대상 계정이 자신의 `pending` 초대를 거절한다
- **THEN** 멤버 상태가 `declined`로 바뀌고 작업 공간 접근 권한은 부여되지 않는다

#### Scenario: Other account cannot respond

- **WHEN** 다른 계정이 초대에 수락 또는 거절 요청을 보낸다
- **THEN** API는 거부 응답을 반환하고 초대 상태를 변경하지 않는다

### Requirement: Invitation user interface

초대 링크는 대상자가 작업 공간으로 바로 진입하기 전에 초대 정보와 수락·거절 동작을 제공해야 합니다. 시스템은 이 화면을 SHALL 제공해야 합니다.

#### Scenario: Invite link displays actions

- **WHEN** 인증된 사용자가 유효한 초대 링크를 연다
- **THEN** 초대 작업 공간 이름과 역할 및 수락·거절 버튼이 표시된다

#### Scenario: Accepted invitation redirects

- **WHEN** 사용자가 초대를 수락한다
- **THEN** 성공 메시지 후 해당 문서 또는 화이트보드로 이동한다
