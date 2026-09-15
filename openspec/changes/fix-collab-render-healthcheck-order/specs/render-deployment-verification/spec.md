## Purpose

Render 기반 서버 배포가 새 인스턴스의 기동 지연 때문에 오탐으로 실패하지 않도록, 배포 완료와 공개 health endpoint 검증을 안정적으로 연결합니다.

## ADDED Requirements

### Requirement: Render deployment verification waits for readiness

The deployment workflow SHALL verify an API-triggered Render deployment reaches `live` before checking the public health endpoint.

#### Scenario: API deployment becomes live

- **WHEN** the Render API accepts a deployment for the release commit
- **THEN** the workflow SHALL poll deployment status until `live` or a terminal failure state before endpoint verification

#### Scenario: Render deployment fails

- **WHEN** Render reports `build_failed`, `update_failed`, `canceled`, or `deactivated`
- **THEN** the workflow SHALL fail without reporting the release as healthy

### Requirement: Public health verification tolerates cold start

The deployment workflow SHALL retry the configured public health endpoint for the service startup window and SHALL succeed only on a 2xx or 3xx response.

#### Scenario: Service starts within the retry window

- **WHEN** the public `/health` endpoint initially times out or is unavailable
- **THEN** the workflow SHALL retry without failing until the configured retry window is exhausted

#### Scenario: Service remains unavailable

- **WHEN** the endpoint does not return a successful HTTP response within the retry window
- **THEN** the workflow SHALL fail and expose the health verification failure in the workflow logs
