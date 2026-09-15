## Why

현재 감사는 Storybook과 `packages/**` 중심이어서 실제 Next.js 애플리케이션의 렌더링 경계, 서버 데이터 흐름, workspace 설정과 JSON 계약까지는 완료 기준에 포함하지 않는다. React/Next 실행 경로와 설정 drift가 누적되면 초기 번들, hydration, 빌드 재현성과 신규 앱 템플릿의 일관성이 함께 악화되므로 별도 구조 감사를 진행한다.

## What Changes

- React Server/Client Component 경계와 `use client` 전파를 앱·패키지 전체에서 감사한다.
- Next App Router의 loading/error 경계, dynamic import, 데이터 waterfall, hydration 및 이미지/링크 사용을 점검한다.
- `next.config`, TypeScript, ESLint, Tailwind, PostCSS, Turbo, pnpm workspace 설정의 중복과 앱·template drift를 정리한다.
- workspace `package.json`의 exports, dependency/peerDependency, private/public 범위와 패키지 실행 계약을 일관화한다.
- i18n, component manifest, environment/config JSON의 schema·key parity·생성 파일 일관성을 검증한다.
- 측정된 문제만 변경하고, 동작·접근성·빌드 결과를 앱 단위로 검증한다.

## Capabilities

### New Capabilities

- `react-next-workspace-architecture`: React/Next 실행 경계, workspace 설정 및 JSON 계약을 감사하고 일관된 구조와 성능 기준을 보장한다.

### Modified Capabilities

- 없음

## Impact

- `apps/collab-web`, `apps/opslens-web`, `apps/storybook`, `apps/*-server`
- `packages/configs`, `packages/theme`, `packages/react-query`, `packages/ui` 및 모든 workspace `package.json`
- `templates/next-app`, `tsconfig*.json`, `next.config.*`, `turbo.json`, `pnpm-workspace.yaml`, i18n/manifest/config JSON
- 앱 초기 번들, hydration, route/data loading, build/typecheck/lint 실행 결과
