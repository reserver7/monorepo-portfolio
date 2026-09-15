## Why

현재 `packages/**` 전체에는 UI 컴포넌트뿐 아니라 공통 유틸리티, React Query, 상태관리, 테마, 설정 패키지까지 중복된 API와 불필요한 추상화, 성능 비용이 섞여 있을 수 있다. Vercel React 성능 기준과 composition pattern을 전체 패키지에 적용해 실제 병목과 유지보수 비용이 있는 부분을 전수 감사하고 필요한 부분을 리팩토링한다.

## What Changes

- `packages/**`의 public API, 내부 모듈, 의존성, 스크립트, 테스트, 문서, 빌드 경계를 전수 목록화한다.
- 중복·dead code·single-use abstraction·불필요한 dependency를 제거하거나 단순화한다. **BREAKING**
- Modal, Tree/TreeSelect, DataTable, overlay는 대표 사례로 우선 처리하되 감사 결과에 따라 모든 패키지의 동일 문제를 함께 처리한다.
- React/Next.js 패키지의 barrel import, waterfall, effect, memo, inline component, 큰 목록 렌더링을 측정 후 최적화한다.
- 공통 패키지의 캐시·상태·직렬화·이벤트 리스너·에러 처리·테스트 누락도 함께 점검한다.
- 변경된 public API와 성능 기준을 문서·테스트·빌드 검증에 반영한다.

## Capabilities

### New Capabilities

- `ui-performance-composition-audit`: UI public API와 React 렌더링 구조가 성능·컴포지션 기준을 만족하도록 한다.

### Modified Capabilities

### Impact

- `packages/**` 전체와 해당 패키지를 소비하는 앱의 migration 사용처
- package exports, dependencies, TypeScript/ESLint/build 설정과 테스트·문서
- 일부 public API와 import 경로는 migration이 필요할 수 있다.
