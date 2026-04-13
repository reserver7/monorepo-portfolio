# @repo/eslint-config

워크스페이스 공통 ESLint 설정 패키지입니다.

## exports

- `@repo/eslint-config/base`
- `@repo/eslint-config/library`
- `@repo/eslint-config/next`
- `@repo/eslint-config/strict`

## 사용

- 기본(완화): `no-explicit-any: off`
- strict 프로필: `no-explicit-any: warn`

필요 시 `library/next` 팩토리에 옵션을 전달해 `additionalIgnores`, `noExplicitAny`를 조정할 수 있습니다.
