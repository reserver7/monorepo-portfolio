## 1. OpsLens bridge 연결

- [x] 1.1 OpsLens에 짧은 수명의 브리지 발급·검증 endpoint를 추가하고 기존 Auth 테스트를 통과시킨다
- [x] 1.2 Collab에 브리지 callback과 HttpOnly 세션 cookie를 추가하고 typecheck를 통과시킨다
- [x] 1.3 Collab의 로그인 진입점을 OpsLens로 연결하고 비밀번호 처리를 제거한다

## 2. 인증 흐름

- [x] 2.1 Collab 로그아웃으로 자체 세션만 삭제하고 로그인 진입점으로 이동시킨다
- [x] 2.2 `/docs` 및 `/whiteboard` 비인증 리디렉션을 구현하고 보호 경로 테스트를 통과시킨다

## 3. 통합 검증

- [x] 3.1 로컬 환경에서 OpsLens 로그인, Collab 진입, 새로고침 세션 유지, 로그아웃을 확인한다
- [x] 3.2 `openspec validate --strict`, 관련 lint, typecheck 및 build를 통과시킨다
