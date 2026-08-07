# OpsLens Server App

OpsLens용 GraphQL 서버입니다.

## 역할

- 로그 분석
- 이슈 생성/수정/상태관리
- QA 시나리오 생성
- 배포 영향 분석 데이터 제공
- 운영 알림/설정 데이터 제공
- 운영 리포트 생성/스냅샷 저장
- 로그 분석 세션 이력 저장
- Prisma(PostgreSQL/Neon) 연동

## 도메인 기능

### 대시보드/이슈

- severity 분포, 24시간 에러 추이, 반복 이슈, 배포 이후 신규 이슈 집계
- 이슈 priority, SLA, escalation level, 담당자, 상태, 코멘트 관리
- 로그 이벤트와 이슈 상세 연결

### 로그 분석

- raw log 파싱/클러스터링
- 신규 이슈 생성 또는 기존 이슈 갱신
- 분석 실행 이력을 `LogAnalysisSession`에 저장

### 외부 로그 ingestion

`OPS_INGESTION_KEY`를 설정하면 외부 로그 수집기나 CI에서 `POST /ops/ingest/logs`를 호출할 수 있습니다.

```bash
curl -X POST http://localhost:4100/ops/ingest/logs \
  -H 'Content-Type: application/json' \
  -H 'x-opslens-ingestion-key: replace-with-32chars-or-more-ingestion-key' \
  -d '{
    "environment": "prod",
    "serviceName": "checkout-api",
    "source": "sentry",
    "deploymentVersion": "v1.4.0",
    "logs": ["2026-08-07T10:00:00Z ERROR checkout timeout"]
  }'
```

- `logs`는 문자열 또는 문자열 배열을 지원합니다.
- ingestion 요청은 기존 로그 클러스터링과 이슈 생성 흐름을 그대로 사용합니다.
- 최대 본문 크기는 `OPS_INGESTION_MAX_CHARS`로 제한합니다.

### 배포 운영

- 배포 버전, 상태, 담당자, 승인자, 변경 범위, 체크리스트, 롤백 기준 저장
- 배포 전후 모니터링 윈도우 기준 에러 증가 분석

### QA/리포트/알림

- QA 산출물 생성, 조회, 삭제와 담당자/검토자/실행 상태 저장
- 운영 리포트 생성 결과를 `OpsReportSnapshot`에 저장
- 운영 알림 생성/조회/읽음 처리
- 운영 설정 key-value 저장

## 레이어 구조

- `src/index.ts`: 애플리케이션 엔트리/부트스트랩
- `src/config/*`: 런타임 환경변수/설정
- `src/integration/*`: DB/외부 연동 인프라
- `src/modules/*`: 도메인 모듈(health/auth/ops/ai)

## 실행

```bash
pnpm db:opslens:migrate:deploy
pnpm db:opslens:generate
pnpm db:opslens:seed
pnpm dev:opslens:server
pnpm --filter @repo/opslens-server lint
pnpm --filter @repo/opslens-server typecheck
```

- Local: <http://localhost:4100/graphql>
- Domain: 미배포

## 로컬 mock 로그인

Seed 실행 후 아래 계정으로 `opslens-web`에서 로그인할 수 있습니다.

| 역할     | 이메일                   | 비밀번호       |
| -------- | ------------------------ | -------------- |
| Admin    | `admin@opslens.local`    | `opslens1234!` |
| Operator | `operator@opslens.local` | `opslens1234!` |

## Seed 데이터

`prisma/seed.ts`는 OpsLens 확인에 필요한 운영 mock 데이터를 재생성합니다.

- 사용자: admin/operator 계정
- 배포: prod/stage 배포 이력, 변경 범위, 체크리스트, 롤백 기준
- 이슈: 결제/주문/인증/문서/화이트보드/배치 이슈, priority/SLA/escalation
- 로그: 이슈별 log event
- QA: 산출물, 담당자, 검토자, 실행 상태
- 알림: critical/high/medium 운영 알림
- 분석 이력: 로그 분석 세션
- 리포트: 운영 리포트 스냅샷
- 설정: 알림 정책, 리포트 스케줄, 배포 가드레일

주의: seed는 OpsLens 샘플 데이터를 삭제 후 재입력합니다. 공유 DB에 실행할 때는 대상 환경을 먼저 확인하세요.

## 배포 단계별 실행 예시

### 로컬(Local)

```bash
pnpm dev:opslens:server
```

### 스테이징(Staging)

```bash
pnpm db:opslens:migrate:deploy
pnpm --filter @repo/opslens-server build
```

### 운영(Production)

```bash
pnpm db:opslens:migrate:deploy
pnpm --filter @repo/opslens-server build
```

- 운영에서는 `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AI_*` 값을 런타임 환경변수로 주입합니다.
- 인증 사용 시 `AUTH_JWT_SECRET`, `AUTH_ACCESS_TOKEN_TTL_SEC`, `AUTH_BRIDGE_SECRET`도 함께 설정합니다.
- 외부 로그 ingestion 사용 시 `OPS_INGESTION_KEY`를 반드시 secret으로 주입합니다.

## 관련 문서

- Dashboard: [`../opslens-web/README.md`](../opslens-web/README.md)
- 루트: [`../../README.md`](../../README.md)
