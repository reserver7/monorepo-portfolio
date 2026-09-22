## Why

`collab-web`은 OpsLens의 기존 인증 계정과 연결되지 않아 협업 화면을 보호할 수 없다. OpsLens를 단일 인증 원장으로 유지하고 Collab에는 별도 세션만 발급한다.

## What Changes

- OpsLens가 짧은 수명의 서명 브리지 토큰을 발급하고 교환한다.
- Collab 로그인 진입점을 OpsLens 로그인으로 연결한다.
- Collab은 교환 결과를 HttpOnly 세션 쿠키로 저장한다.
- `/docs`와 `/whiteboard`를 비인증 사용자에게서 보호하고 로그아웃을 제공한다.

## Capabilities

### New Capabilities

- `user-auth`: OpsLens 인증 브리지, Collab 세션 및 보호 라우트

## Impact

- `apps/opslens-web` 브리지 endpoint와 공유 secret 설정
- `apps/collab-web` 로그인 callback, middleware, 로그아웃 및 환경변수
- 기존 `/docs`와 `/whiteboard`의 비인증 접근 동작
