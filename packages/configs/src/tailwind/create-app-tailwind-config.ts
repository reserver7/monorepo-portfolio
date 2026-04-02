import type { Config } from "tailwindcss";
import sharedConfig from "./tailwind.config";

type AppTailwindOverride = Omit<Config, "content" | "presets">;

const sharedContent: NonNullable<Config["content"]> = [
  "./app/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./features/**/*.{ts,tsx}",
  "./hooks/**/*.{ts,tsx}",
  "./lib/**/*.{ts,tsx}",
  "./stores/**/*.{ts,tsx}",
  "./providers/**/*.{ts,tsx}",
  "./styles/**/*.{ts,tsx}",
  "../../packages/ui/components/**/*.{ts,tsx}",
  "../../packages/ui/layouts/**/*.{ts,tsx}",
  "../../packages/ui/hooks/**/*.{ts,tsx}",
  "../../packages/ui/styles/**/*.{ts,tsx}",
  "../../packages/ui/index.ts",
  "../../packages/forms/src/**/*.{ts,tsx}",
  "../../packages/forms/index.ts",
  "../../packages/theme/src/**/*.{ts,tsx}",
  "../../packages/theme/index.ts"
];

export const createAppTailwindConfig = (override: AppTailwindOverride = {}): Config => {
  return {
    content: sharedContent,
    presets: [sharedConfig],
    ...override
  };
};
