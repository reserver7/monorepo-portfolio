import type { Config } from "tailwindcss";

export declare const DEFAULT_TAILWIND_CONTENT: string[];

export interface CreateTailwindConfigOptions {
  content?: string[];
  themeExtend?: Record<string, unknown>;
  plugins?: Config["plugins"];
}

export declare const createTailwindConfig: (options?: CreateTailwindConfigOptions) => Config;
