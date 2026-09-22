## Context

`collab-web`은 Next.js App Router 기반이고 OpsLens는 Prisma 사용자 테이블과 자체 JWT/refresh token을 사용한다. 기존 OpsLens 인증을 단일 사용자 원장으로 유지하면서 두 앱의 로그인 주체를 연결한다.

## Goals / Non-Goals

**Goals:**

- OpsLens의 기존 인증을 단일 사용자 원장으로 유지한다.
- OpsLens 로그인으로 진입하는 브리지와 Collab 로그아웃을 제공한다.
- Collab 세션을 HttpOnly 쿠키로 유지하고 보호 경로를 차단한다.

**Non-Goals:**

- OAuth provider, MFA, 조직/역할 권한, 사용자 프로필 테이블
- 협업 서버 API의 별도 토큰 인증 개편
- Collab의 별도 회원가입·비밀번호 저장

## Decisions

- **OpsLens bridge 권위:** OpsLens가 사용자와 역할을 검증하고 Collab은 비밀번호를 처리하지 않는다.
- **서명된 짧은 토큰:** OpsLens가 공유 secret으로 서명한 2분 토큰을 발급하고 Collab 서버가 교환 endpoint로 검증한다.
- **Collab 세션:** 교환된 결과를 Collab의 HttpOnly 쿠키로 저장하고 middleware에서 검증한다.
- **Middleware 보호:** `/docs`와 `/whiteboard`를 한 곳에서 보호한다.

## Risks / Trade-offs

- [환경변수 누락] → `.env.local.example`에 양쪽 앱의 secret과 URL을 기록한다.
- [브리지 토큰 탈취] → 짧은 만료 시간, 공유 secret 검증 및 HttpOnly 쿠키를 사용한다.
- [기존 공개 링크 영향] → 배포 전에 비인증 리디렉션과 기존 OpsLens 로그인 연계를 확인한다.

## Migration Plan

1. OpsLens와 Collab에 같은 브리지 secret을 설정한다.
2. Collab의 로그인, 새로고침, 로그아웃 및 비인증 접근을 확인한다.
3. 운영 도메인으로 `COLLAB_WEB_URL`과 `OPSLENS_WEB_URL`을 교체한다.
