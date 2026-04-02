# 실시간 협업 문서 + 화이트보드 + OpsLens AI 모노레포

Turborepo + pnpm 기반 모노레포입니다.

## 앱

- `apps/docs` (`http://localhost:3000`)
- `apps/whiteboard` (`http://localhost:3001`)
- `apps/server` (`http://localhost:4000`)
- `apps/opslens-dashboard` (`http://localhost:3002`)
- `apps/opslens-api` (`http://localhost:4100`)

## 실제 도메인

- Docs: <https://monorepo-portfolio-docs.vercel.app>
- Whiteboard: <https://monorepo-portfolio-whiteboard.vercel.app>
- Server: <https://monorepo-portfolio-server.onrender.com>
- OpsLens Dashboard: 미배포
- OpsLens API: 미배포

## 공용 패키지

- `@repo/ui`: 공용 UI 컴포넌트/스타일 토큰
- `@repo/theme`: 공용 테마/프로바이더 조합
- `@repo/react-query`: 공용 Query/HTTP 유틸
- `@repo/zustand`: 공용 상태관리 유틸
- `@repo/forms`: 공용 폼 유틸
- `@repo/utils`: 협업/문자열/파일 등 공용 유틸
- `@repo/configs`: Next/Tailwind/PostCSS/TS/ESLint 설정

## 구조 원칙

- 프론트: `app + features + lib` (도메인 우선)
- 백엔드: `features + platform (+config/observability)`
- 2개 앱 이상 재사용 코드는 `packages/*`로 승격

## 시작

```bash
pnpm install
pnpm dev:collab
pnpm dev:opslens
```

## 자주 쓰는 명령 10개

```bash
pnpm install
pnpm dev:collab
pnpm dev:opslens
pnpm check
pnpm build
pnpm test:server
pnpm test:e2e
pnpm db:opslens:migrate:dev
pnpm db:opslens:seed
pnpm audit:workspace
```

## 스크립트 네임스페이스

- `dev:*`: 로컬 개발 실행
- `db:*`: OpsLens API Prisma DB 작업
- `check:*`: lint/typecheck
- `test:*`: 서버 테스트/e2e 테스트

## 참고 문서

- 구조/계층 규칙: `CONTRIBUTING.md`
- 패키지 책임 분리: `packages/README.md`
