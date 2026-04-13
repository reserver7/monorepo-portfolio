# __APP_TITLE__ App

`@repo/__APP_NAME__` 앱 템플릿입니다.

## 목적

- 신규 Next.js 앱을 모노레포 표준에 맞춰 빠르게 시작
- 공통 패키지(`@repo/*`) 활용 전제로 기본 구조/설정 제공

## 실행

```bash
pnpm --filter @repo/__APP_NAME__ dev
pnpm --filter @repo/__APP_NAME__ build
pnpm --filter @repo/__APP_NAME__ lint
pnpm --filter @repo/__APP_NAME__ typecheck
```

- Local: <http://localhost:__APP_PORT__>

## 기본 구조

- `app/layout.tsx`
  - `createAppMetadata` + `AppHead`
- `app/providers.tsx`
  - `createAppProviders` 기반 query/theme/error/toast 기본 구성
- `app/page.tsx`
  - `@repo/ui` 컴포넌트 사용 예시
- `app/globals.css`
  - `@repo/configs/global.css` import

## 기본 의존성

- `@repo/ui`
- `@repo/theme`
- `@repo/react-query`
- `@repo/forms`
- `@repo/utils`
- `@repo/zustand`

## 환경변수

```bash
NEXT_PUBLIC_APP_TITLE=__APP_TITLE__
NEXT_PUBLIC_APP_DESCRIPTION=__APP_TITLE__ 서비스
NEXT_PUBLIC_APP_URL=http://localhost:__APP_PORT__
```

## 팀 컨벤션 요약

- UI 컴포넌트는 `@repo/ui` 우선 사용
- 서버 상태/요청은 `@repo/react-query` 유틸 우선 사용
- 공통 유틸은 `@repo/utils`로 올리고 앱 간 중복 구현 금지
- 앱 도메인 API/쿼리 조합은 앱 내부(`app`, `features`, `lib`)에서 관리

## 관련 문서

- 루트: [`../../README.md`](../../README.md)
- 패키지: [`../../packages/README.md`](../../packages/README.md)
- 기여 규칙: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
