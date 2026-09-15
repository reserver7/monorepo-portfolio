## 1. Inventory and shared contracts

- [x] 1.1 public export, manifest, generated story를 전수 대조하고 중복·누락·미노출 목록을 작성한 뒤 inventory check로 재현 가능하게 검증한다
- [x] 1.2 공통 size, variant, status, disabled, loading, focus, controlled/uncontrolled 계약과 breaking API matrix를 정리하고 UI typecheck로 검증한다
- [x] 1.3 semantic color/state token과 spacing, radius, typography, motion 사용 규칙을 재정의하고 token lint 및 dark-mode contrast check를 통과시킨다

## 2. Component UX audit and rebuild

- [x] 2.1 입력·선택 batch(Input, InputNumber, Select, AutoComplete, Cascader, Mentions, Date/Time, ColorPicker, Rate, Slider, Switch, Radio, Checkbox, Upload, Transfer)를 일괄 감사·수정하고 props interaction 및 keyboard audit을 통과한다
- [x] 2.2 navigation batch(Tabs, Segmented, Steps, Menu, Breadcrumb, Anchor, Pagination, BackTop)를 역할 기반 API와 시각 언어로 재정의하고 overlap/narrow viewport/keyboard test를 통과한다
- [x] 2.3 overlay·feedback batch(Modal, Drawer, Popconfirm, Tour, FloatButton, Alert, Message, Notification, Progress, Skeleton, Spin, Empty, Result)를 일괄 수정하고 focus/Escape/footer/aria-live/dismiss test를 통과한다
- [x] 2.4 data display·media·layout batch(Table, Tree, TreeSelect, List, Descriptions, Statistic, Tag, Badge, Avatar, Timeline, Calendar, Carousel, Image, Watermark 및 layout primitive)를 일괄 수정하고 긴 콘텐츠/empty/loading/error/dark-mode audit을 통과한다
- [x] 2.5 중복 component와 중복 props를 제거·통합하고 내부 사용처를 public API로 전환한 뒤 전체 workspace typecheck와 lint를 통과한다

## 3. Storybook and coverage

- [x] 3.1 manifest와 generator를 public export coverage의 단일 계약으로 정리하고 Popconfirm 포함 전체 generated story를 일괄 재생성한다
- [x] 3.2 각 기능군의 Playground Controls가 실제 props를 변경하도록 fixture를 정비하고 복합 interaction story를 별도 custom story로 연결한 뒤 storybook check를 통과한다
- [x] 3.3 public export ↔ manifest ↔ generated story deterministic drift check를 실행해 누락 0건과 중복 0건을 검증한다

## 4. Full-system verification

- [x] 4.1 390px narrow viewport, 긴 콘텐츠, empty/loading/error, dark mode, focus-visible, keyboard-only, reduced-motion 전수 audit을 실행하고 실패 0건을 확인한다
- [x] 4.2 UI typecheck/lint, Storybook typecheck/lint/build, manifest check, generated story check 및 OpenSpec strict validation을 통과한다
- [x] 4.3 변경된 main spec을 sync하고 전체 tasks 완료 상태와 archive 전 검증 결과를 기록한다
