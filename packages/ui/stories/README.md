# UI Stories Guide

디자인시스템 스토리 구조 가이드입니다.

## 계층

1. `foundations`
- 색상/타이포그래피 토큰
- 스토리북 사이드바 최상단 고정

2. `components`
- 단일 컴포넌트 스토리
- `generated/*`는 컴포넌트 공개 API 기반 자동 생성

3. `patterns`
- 실제 화면 조합 패턴

## 규칙

- 스토리 import는 `@repo/ui` 공개 API만 사용
- generated 파일은 수동 편집하지 않음
- 컴포넌트 변경 후 아래 명령 실행

```bash
pnpm storybook:gen
pnpm storybook:check
```
