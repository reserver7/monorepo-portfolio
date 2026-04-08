# OpsLens API App

OpsLens용 GraphQL API 서버입니다.

## 역할

- 로그 분석
- 이슈 생성/수정/상태관리
- QA 시나리오 생성
- 배포 영향 분석 데이터 제공
- Prisma(PostgreSQL/Neon) 연동

## 실행

```bash
pnpm --filter @repo/opslens-api dev
pnpm --filter @repo/opslens-api build
pnpm --filter @repo/opslens-api lint
pnpm --filter @repo/opslens-api typecheck
pnpm db:opslens:migrate:dev
pnpm db:opslens:seed
```

- Local: <http://localhost:4100/graphql>
- Domain: 미배포

## 관련 문서

- Dashboard: [`../opslens-dashboard/README.md`](../opslens-dashboard/README.md)
- 루트: [`../../README.md`](../../README.md)
