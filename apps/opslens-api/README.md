# OpsLens API App

운영 로그 분석/이슈 관리/QA 시나리오 생성을 담당하는 GraphQL API 서버입니다.

## 역할

- Dashboard 요약 데이터 제공
- 로그 분석 및 이슈 생성
- 이슈 상태/담당자/코멘트 관리
- QA 시나리오 생성
- 배포 영향 분석
- Prisma 기반 PostgreSQL(Neon) 연동

## 로컬 실행

```bash
pnpm --filter @repo/opslens-api dev
```

- URL: <http://localhost:4100/graphql>

## 실제 도메인

- 미배포

## 주요 의존성

- `@nestjs/*`
- `@apollo/server`
- `@prisma/client`
- `graphql`
- `zod`

## 자주 쓰는 명령

```bash
pnpm --filter @repo/opslens-api dev
pnpm --filter @repo/opslens-api build
pnpm --filter @repo/opslens-api lint
pnpm --filter @repo/opslens-api typecheck
pnpm db:opslens:migrate:dev
pnpm db:opslens:seed
```

## 관련 문서

- 루트 모노레포 가이드: [`../../README.md`](../../README.md)
- OpsLens Dashboard: [`../opslens-dashboard/README.md`](../opslens-dashboard/README.md)
