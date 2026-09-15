## 1. Baseline 및 inventory

- [x] 1.1 모든 `apps/**`, `packages/**`, `templates/**`의 package metadata, exports, scripts, dependencies, tsconfig, lint/style/build 설정을 목록화한다
- [x] 1.2 React/Next route별 Server/Client Component, `use client`, dynamic import, loading/error boundary와 데이터 요청 흐름을 inventory한다
- [x] 1.3 모든 JSON의 schema, locale key parity, manifest 원본-생성 관계와 validation baseline을 기록한다
- [x] 1.4 앱별 lint, typecheck, build, runtime smoke, bundle 및 390px baseline을 기록한다

## 2. React 및 Next runtime 정리

- [x] 2.1 불필요하게 넓은 Client Component 경계와 derived effect를 감사하고 변경 근거가 있는 후보만 server-first 또는 직접 계산 구조로 정리한다
- [x] 2.2 route loading/error/not-found, hydration 및 독립 데이터 요청의 waterfall을 점검하고 필요한 경우 병렬화한다
- [x] 2.3 무거운 chart/editor/overlay 기능의 dynamic import와 초기 bundle을 측정해 효과가 있는 경계만 조정한다
- [x] 2.4 주요 route의 Link, Image, metadata, headers 및 접근성 runtime 동작을 검증한다

## 3. workspace 설정 및 JSON 계약 정리

- [x] 3.1 공통 config와 앱/template 설정 drift를 제거하고 정당한 앱별 예외를 명시한다
- [x] 3.2 package exports, private/public 범위, peer/dependency 및 barrel 경계를 실제 소비 경로와 일치시킨다
- [x] 3.3 i18n JSON key parity, manifest/generated metadata와 config JSON schema 검증을 자동화하거나 기존 검증을 보강한다
- [x] 3.4 Node/pnpm/package manager 및 workspace 실행 계약을 재현 가능하게 검증한다

## 4. 통합 검증 및 spec 마무리

- [x] 4.1 전체 workspace lint/typecheck 및 실제 Next 앱 production build와 template config contract 검증을 통과한다
- [x] 4.2 주요 route runtime smoke, hydration/page error, keyboard interaction과 390px overflow 검사를 통과한다
- [x] 4.3 bundle/렌더/요청 비용 비교 결과와 변경하지 않은 항목의 근거를 감사 리포트에 기록한다
- [x] 4.4 OpenSpec strict validation을 통과하고 main spec을 sync한 뒤 archive 전 상태를 확인한다
