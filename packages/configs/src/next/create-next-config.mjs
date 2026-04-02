import path from "node:path";

/**
 * @param {string} appDir absolute app directory (usually __dirname in app next.config.mjs)
 * @param {import("next").NextConfig} [override]
 * @returns {import("next").NextConfig}
 */
export function createNextConfig(appDir, override = {}) {
  const baseConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: path.join(appDir, "../.."),
    transpilePackages: [
      "@repo/ui",
      "@repo/utils",
      "@repo/forms",
      "@repo/theme",
      "@repo/react-query",
      "@repo/zustand"
    ],
    images: {
      formats: ["image/avif", "image/webp"],
      minimumCacheTTL: 60,
      deviceSizes: [640, 750, 828, 1080, 1200, 1920],
      imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384]
    },
    webpack(config, context) {
      config.resolve ??= {};
      config.resolve.alias ??= {};
      config.resolve.alias["@"] = appDir;

      if (typeof override.webpack === "function") {
        return override.webpack(config, context);
      }

      return config;
    }
  };

  return {
    ...baseConfig,
    ...override,
    images: {
      ...baseConfig.images,
      ...(override.images ?? {})
    },
    webpack: baseConfig.webpack
  };
}
