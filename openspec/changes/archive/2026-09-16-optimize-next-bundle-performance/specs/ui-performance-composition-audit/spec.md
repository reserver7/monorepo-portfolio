## MODIFIED Requirements

### Requirement: 모든 workspace package는 감사 범위를 가진다

감사는 `packages/**` 아래의 모든 package를 대상으로 public export, 내부 모듈, dependency, script, build 설정, 테스트, 문서를 확인해야 하며(MUST), 앱의 package 소비 경로와 초기 bundle 영향도 함께 확인해야 한다(MUST). 감사 결과는 중복·dead code·성능 위험·API 위험·bundle 위험을 근거와 영향 범위와 함께 기록해야 한다(MUST).

#### Scenario: package 감사가 누락된다

- **WHEN** packages 아래에 UI가 아닌 공통·상태·데이터·테마 package가 존재한다
- **THEN** 해당 package도 동일한 감사 목록과 검증 결과에 포함된다.

#### Scenario: 문제 없는 package를 확인한다

- **WHEN** package에서 삭제·단순화·성능 변경이 필요하지 않다
- **THEN** 변경하지 않은 이유와 실행한 검증을 감사 결과에 기록한다.

#### Scenario: barrel import가 bundle에 영향을 준다

- **WHEN** workspace package의 barrel import가 사용하지 않는 모듈까지 초기 route에 포함시킨다
- **THEN** 감사는 영향 route와 모듈을 식별하고, package export 또는 소비 import를 변경할지 근거를 남긴다.

### Requirement: React 렌더링은 불필요한 작업을 반복하지 않는다

컴포넌트와 package 코드는 렌더링 중 컴포넌트 정의, 불필요한 effect 기반 파생 상태, 안정화되지 않은 고비용 기본 객체를 반복 생성해서는 안 된다(MUST NOT). 긴 목록과 트리 렌더링은 공통 memoization 또는 viewport에 맞는 렌더링 전략을 사용해야 하며(MUST), 비 UI package는 waterfall, 중복 요청, 불필요한 직렬화와 전역 listener를 반복해서는 안 된다(MUST NOT). 사용하지 않은 대형 기능은 사용자 동작 전까지 초기 bundle에 포함해서는 안 된다(MUST NOT).

#### Scenario: 트리 데이터를 렌더링한다

- **WHEN** Tree 또는 TreeSelect가 일부 노드 상태만 변경한다
- **THEN** 변경되지 않은 노드의 렌더링 작업을 불필요하게 다시 수행하지 않는다.

#### Scenario: 무거운 UI 모듈을 사용한다

- **WHEN** 사용자가 특정 overlay, picker 또는 데이터 기능을 열지 않았다
- **THEN** 해당 기능의 무거운 client module을 초기 화면 경로에서 불필요하게 로드하지 않는다.

#### Scenario: 공통 package의 비용을 점검한다

- **WHEN** utils, query, state, theme 또는 config package가 여러 앱에서 사용된다
- **THEN** 중복 계산·요청·listener·직렬화·barrel import와 불필요한 dependency를 확인하고 근거 없이 최적화를 추가하지 않는다.

### Requirement: 성능 리팩토링은 동작 보존으로 검증된다

성능 또는 구조 리팩토링은 기존 public 동작, 키보드 접근성, controlled/uncontrolled 상태, 오류·빈 상태를 보존해야 하며(MUST). 변경 후 lint, typecheck, component interaction, bundle analysis 및 좁은 viewport 검증을 통과해야 한다(MUST).

#### Scenario: public prop을 변경한다

- **WHEN** Storybook 또는 테스트가 주요 prop과 사용자 이벤트를 변경한다
- **THEN** 결과 UI와 callback이 리팩토링 전 계약과 동일하게 동작한다.

#### Scenario: 좁은 화면에서 사용한다

- **WHEN** 복합 컴포넌트를 390px viewport에서 렌더링한다
- **THEN** 오류·overflow·잘린 action 없이 키보드와 pointer로 사용할 수 있다.

#### Scenario: bundle 최적화를 적용한다

- **WHEN** package import 또는 dynamic loading 구조가 변경된다
- **THEN** 두 Next 앱의 production build와 분석 결과가 생성되고, 주요 route의 runtime smoke 및 public component 검증이 통과한다.
