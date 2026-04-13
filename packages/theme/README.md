# @repo/theme

프로젝트 공통 테마/프로바이더 패키지입니다.

## 제공 기능

- `AppThemeProvider`
- `AppProviders`, `createAppProviders`
- `ThemeToggle`
- `AppHead` (테마 부트스트랩, 폰트 preload 옵션)
- `createAppMetadata`, `createEntityMetadata`

## 유틸

- `normalizeTheme`
- `buildThemeCookie`

## 원칙

- 기본 테마는 `light`
- 시스템 테마 자동 감지는 비활성화(`enableSystem=false`)
- 앱 간 이동 시 쿠키/쿼리/window.name 브릿지로 테마 동기화
- canonical/og URL은 앱 URL 기준으로 정규화하여 일관성 유지
