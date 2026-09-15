## Context

Collab Server의 workflow는 Render API 배포를 요청한 직후 공개 health endpoint를 먼저 호출하고, Render deployment status polling을 나중에 수행합니다. 따라서 정상적인 Render cold start가 health timeout으로 판정될 수 있습니다.

## Goals / Non-Goals

**Goals:**

- Render API 배포에서는 `live` 확인 후 health endpoint를 호출합니다.
- deploy hook처럼 deployment ID를 제공하지 않는 경로도 충분한 retry window를 사용합니다.
- 실패 상태와 readiness 상태를 workflow 로그에서 구분합니다.

**Non-Goals:**

- Collab Server의 HTTP API 또는 `/health` 응답 형식 변경
- Render 서비스 설정과 secret 값 변경
- 새로운 배포 도구 또는 dependency 추가

## Decisions

- 기존 OpsLens Render workflow가 사용하는 `live` polling 패턴을 Collab workflow에 적용합니다. 이미 검증된 저장소 내 패턴을 재사용해 동작 차이를 줄입니다.
- API 배포 status polling을 health check보다 먼저 실행합니다. API 경로는 deployment ID를 알고 있으므로 실제 새 배포가 준비된 뒤 endpoint를 검증할 수 있습니다.
- deploy hook 경로의 endpoint check는 curl retry window를 늘립니다. deploy hook 응답에는 deployment ID가 없을 수 있어 별도 status polling을 할 수 없기 때문입니다.

## Risks / Trade-offs

- [Risk] 배포 workflow가 readiness를 기다리는 시간이 길어질 수 있음 → [Mitigation] 기존 60회 polling 상한과 명시적인 timeout을 유지합니다.
- [Risk] 잘못된 `SERVER_HEALTHCHECK_URL`은 계속 실패함 → [Mitigation] workflow 로그에서 endpoint 검증 단계와 timeout을 명확히 표시합니다.

## Migration Plan

1. workflow 변경을 main에 반영합니다.
2. `collab-vX.Y.Z` 태그로 Collab Server 배포를 실행합니다.
3. Render status가 `live`가 된 뒤 `/health`가 성공하는지 확인합니다.
4. 실패 시 해당 workflow 변경 커밋을 revert합니다.
