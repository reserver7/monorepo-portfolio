import nextPlugin from "@next/eslint-plugin-next";
import { createWorkspaceEslintConfigWithOptions } from "./base.js";

export const createNextAppEslintConfig = (appDir = process.cwd(), options = {}) => {
  const workspaceConfig = createWorkspaceEslintConfigWithOptions({
    noExplicitAny: options.noExplicitAny ?? "off",
    additionalIgnores: options.additionalIgnores ?? []
  });

  return [
    ...workspaceConfig,
    {
      files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}"],
      plugins: {
        "@next/next": nextPlugin
      },
      settings: {
        next: {
          rootDir: appDir
        }
      },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs["core-web-vitals"].rules,
        "@next/next/no-html-link-for-pages": "off",
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["~/*"],
                message:
                  "모노레포 규칙상 alias는 '@/*'(앱 로컬) 또는 '@repo/*'(워크스페이스 패키지)만 사용하세요."
              }
            ]
          }
        ]
      }
    }
  ];
};

export default createNextAppEslintConfig;
