## Purpose

공용 컴포넌트의 metadata를 단일 manifest로 관리하고, 컴포넌트 변경 시 일관된 Storybook 문서와 품질 검사를 자동으로 만든다. 작업 종료 시 전체 재생성과 coverage 검사를 수행한다.

## ADDED Requirements

### Requirement: manifest가 Storybook 생성의 단일 입력이다

각 public component는 category, export path, 표시명, 기본 args, Controls 타입을 manifest에 등록해야 한다(MUST).

#### Scenario: 컴포넌트가 추가된다

- **WHEN** public component와 metadata를 등록하고 생성 명령을 실행한다
- **THEN** 해당 컴포넌트의 Playground와 Controls story가 정해진 경로에 생성된다

### Requirement: 생성 결과의 drift를 검증한다

생성기는 동일한 manifest에 대해 결정적인 결과를 내야 하며(MUST), 생성 파일이 없거나 수동 변경되면 check 명령이 실패해야 한다(MUST).

#### Scenario: 생성 story가 오래되었다

- **WHEN** manifest 또는 generated story가 서로 일치하지 않는다
- **THEN** check 명령은 누락·불일치 파일을 표시하고 실패한다

### Requirement: 복잡한 상호작용 story를 확장할 수 있다

생성된 기본 Playground와 별도로 Table, Form, Tree, Upload처럼 상호작용이 복잡한 컴포넌트는 custom story를 추가할 수 있어야 한다(MUST).

#### Scenario: 생성 후 상호작용을 추가한다

- **WHEN** custom story가 생성 story와 다른 파일에 작성된다
- **THEN** 두 문서는 충돌 없이 함께 노출되고 generated 파일은 수동 수정 없이 재생성된다
