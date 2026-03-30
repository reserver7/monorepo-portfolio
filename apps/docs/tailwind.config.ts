import type { Config } from "tailwindcss";
import { createTailwindConfig } from "@repo/tailwind-config";

const config: Config = createTailwindConfig({
  themeExtend: {
    boxShadow: {
      glow: "0 0 0 1px rgba(255,255,255,0.15), 0 24px 80px rgba(8, 145, 178, 0.2)"
    }
  }
});

export default config;
