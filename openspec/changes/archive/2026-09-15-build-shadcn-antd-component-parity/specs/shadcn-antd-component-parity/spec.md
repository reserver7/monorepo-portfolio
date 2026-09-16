## Purpose

shadcn/Radix 기반의 자체 디자인시스템이 업무 화면에서 필요한 AntD 수준의 컴포넌트 기능과 일관된 접근성 계약을 제공하도록 한다.

## ADDED Requirements

### Requirement: 모든 public 컴포넌트는 실제 동작하는 업무용 API를 제공한다

모든 public 컴포넌트는 역할에 맞는 typed props와 기본값을 제공해야 하며(MUST), 선언된 prop은 실제 렌더링·상태 변경·이벤트 결과에 반영되어야 한다(MUST). 해당되는 경우 `size`, `variant`, `status`, `disabled`, `loading`, `readOnly`, `allowClear`, `open`, `value`, `defaultValue`, callback을 지원해야 한다(MUST).

#### Scenario: 개발자가 입력 컴포넌트 상태를 제어한다

- **WHEN** 개발자가 controlled 또는 uncontrolled value와 disabled/status 옵션을 전달한다
- **THEN** 컴포넌트는 동일한 값 모델로 렌더링하고 변경 callback과 접근성 상태를 일관되게 전달한다

### Requirement: 전체 엔터프라이즈 컴포넌트 범위를 실제 구현한다

시스템은 Button, Input, Select, Form, InputNumber, AutoComplete, Cascader, DatePicker, TimePicker, RangePicker, Mentions, Rate, Slider, Switch, Radio, Checkbox, Upload, Transfer, Table, Tree, TreeSelect, List, Descriptions, Statistic, Tag, Badge, Avatar, Timeline, Calendar, Pagination, Steps, Tabs, Modal, Drawer, Popconfirm, Alert, Message, Notification, Progress, Skeleton, Spin, Empty 및 Result를 공개 API로 제공해야 한다(MUST).
목록에 포함된 각 컴포넌트는 placeholder 또는 정적 목업이 아니라 실제 입력, 선택, 열기·닫기, pagination, 정렬·필터, 업로드, dismiss 등 역할에 맞는 동작을 구현해야 한다(MUST).

#### Scenario: 제품 팀이 업무 화면을 구성한다

- **WHEN** 제품 팀이 입력·데이터·피드백 흐름을 조합한다
- **THEN** 내부 경로 import나 타사 컴포넌트 직접 사용 없이 `@repo/ui` 공개 API로 화면을 구성할 수 있다

### Requirement: 복합 컴포넌트는 업무 상호작용을 처리한다

Table, Tree, Select, Transfer, Upload, Date/Time Picker는 검색, 선택, 정렬·필터, pagination, loading, empty, error, 긴 콘텐츠 및 좁은 viewport에 맞는 실제 동작을 제공해야 한다(MUST). 각 복합 컴포넌트는 변경 callback과 controlled/uncontrolled 상태를 모두 처리해야 한다(MUST).

#### Scenario: 긴 데이터와 오류 상태를 표시한다

- **WHEN** 데이터가 많거나 로딩·오류·빈 상태가 발생한다
- **THEN** 의미 관계, 작업 가능한 focus 순서 및 상태 안내를 유지하면서 화면을 사용할 수 있다

### Requirement: 모든 public component는 실무 UI/UX 품질 경계를 만족한다

모든 public component는 긴 텍스트, 빈 값, 좁은 viewport, dark mode, visible focus 및 reduced-motion 환경에서 레이아웃이 깨지지 않아야 하며(MUST), 공통 primitive를 통해 일관된 spacing, 상태 대비, focus 순서 및 dismiss 동작을 제공해야 한다(MUST).

#### Scenario: 모달 footer와 긴 콘텐츠를 사용한다

- **WHEN** 사용자가 긴 본문과 여러 footer action이 있는 Modal 또는 Drawer를 좁은 viewport에서 연다
- **THEN** 본문만 내부 스크롤되고 footer action은 잘리지 않으며, safe-area와 Escape 닫기 및 focus 복귀가 유지된다

#### Scenario: 입력 컴포넌트의 의미를 파악한다

- **WHEN** 사용자가 Mentions, Select, Upload 또는 복합 입력을 처음 사용하거나 키보드만으로 탐색한다
- **THEN** label, placeholder, trigger, 검색·empty·loading 상태가 명확하고 다음 가능한 행동이 시각·보조기술에 함께 전달된다

### Requirement: 접근 가능한 키보드 흐름을 제공한다

입력과 overlay 컴포넌트는 label, description, required, validation, visible focus, Escape dismiss, 올바른 native 또는 dialog semantics를 제공해야 한다(MUST).

#### Scenario: 필수 필드 검증에 실패한다

- **WHEN** 사용자가 필수 필드를 비워 제출한다
- **THEN** 오류가 해당 field와 보조기술에 연결되고 첫 오류 field로 focus가 이동한다

### Requirement: 컴포넌트 완료는 동작 테스트로 증명한다

각 public 컴포넌트는 기본 사용, 주요 prop 변경, 사용자 이벤트, disabled/loading/error 경계를 검증하는 테스트를 가져야 한다(MUST). 테스트가 없는 컴포넌트는 구현 완료로 간주하지 않는다(MUST NOT).

#### Scenario: 컴포넌트의 prop과 이벤트를 검증한다

- **WHEN** 테스트가 사용자의 클릭·키보드·입력 이벤트를 실행하고 public prop을 변경한다
- **THEN** 화면 상태와 callback 결과가 기대한 값으로 변경되고 잘못된 상태에서는 작업이 차단된다
