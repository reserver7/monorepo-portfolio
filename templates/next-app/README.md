# __APP_TITLE__ App

`@repo/__APP_NAME__` 앱입니다.

## 역할
- 신규 도메인 기능 개발용 Next.js 앱
- 공용 패키지(`@repo/*`) 기반 화면/상태/데이터 계층 구성

## 로컬 실행
```bash
pnpm --filter @repo/__APP_NAME__ dev
```

- URL: <http://localhost:__APP_PORT__>

## 주요 의존성
- `@repo/ui`
- `@repo/theme`
- `@repo/react-query`
- `@repo/forms`
- `@repo/utils`
- `@repo/zustand`

## 자주 쓰는 명령
```bash
pnpm --filter @repo/__APP_NAME__ dev
pnpm --filter @repo/__APP_NAME__ build
pnpm --filter @repo/__APP_NAME__ lint
pnpm --filter @repo/__APP_NAME__ typecheck
```

## 관련 문서
- 루트 가이드: [`../../README.md`](../../README.md)
- 구조 규칙: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
