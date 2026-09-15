## 1. 기반 계약

- [x] 1.1 공통 size, variant, status, disabled, loading, readOnly, controlled/uncontrolled 타입을 정의하고 UI typecheck로 검증한다
- [x] 1.2 public export inventory와 component metadata manifest 구조를 만들고 누락 검사로 검증한다. 구현 중인 컴포넌트도 `status: draft`로 등록할 수 있다

## 2. Data Entry

- [x] 2.1 입력·검색 batch: InputNumber, AutoComplete, Cascader, Mentions, Password, Search를 구현하고 min/max/step/search/clear/keyboard 실제 동작 테스트를 통과한다
- [x] 2.2 Form batch: Form validation model과 required/error/submit focus/reset/initialValues 실제 동작 테스트를 통과한다
- [x] 2.3 선택·파일 batch: TreeSelect, Rate, Upload, Transfer를 구현하고 controlled value, disabled, loading, empty/error 실제 동작 테스트를 통과한다
- [x] 2.4 날짜·시간 batch: DatePicker, TimePicker, RangePicker, ColorPicker를 구현하고 format, disabled date/time, clear, keyboard 실제 동작 테스트를 통과한다

## 3. Navigation and Feedback

- [x] 3.1 Navigation batch: Pagination, Steps, Segmented, Menu, Breadcrumb, Anchor, BackTop을 구현하고 실제 keyboard/narrow viewport 테스트를 통과한다
- [x] 3.2 Overlay batch: Modal, Drawer, Popconfirm, Tour, FloatButton을 구현하고 실제 focus/Escape/placement 테스트를 통과한다
- [x] 3.3 Feedback batch: Message, Notification, Alert, Result, Empty, Progress, Skeleton, Spin을 구현하고 실제 aria-live/dismiss/loading 상태 테스트를 통과한다

## 4. Data Display

- [x] 4.1 Data interaction batch: Table과 Tree의 column, sort/filter, selection, expand, pagination, loading/empty/error 실제 계약을 구현하고 fixture interaction을 통과한다
- [x] 4.2 Data presentation batch: List, Descriptions, Statistic, Tag, Badge, Avatar, Timeline, Calendar, Carousel, Image, Watermark를 구현하고 실제 긴 콘텐츠/좁은 화면 테스트를 통과한다
- [x] 4.3 virtualizable list와 Chart 경계를 정의하고 50개 이상 row rendering 및 bundle check를 검증한다

## 5. Storybook generation and quality gates

- [x] 5.1 manifest 기반 Storybook generator와 deterministic drift check를 구현하고 batch 종료 시 affected story를 자동 생성하며, 최종 단계에서 전체 public export와 generated story coverage를 검증한다
- [x] 5.2 구현 완료 컴포넌트 전체의 기본 Playground와 Controls를 일괄 생성하고 복합 컴포넌트 custom interaction story를 연결한다
- [x] 5.3 light/dark, focus-visible, keyboard-only, reduced-motion, narrow viewport, long-content audit을 실행한다
- [x] 5.4 UI lint/typecheck, Storybook lint/typecheck/build, export check 및 OpenSpec strict validation을 통과한다
- [x] 5.5 전체 public component UI/UX audit을 실행하고 Modal/Drawer footer, 복합 입력 affordance, 긴 콘텐츠, narrow viewport, dark mode, focus-visible, keyboard-only, reduced-motion 문제를 기능군 단위로 수정한다
