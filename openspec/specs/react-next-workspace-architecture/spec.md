# React Next Workspace Architecture Specification

## Purpose

React/Next 애플리케이션과 monorepo 설정의 실행 경계와 계약을 일관되게 관리하여 초기 로딩, hydration, 빌드 재현성과 신규 앱 확장성을 보장한다.

## Requirements

### Requirement: React/Next 앱의 국제화 경계는 재사용 가능해야 한다

각 Next 앱은 locale 목록, 기본 locale, 메시지 로딩, 요청 locale 해석 및 client provider를 명시적인 설정 경계로 제공해야 하며(MUST), 새로운 앱 템플릿은 동일한 계약을 재사용할 수 있어야 한다(MUST). 서버 전용 메시지 로딩과 client bundle 메시지 로딩은 필요한 범위만 포함해야 한다(MUST).

#### Scenario: 새 Next 앱을 생성한다

- **WHEN** workspace template에서 새 Next 앱을 생성한다
- **THEN** locale 설정, 메시지 디렉터리, 서버 요청 설정, client provider 및 검증 명령이 추가 수동 작업 없이 연결된다.

#### Scenario: 서버 route를 렌더링한다

- **WHEN** 서버 컴포넌트가 locale 메시지나 metadata를 필요로 한다
- **THEN** 요청 locale에 맞는 메시지를 서버에서 로드하고 client 전용 전체 메시지 bundle을 불필요하게 포함하지 않는다.

#### Scenario: client locale을 전환한다

- **WHEN** client component에서 locale을 변경한다
- **THEN** provider와 저장 상태가 동일한 locale을 사용하고 현재 route의 interactive state를 깨뜨리지 않는다.

### Requirement: React와 Next 실행 경계는 의도적으로 분리된다

앱과 패키지는 Server/Client Component 경계를 필요한 최소 범위로 유지해야 하며(MUST), 서버에서 처리할 수 있는 데이터 조회와 렌더링을 불필요하게 Client Component로 전파해서는 안 된다(MUST NOT). route loading, error, not-found 및 hydration 계약은 사용자 상태를 보존해야 하며(MUST), 각 앱은 Client 경계와 초기 client module 비용을 측정·검토할 수 있어야 한다(MUST).

#### Scenario: 서버 렌더링 가능한 화면을 로드한다

- **WHEN** 화면이 브라우저 이벤트나 client-only API를 요구하지 않는다
- **THEN** 해당 화면과 데이터 조회는 Client Component 경계를 불필요하게 추가하지 않고 서버 경로에서 렌더링된다.

#### Scenario: client-only 기능을 사용한다

- **WHEN** 화면이 브라우저 API, interactive state 또는 event handler를 요구한다
- **THEN** `use client` 경계는 해당 기능에 필요한 subtree에만 적용되고 초기 route 전체로 전파되지 않는다.

#### Scenario: client boundary 비용을 검토한다

- **WHEN** 공통 provider 또는 화면 컴포넌트가 Client Component 경계를 추가하거나 확장한다
- **THEN** 변경자는 초기 route bundle에 포함되는 모듈과 서버 렌더링 가능한 대안을 확인하고 검증 결과를 남긴다.

### Requirement: Next route와 데이터 로딩은 초기 비용을 통제한다

Next 앱은 route별 loading/error 경계를 제공해야 하며(MUST), 독립적인 서버 요청은 불필요한 waterfall 없이 처리해야 한다(MUST). 사용하지 않은 무거운 client 기능과 비핵심 third-party 리소스는 초기 route bundle 또는 hydration을 차단해서는 안 되며(MUST NOT), 각 앱은 route별 production bundle을 분석하고 회귀를 확인할 수 있어야 한다(MUST).

#### Scenario: 독립 데이터를 함께 조회한다

- **WHEN** 화면이 서로 의존하지 않는 복수의 서버 데이터를 요구한다
- **THEN** 요청은 순차 waterfall 없이 병렬 처리되고 각 실패 상태가 일관된 error 경계로 전달된다.

#### Scenario: 무거운 기능을 열지 않는다

- **WHEN** 사용자가 차트, 편집기, overlay 같은 무거운 기능을 아직 열지 않았다
- **THEN** 해당 기능의 client module은 초기 route 경로에서 로드되지 않는다.

#### Scenario: 비핵심 리소스를 지연한다

- **WHEN** 이미지, 폰트, 분석 또는 로그 리소스가 첫 interaction에 필요하지 않다
- **THEN** 필요한 우선순위와 캐시 정책을 사용하고 초기 화면의 렌더링·hydration을 불필요하게 차단하지 않는다.

#### Scenario: production bundle을 검토한다

- **WHEN** 개발자 또는 CI가 두 Next 앱의 bundle analysis 명령을 실행한다
- **THEN** 앱별 route/chunk 결과가 생성되고, 이전 기준과 비교 가능한 형태로 확인되며, 분석 실패는 성공으로 처리되지 않는다.

### Requirement: workspace 설정과 package 계약은 단일 기준을 따른다

Next, TypeScript, ESLint, Tailwind, PostCSS, Turbo, pnpm workspace 및 앱 template 설정은 중복·drift 없이 중앙 기준과 명시적 예외를 사용해야 하며(MUST). package의 exports, private/public 범위, dependency와 peerDependency는 실제 사용 계약과 일치해야 하고(MUST), `transpilePackages`는 소스 변환이 필요한 workspace package에만 적용되어야 하며(MUST), 공통 패키지 import는 실제 사용 모듈만 번들에 포함되도록 분석 가능한 경계를 제공해야 한다(MUST).

#### Scenario: 새 Next 앱을 생성한다

- **WHEN** template에서 새 앱을 생성한다
- **THEN** 실제 앱과 동일한 compiler, lint, styling, Next runtime 기준을 사용하며 수동 보정이 필요하지 않다.

#### Scenario: package를 소비한다

- **WHEN** 앱이 workspace package를 import한다
- **THEN** 공개 export와 dependency 경계가 import 경로와 일치하고 사용하지 않는 직접 dependency가 설치되지 않는다.

#### Scenario: 공통 package를 일부만 사용한다

- **WHEN** 앱이 UI 또는 icon package의 일부 모듈만 사용한다
- **THEN** bundle 분석 결과에 사용하지 않은 모듈 전체가 초기 route 비용으로 포함되지 않으며, import 경계는 package contract와 일치한다.

#### Scenario: workspace package를 transpile한다

- **WHEN** 앱이 workspace package를 build 대상에 포함한다
- **THEN** 해당 package가 실제로 소스 변환을 필요로 하는지에 따라 `transpilePackages`가 최소 범위로 설정되고, 불필요한 package의 변환 비용은 포함되지 않는다.

### Requirement: JSON 기반 계약은 schema와 환경별 일관성을 가진다

i18n, component manifest, generated metadata 및 환경 설정 JSON은 schema 검증을 통과해야 하며(MUST), locale 간 필수 key와 생성 원본의 계약을 유지해야 한다(MUST). JSON을 임의의 코드 설정 저장소로 사용해서는 안 된다(MUST NOT).

#### Scenario: locale를 추가하거나 변경한다

- **WHEN** 한 locale의 메시지 JSON이 변경된다
- **THEN** 필수 key parity, 값 타입 및 중복 key 검사가 실행되어 누락·오탈자를 차단한다

#### Scenario: manifest를 생성한다

- **WHEN** 컴포넌트나 package export가 변경된다
- **THEN** generated JSON과 실제 export의 차이가 검증 단계에서 감지되고 재생성 또는 명시적 승인 없이는 통과하지 않는다

### Requirement: 구조 및 성능 변경은 앱 단위로 검증된다

React/Next 및 설정 리팩토링은 기존 route 동작, 접근성, SEO/headers, 환경별 build 결과를 보존해야 하며(MUST). 변경 후 lint, typecheck, build, bundle analysis와 대표적인 좁은 viewport 및 runtime smoke 검증을 통과해야 한다(MUST).

#### Scenario: production build를 실행한다

- **WHEN** 각 Next 앱과 template의 production build를 실행한다
- **THEN** type error, hydration error, route 누락과 설정 충돌 없이 완료되고 bundle 분석 결과가 생성된다.

#### Scenario: 좁은 화면에서 route를 사용한다

- **WHEN** 주요 route를 390px viewport에서 로드하고 keyboard/pointer interaction을 수행한다
- **THEN** 가로 overflow, 잘린 action, hydration 오류 없이 사용할 수 있다.

#### Scenario: 성능 리팩토링 후 public 동작을 사용한다

- **WHEN** 동적 로딩 또는 import 구조가 변경된 route에서 주요 interaction을 수행한다
- **THEN** loading, error, empty, callback 및 접근성 상태가 변경 전 계약과 동일하게 동작한다.
