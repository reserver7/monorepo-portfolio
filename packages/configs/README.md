# @repo/configs

모노레포 공통 설정 패키지입니다.

## 제공 preset

- Next: `@repo/configs/next/create-config`
- Tailwind: `@repo/configs/tailwind.config`, `@repo/configs/tailwind/create-app-config`
- PostCSS: `@repo/configs/postcss.config`
- Prettier: `@repo/configs/prettier.config`
- TypeScript: `@repo/configs/typescript/*`

## 특징

- `createNextConfig`는 `transpilePackages`, `allowedDevOrigins`, `webpack alias(@)`를 기본 제공
- `createAppTailwindConfig`는 앱/공용 패키지 content 경로를 공통으로 포함
- 신규 앱 템플릿(`templates/next-app`)은 본 패키지 엔트리만 참조하도록 구성되어 상대경로 의존이 없습니다.
