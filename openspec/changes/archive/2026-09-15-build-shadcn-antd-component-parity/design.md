## Context

현재 `packages/ui/components`에는 여러 공용 컴포넌트가 있지만 컴포넌트별 props 범위와 상태 계약이 균일하지 않다. 기존 Storybook 생성기는 legacy index에 결합되어 있으므로 구현 산출물과 문서 생성을 분리해야 한다.

## Goals / Non-Goals

**Goals:**

- shadcn/Radix를 기반으로 source-owned 컴포넌트 동작과 자체 토큰을 유지한다.
- AntD의 업무 흐름에서 사용하는 props와 상호작용을 우리 public API로 제공한다.
- 컴포넌트 metadata를 기준으로 Storybook을 변경 시 자동 생성하고, 마지막에 전체 재생성과 drift 검사를 실행한다.
- 구현·검증 단위는 개별 컴포넌트가 아니라 입력, 탐색, 데이터, overlay, feedback 같은 vertical batch로 운영한다. batch 안의 컴포넌트는 한 번에 구현하고 한 번에 lint/typecheck/a11y 검증한다.
- UI/UX audit은 58개 public component 전체를 대상으로 하며, 공통 primitive를 먼저 고친다. Overlay는 footer safe-area·내부 스크롤·Escape·focus를, 입력은 label·placeholder·clear·empty 상태를, 데이터 컴포넌트는 긴 콘텐츠·overflow·loading/empty/error를 우선 검증한다.

**Non-Goals:**

- `antd` 패키지의 source, CSS, icon, branding 또는 import 호환 계층을 복제하지 않는다.
- 앱 도메인 데이터 fetching과 권한 로직을 UI package에 넣지 않는다.

## Decisions

1. **Batch vertical slice:** 타입, 실제 동작, 접근성, 상태, 테스트를 관련 컴포넌트 묶음 단위로 함께 완료한다. 구현 중인 batch도 manifest metadata가 준비되면 Storybook을 생성할 수 있으며, incomplete 상태는 metadata와 quality check로 표시한다.
2. **public export 우선:** 소비자는 `@repo/ui`의 공개 entry point만 사용한다. 내부 폴더는 구현 경계로 유지한다.
3. **headless 상태와 presentation 분리:** Table, Tree, Select, Form은 데이터 모델과 시각 표현을 분리해 앱 데이터에 종속되지 않게 한다.
4. **AntD props의 의미 기반 매핑:** 동일 의미의 props는 이름을 유지하고, deprecated 또는 내부 전용 옵션은 semantic slot과 자체 타입으로 정리한다.
5. **최소 의존성:** 기존 Radix와 native browser 기능을 우선 사용하고, 날짜·가상화·파일 업로드 의존성은 실제 요구와 bundle 영향을 검증한 후 추가한다.
6. **Storybook generator:** JSON manifest를 읽어 기본 story와 Controls를 결정적으로 생성하며, 복잡한 interaction만 custom story로 분리한다.
7. **완료 기준:** public export, 실제 사용자 상호작용, controlled/uncontrolled 상태, 오류 경계, 접근성 테스트를 통과한 컴포넌트만 manifest에 등록한다. manifest 등록은 구현의 대체물이 아니다.
8. **Visual quality floor:** 엔터프라이즈 업무 화면을 기준으로 canvas `#F7F8FA`, surface `#FFFFFF`, ink `#172033`, accent `#3657D6`, success `#17845B`, danger `#C83B4A` 토큰을 검토하고, 모든 컴포넌트가 동일한 카드·radius 패턴을 반복하지 않도록 역할별 밀도와 계층을 구분한다.
9. **Shared primitive first:** Modal/Sheet/Popover, Input/FormField, Button, scroll container의 레이아웃·focus·motion 계약을 먼저 보완한 뒤 이를 사용하는 public component를 기능군별로 재검증한다.
10. **Virtualization boundary:** DataTable은 `virtualized`와 `virtualizationMode`를 통해 50개 이상 row를 windowing하고, Chart는 UI package에 임의의 chart engine을 추가하지 않는 별도 확장 경계로 둔다. 차트가 필요할 때만 앱 또는 전용 package가 renderer를 소유한다.

## Risks / Trade-offs

- [범위가 넓어 미완성 API가 누적될 수 있음] → 컴포넌트별 acceptance test와 public export check를 통과한 항목만 완료 처리한다.
- [AntD 옵션을 그대로 늘리면 API가 비대해질 수 있음] → 실제 동작하는 옵션만 공개하고 deprecated alias는 명시적 migration note를 둔다.
- [생성 story가 실제 UX를 충분히 설명하지 못할 수 있음] → 복합 컴포넌트에는 별도 custom interaction story를 허용한다.

## Migration Plan

1. 공통 prop vocabulary와 public export 규칙을 고정한다.
2. Data Entry, Navigation, Data Display, Feedback 순서로 컴포넌트를 구현한다.
3. batch 변경이 끝날 때 manifest를 갱신하고 affected Storybook을 한 번 자동 생성한다. batch 중간의 파일별 재생성은 요구하지 않는다.
4. 전체 구현 완료 시 Storybook을 일괄 재생성하고 lint, typecheck, interaction/a11y audit, Storybook build를 실행한다.
5. migration이 끝난 legacy wrapper는 참조가 없는 경우에만 제거한다.
6. 전체 public component를 light/dark, keyboard-only, focus-visible, reduced-motion, 390px viewport, long-content 조건으로 audit하고 발견된 문제를 공통 primitive 또는 해당 기능군에서 일괄 수정한다.
