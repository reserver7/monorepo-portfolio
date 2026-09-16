## MODIFIED Requirements

### Requirement: 모든 public 컴포넌트는 실제 동작하는 업무용 API를 제공한다
모든 public 컴포넌트는 역할에 맞는 typed props와 기본값을 제공해야 하며(MUST), 선언된 prop은 실제 렌더링·상태 변경·이벤트 결과에 반영되어야 한다(MUST). 해당되는 경우 `size`, `variant`, `status`, `disabled`, `loading`, `readOnly`, `allowClear`, `open`, `value`, `defaultValue`, callback을 지원해야 한다(MUST). 서로 다른 컴포넌트가 같은 의미의 prop을 다른 이름이나 다른 동작으로 중복 제공해서는 안 되며(MUST NOT), breaking change가 필요한 경우 public API matrix에 명시해야 한다(MUST). 삭제 대상으로 결정된 컴포넌트는 public export와 내부 사용처에서 제거하고, 기능은 남은 primitive 또는 제품 로컬 조합으로 이전해야 한다(MUST). 내부 구현 primitive는 public package의 named export와 manifest component로 노출해서는 안 된다(MUST).

#### Scenario: 개발자가 입력 컴포넌트 상태를 제어한다
- **WHEN** 개발자가 controlled 또는 uncontrolled value와 disabled/status 옵션을 전달한다
- **THEN** 컴포넌트는 동일한 값 모델로 렌더링하고 변경 callback과 접근성 상태를 일관되게 전달한다

#### Scenario: 동일한 의미의 옵션을 비교한다
- **WHEN** 개발자가 유사한 두 컴포넌트의 size, status, disabled, loading API를 사용한다
- **THEN** 동일한 의미의 prop은 같은 타입·기본값·상태 표현 규칙을 따르고 중복 API는 허용되지 않는다

#### Scenario: 삭제 대상 component를 import한다
- **WHEN** 개발자가 삭제 대상 component를 public package에서 import한다
- **THEN** 해당 export는 제공되지 않으며 migration 문서가 대체 primitive를 안내한다

#### Scenario: 내부 primitive를 public import한다
- **WHEN** 개발자가 `Table`, `Sheet` 또는 `Toast` renderer를 public package에서 import한다
- **THEN** 해당 내부 symbol은 제공되지 않고 DataTable, Drawer 또는 message/notification 대체 API가 안내된다

### Requirement: 전체 엔터프라이즈 컴포넌트 범위를 실제 구현한다
시스템은 역할 중복 없이 업무 화면에 필요한 public component를 제공해야 한다(MUST). 콘텐츠 탐색은 Tabs, 즉시 적용되는 소수의 상호 배타적 선택은 제품 로컬 조합 또는 명확한 대체 primitive로 처리하며 Segmented는 제공하지 않는다(MUST). StatCard, StateView, Spinner처럼 특정 제품 화면 조합이나 기존 alias에 해당하는 component는 공용 API로 제공하지 않는다(MUST). AntD 기준의 public 업무 component는 `DataTable`, `Drawer`, `Modal`, `Popconfirm`, `message`, `notification`처럼 소비자 목적이 분명한 API로 노출하고, `Table`, `Sheet`, `AlertConfirm`, `Toast` renderer처럼 구현 조합 또는 host 역할인 symbol은 내부로 제한해야 한다(MUST).

#### Scenario: 제품 팀이 업무 화면을 구성한다
- **WHEN** 제품 팀이 입력·데이터·피드백 흐름을 조합한다
- **THEN** 내부 경로 import나 타사 컴포넌트 직접 사용 없이 남은 공용 API로 화면을 구성할 수 있다

#### Scenario: 유사한 공용 component를 선택한다
- **WHEN** 개발자가 콘텐츠 탐색, 통계 카드, 상태 화면 또는 로딩 표시를 구현한다
- **THEN** Tabs, Card/Statistic, Empty/Alert/Result, Spin 등 역할이 명확한 component를 조합하고 삭제된 중복 component를 사용하지 않는다

#### Scenario: 테이블과 overlay 역할을 선택한다
- **WHEN** 개발자가 데이터 그리드 또는 side overlay를 구현한다
- **THEN** DataTable과 Drawer를 사용하고 internal Table 또는 Sheet를 직접 import하지 않는다

#### Scenario: 확인과 imperative feedback 역할을 선택한다
- **WHEN** 개발자가 확인 동작 또는 비동기 알림을 구현한다
- **THEN** 앵커 주변 확인에는 Popconfirm, blocking 확인에는 Modal, 알림에는 message 또는 notification을 사용한다
