## Why

Collab Server의 Render 배포 요청은 성공했지만, 새 인스턴스가 `live` 상태가 되기 전에 공개 `/health`를 확인해 배포 workflow가 timeout되고 있습니다. 배포 완료 확인과 endpoint 검증 순서를 바로잡아 정상적인 cold start를 허용해야 합니다.

## What Changes

- Render API 배포를 사용하는 Collab Server workflow가 배포 상태를 먼저 `live`까지 확인하도록 순서를 변경합니다.
- Render deploy hook 경로의 공개 health check에 충분한 재시도 시간을 적용합니다.
- 배포 workflow의 성공 조건을 실제 배포 완료와 `/health` 2xx 응답으로 명확히 합니다.

## Capabilities

### New Capabilities

- `render-deployment-verification`: Render 배포 완료 후 공개 health endpoint를 검증하는 배포 안정성 규칙

### Modified Capabilities

- 없음

## Impact

- `.github/workflows/cd-server-render.yml`
- Collab Server Render 배포 시간 및 health check 동작
- 애플리케이션 API 자체와 public API 계약에는 변경 없음
