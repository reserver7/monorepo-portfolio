import type { Config } from "tailwindcss";
import { createAppTailwindConfig } from "../../packages/configs/src/tailwind/create-app-tailwind-config";

const config: Config = createAppTailwindConfig({
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.15), 0 24px 80px rgba(8, 145, 178, 0.2)"
      }
    }
  }
});

export default config;
