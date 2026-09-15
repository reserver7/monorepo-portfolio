## Context

현재 monorepo는 `@repo/configs`의 공통 Next 설정과 `templates/next-app`을 사용하지만, 두 Next 앱·template·workspace package의 실행 경계와 설정 계약이 실제로 동일한지 별도 검증이 필요하다. Storybook 및 UI package 감사는 이미 별도 change에서 완료했으므로 이 change는 앱 runtime, 설정, metadata JSON에 집중한다.

## Goals

- 앱과 패키지의 `use client`, server data, dynamic import, loading/error 경계를 inventory한다.
- route/data waterfall, hydration, 초기 bundle과 client-only module 비용을 측정한다.
- 공통 설정과 앱 예외를 비교하고 template drift, package export/dependency 문제를 제거한다.
- JSON schema, locale key parity, manifest 생성 일관성을 자동 검증한다.

## Non-goals

- UI 컴포넌트 디자인 재설계
- 근거 없는 전역 `useMemo`/`memo` 추가
- 모든 barrel import의 일괄 제거
- 런타임 동작과 무관한 설정 포맷 변경

## Decisions

### Runtime boundaries

`use client` 사용 위치와 import graph를 앱별로 기록하고, server-first로 바꿀 수 있는 route부터 처리한다. 브라우저 API가 필요한 subtree는 유지하며, 큰 interactive module은 기존 `next/dynamic` 패턴과 실제 bundle 결과를 기준으로 판단한다.

### Settings and package contracts

`packages/configs`를 기준으로 Next/TypeScript/ESLint/Tailwind/PostCSS 설정을 비교한다. 앱별 예외는 next config override나 명시적 config 파일에만 남기고, package exports와 dependencies는 실제 소비 경로를 기준으로 정리한다.

### JSON contracts

기존 생성·검증 스크립트를 우선 재사용한다. 새 schema/dependency는 기존 검증으로 표현할 수 없을 때만 추가하며, locale parity와 manifest drift를 CI 검증으로 고정한다.

### Verification

baseline과 post-change의 lint/typecheck/build 결과, route smoke, hydration/page error, 390px overflow 및 bundle 주요 chunk를 비교한다. 측정되지 않은 최적화는 변경하지 않는다.

## Risks

- Server/Client 경계 변경은 hydration과 event handler 동작을 바꿀 수 있다.
- package exports 변경은 앱·template의 import를 깨뜨릴 수 있다.
- 설정 중앙화는 앱별 보안 headers나 build 예외를 잃을 수 있다.

각 변경은 호출부 검색과 앱 단위 build/smoke 검증 후 적용하며, 예외는 중앙 설정에 무리하게 합치지 않는다.
