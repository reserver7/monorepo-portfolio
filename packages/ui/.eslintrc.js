/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/next.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@next/next/no-html-link-for-pages": "off",
  },
};
