# 실시간 협업 + OpsLens 모노레포

Turborepo + pnpm 기반 모노레포입니다.

## 앱

- `apps/docs` - 문서 협업 (`http://localhost:3000`)
- `apps/whiteboard` - 화이트보드 협업 (`http://localhost:3001`)
- `apps/server` - 협업 API/소켓 서버 (`http://localhost:4000`)
- `apps/opslens-dashboard` - 운영 대시보드 (`http://localhost:3002`)
- `apps/opslens-api` - 운영 GraphQL API (`http://localhost:4100/graphql`)
- `apps/storybook` - 디자인시스템 검증 (`http://localhost:6006`)

## 실제 도메인

- Docs: <https://monorepo-portfolio-docs.vercel.app>
- Whiteboard: <https://monorepo-portfolio-whiteboard.vercel.app>
- Server: <https://monorepo-portfolio-server.onrender.com>
- OpsLens Dashboard: 미배포
- OpsLens API: 미배포

## 공용 패키지

- `@repo/ui`: 디자인시스템 컴포넌트/토큰
- `@repo/theme`: 테마/프로바이더
- `@repo/react-query`: Query/HTTP 유틸
- `@repo/forms`: RHF 중심 폼 유틸
- `@repo/zustand`: 상태관리 유틸
- `@repo/utils`: 협업/공통 로직 유틸
- `@repo/configs`: Next/Tailwind/PostCSS/TS/ESLint 설정

## 시작

```bash
pnpm install
pnpm dev:collab
pnpm dev:opslens
```

## 자주 쓰는 명령

```bash
pnpm check
pnpm build
pnpm test:server
pnpm test:e2e:smoke
pnpm dev:storybook
pnpm storybook:gen
pnpm storybook:check
pnpm storybook:watch
pnpm db:opslens:migrate:dev
pnpm db:opslens:seed
pnpm audit:workspace
```

## 태그 배포

```bash
git tag -a v0.2.x -m "release: 설명"
git push origin v0.2.x
```

- `v*` 태그 푸시 시 CD 워크플로우가 실행됩니다.
- 일반 개발 흐름: 기능 브랜치 → PR → Squash Merge(main) → 태그 생성/푸시

## 관련 문서

- 패키지 가이드: [`packages/README.md`](packages/README.md)
- 기여/구조 원칙: [`CONTRIBUTING.md`](CONTRIBUTING.md)
