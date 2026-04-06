import type { Config } from "tailwindcss";
import sharedConfig from "@repo/configs/tailwind.config";

const config: Config = {
  presets: [sharedConfig],
  content: [
    "./.storybook/**/*.{ts,tsx,js,mjs}",
    "../../packages/ui/components/**/*.{ts,tsx}",
    "../../packages/ui/layouts/**/*.{ts,tsx}",
    "../../packages/ui/hooks/**/*.{ts,tsx}",
    "../../packages/ui/stories/**/*.{ts,tsx,mdx}"
  ]
};

export default config;
