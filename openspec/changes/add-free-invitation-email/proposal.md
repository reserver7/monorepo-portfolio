## Why

공유 멤버를 등록해도 초대 대상에게 알림이 없어 사용자가 직접 링크를 전달해야 합니다. 무료 사용을 유지하면서 초대 사실을 알려야 하므로, 결제가 발생하지 않는 보수적인 이메일 발송 경계를 추가합니다.

## What Changes

- Resend 기반 초대 이메일 발송을 추가합니다.
- 발송 기능은 기본적으로 비활성화합니다.
- 활성화해도 무료 한도인 월 3,000통을 넘으면 발송하지 않습니다.
- API 키·발신 주소가 없으면 외부 API를 호출하지 않습니다.
- 이메일 발송 실패가 멤버 등록 자체를 실패시키지 않게 합니다.

## Capabilities

### New Capabilities

- `free-invitation-email`: 무료 한도 내 작업 공간 초대 이메일 발송

### Modified Capabilities

- `workspace-sharing`: 멤버 초대 시 이메일 알림을 선택적으로 발송

## Impact

- Collab 서버 환경 변수와 멤버 초대 API
- Resend HTTP API 호출
- Render 환경 설정은 기본 비활성 상태를 유지
