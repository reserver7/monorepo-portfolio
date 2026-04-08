# **APP_TITLE** App

`@repo/__APP_NAME__` 앱 템플릿입니다.

## 역할

- 신규 Next.js 앱 시작점
- `@repo/*` 공용 패키지 기반 구성

## 실행

```bash
pnpm --filter @repo/__APP_NAME__ dev
pnpm --filter @repo/__APP_NAME__ build
pnpm --filter @repo/__APP_NAME__ lint
pnpm --filter @repo/__APP_NAME__ typecheck
```

- Local: <http://localhost:__APP_PORT__>

## 기본 의존성

- `@repo/ui`
- `@repo/theme`
- `@repo/react-query`
- `@repo/forms`
- `@repo/utils`
- `@repo/zustand`

## 관련 문서

- 루트: [`../../README.md`](../../README.md)
- 패키지: [`../../packages/README.md`](../../packages/README.md)
