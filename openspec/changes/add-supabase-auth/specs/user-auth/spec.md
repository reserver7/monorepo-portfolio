## Purpose

`collab-web` 사용자가 OpsLens 계정으로 로그인하고 세션을 유지하며, 인증되지 않은 사용자가 협업 문서와 화이트보드에 접근하지 못하도록 한다.

## ADDED Requirements

### Requirement: OpsLens authentication bridge

`collab-web`은 사용자 비밀번호를 직접 보관하거나 검증하지 않고 OpsLens 인증 결과를 신뢰해야 한다(SHALL). 브리지 토큰은 짧은 만료 시간과 공유 비밀 검증을 가져야 한다(MUST).

#### Scenario: Existing OpsLens session enters Collab

- **WHEN** OpsLens에 로그인한 사용자가 Collab 접근을 시작한다
- **THEN** OpsLens는 검증 가능한 브리지 토큰으로 사용자를 Collab으로 돌려보내고 Collab은 HttpOnly 세션을 만든다

#### Scenario: Unauthenticated bridge request

- **WHEN** OpsLens 세션이 없는 사용자가 브리지에 접근한다
- **THEN** 사용자는 OpsLens 로그인 화면으로 이동한 뒤 원래 Collab 경로로 돌아온다

#### Scenario: Invalid or expired bridge token

- **WHEN** Collab이 만료되었거나 서명이 유효하지 않은 브리지 토큰을 받는다
- **THEN** Collab은 세션을 만들지 않고 로그인 화면으로 이동시킨다

### Requirement: Collab sign-out

Collab 로그아웃은 Collab 세션 쿠키를 폐기해야 하며(MUST), OpsLens의 기존 인증 저장소를 삭제하지 않아야 한다(SHALL).

#### Scenario: Sign out from Collab

- **WHEN** 사용자가 Collab에서 로그아웃한다
- **THEN** Collab 세션 쿠키가 삭제되고 로그인 진입점으로 이동한다

### Requirement: Session persistence

유효한 Collab HttpOnly 세션 쿠키를 가진 사용자는 새로고침 후에도 보호된 화면을 이용할 수 있어야 한다(SHALL).

#### Scenario: Returning authenticated user

- **WHEN** 유효한 세션 쿠키를 가진 사용자가 `/docs`를 새로고침한다
- **THEN** 로그인 화면으로 이동하지 않고 문서를 렌더링한다

### Requirement: Protected collaboration routes

인증되지 않은 `/docs` 및 `/whiteboard` 접근은 로그인 진입점으로 리디렉션해야 한다(MUST). 유효한 세션 요청은 요청한 협업 화면을 렌더링해야 한다(SHALL).

#### Scenario: Unauthenticated protected route request

- **WHEN** 인증되지 않은 사용자가 `/docs` 또는 `/whiteboard`를 요청한다
- **THEN** 로그인 진입점으로 리디렉션한다
