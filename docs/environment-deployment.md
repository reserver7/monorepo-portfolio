# 환경 및 배포 설정

## 로컬 개발

`pnpm infra:up`으로 Docker Compose의 PostgreSQL(`5433`)과 Redis(`6379`)를 시작합니다.

| 앱 | 필수 변수 |
| --- | --- |
| Collab Server | `STATE_BACKEND=postgres`, `COLLAB_DATABASE_URL`, `REDIS_URL`, `COLLAB_SESSION_SECRET`, `CORS_ORIGINS` |
| OpsLens Server | `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_JWT_SECRET`, `AUTH_BRIDGE_SECRET`, `OPS_INGESTION_KEY`, `CORS_ORIGINS` |
| Collab Web | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` |
| OpsLens Web | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `OPSLENS_AUTH_BRIDGE_SECRET` |

앱별 `.env.example`은 로컬 Docker 기본 연결값을 포함합니다. OpsLens Server는 `.env.local`을 `.env`보다 먼저 읽어 Docker DB 연결값만 분리할 수 있습니다. 실제 `.env` 및 `.env.local` 파일은 Git에 포함하지 않습니다.

## 운영 배포

웹 앱은 Vercel, Node 서버는 Render, 데이터 저장소는 관리형 PostgreSQL과 Redis를 사용합니다.

| 대상 | 권장 서비스 | 연결 변수 |
| --- | --- | --- |
| Collab Server 상태 | Neon 또는 Render Postgres | `STATE_BACKEND=postgres`, `COLLAB_DATABASE_URL` |
| Collab 실시간 pub/sub | Upstash Redis, Redis Cloud 또는 Render Key Value | `REDIS_URL` |
| OpsLens DB | Neon 또는 Render Postgres | `DATABASE_URL`, `DIRECT_DATABASE_URL` |
| Collab Web | Vercel | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` |
| OpsLens Web | Vercel | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `OPSLENS_AUTH_BRIDGE_SECRET` |

운영에서는 로컬 Docker URL을 사용하지 않습니다. `COLLAB_SESSION_SECRET`, `AUTH_JWT_SECRET`, `AUTH_BRIDGE_SECRET`, `OPSLENS_AUTH_BRIDGE_SECRET`, `OPS_INGESTION_KEY`는 서로 다른 32자 이상 난수로 설정합니다. OpsLens Server는 운영 모드에서 `CORS_ORIGINS`가 비어 있으면 시작하지 않으며, OpsLens Web의 실제 도메인만 쉼표로 구분해 지정합니다.

## OpsLens 외부 연동

- Slack: `OPS_SLACK_WEBHOOK_URL`을 설정하면 Critical/High 알림이 `OpsNotificationDelivery`로 기록되고 실패 시 지수 백오프로 재시도됩니다.
- Sentry: Relay 또는 webhook에서 `POST /ops/ingest/sentry`로 전달합니다. `x-opslens-ingestion-key` 헤더와 `OPS_INGESTION_KEY`가 일치해야 합니다.
- CI/배포 도구: `POST /ops/ingest/logs`에 `environment`, `serviceName`, `deploymentVersion`, `logs`를 전달합니다. 배포 직후 오류 증가는 OpsLens 배포 영향 분석과 커맨드 센터에 반영됩니다.

배포 전에는 `pnpm db:opslens:migrate:deploy`로 최신 마이그레이션을 적용한 뒤, OpsLens Web/Server를 같은 production 환경변수 세트로 빌드합니다.

## 배포 전 확인

1. PostgreSQL 연결 문자열과 SSL 옵션을 배포 공급자 요구사항에 맞춘다.
2. Redis URL을 TLS 제공 시 `rediss://`로 설정한다.
3. `CORS_ORIGINS`에 Vercel 운영 도메인만 명시한다.
4. OpsLens migration을 배포 전에 적용한다.
5. Render healthcheck URL과 Vercel API URL이 실제 도메인을 가리키는지 확인한다.
