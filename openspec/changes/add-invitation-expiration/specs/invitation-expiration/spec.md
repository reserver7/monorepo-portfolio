## Purpose

작업 공간 초대가 일정 기간 후 자동으로 만료되도록 하여 오래된 초대 링크와 접근 요청을 제한합니다.

## ADDED Requirements

### Requirement: Invitation expiration

pending 초대는 생성 또는 재전송 후 7일 동안만 유효해야 하며, 시스템은 만료된 초대의 접근과 수락을 SHALL 차단해야 합니다.

#### Scenario: Expired invitation is blocked

- **WHEN** pending 초대의 만료 시각이 현재 시각보다 이전이다
- **THEN** 초대 대상자는 작업 공간에 접근하거나 초대를 수락할 수 없다

#### Scenario: Resend renews expiration

- **WHEN** 소유자가 만료 전 또는 만료된 pending 초대를 재전송한다
- **THEN** 초대 만료 시각이 재전송 시점부터 7일 뒤로 갱신된다

#### Scenario: Active invitation remains usable

- **WHEN** pending 초대가 아직 만료되지 않았다
- **THEN** 초대 대상자는 수락 화면에서 초대를 수락할 수 있다
