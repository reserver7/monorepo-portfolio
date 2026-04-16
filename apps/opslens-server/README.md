# OpsLens Server App

OpsLens용 GraphQL 서버입니다.

## 역할

- 로그 분석
- 이슈 생성/수정/상태관리
- QA 시나리오 생성
- 배포 영향 분석 데이터 제공
- Prisma(PostgreSQL/Neon) 연동

## 레이어 구조

- `src/index.ts`: 애플리케이션 엔트리/부트스트랩
- `src/config/*`: 런타임 환경변수/설정
- `src/integration/*`: DB/외부 연동 인프라
- `src/modules/*`: 도메인 모듈(health/ops/ai)

## 실행

```bash
pnpm db:opslens:generate
pnpm dev:opslens:server
pnpm --filter @repo/opslens-server lint
pnpm --filter @repo/opslens-server typecheck
pnpm db:opslens:migrate:dev
pnpm db:opslens:seed
```

- Local: <http://localhost:4100/graphql>
- Domain: 미배포

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

## 관련 문서

- Dashboard: [`../opslens-web/README.md`](../opslens-web/README.md)
- 루트: [`../../README.md`](../../README.md)
