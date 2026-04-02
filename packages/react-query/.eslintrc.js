/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["plugin:@tanstack/eslint-plugin-query/recommended", "@repo/eslint-config/next.js"],
  plugins: ["@tanstack/query"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off", // any 사용 금지
    "@tanstack/query/exhaustive-deps": "error",
    "@tanstack/query/no-rest-destructuring": "warn",
    "@tanstack/query/stable-query-client": "error",
    "@typescript-eslint/naming-convention": "off"
  }
};
