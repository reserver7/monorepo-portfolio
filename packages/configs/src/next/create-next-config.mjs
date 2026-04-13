import path from "node:path";

const DEFAULT_TRANSPILE_PACKAGES = [
  "@repo/ui",
  "@repo/utils",
  "@repo/forms",
  "@repo/theme",
  "@repo/react-query",
  "@repo/zustand"
];

const DEFAULT_ALLOWED_DEV_ORIGINS = ["localhost", "127.0.0.1"];

const mergeArrayUnique = (base = [], override = []) => Array.from(new Set([...base, ...override]));

/**
 * @param {string} appDir absolute app directory (usually __dirname in app next.config.mjs)
 * @param {import("next").NextConfig} [override]
 * @returns {import("next").NextConfig}
 */
export function createNextConfig(appDir, override = {}) {
  const baseConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: path.join(appDir, "../.."),
    transpilePackages: DEFAULT_TRANSPILE_PACKAGES,
    allowedDevOrigins: DEFAULT_ALLOWED_DEV_ORIGINS,
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
      return config;
    }
  };

  const overrideWebpack = typeof override.webpack === "function" ? override.webpack : null;
  const mergedWebpack = (config, context) => {
    const baseWebpackResult = baseConfig.webpack(config, context);
    return overrideWebpack ? overrideWebpack(baseWebpackResult, context) : baseWebpackResult;
  };

  return {
    ...baseConfig,
    ...override,
    transpilePackages: mergeArrayUnique(baseConfig.transpilePackages, override.transpilePackages),
    allowedDevOrigins: mergeArrayUnique(baseConfig.allowedDevOrigins, override.allowedDevOrigins),
    images: {
      ...baseConfig.images,
      ...(override.images ?? {})
    },
    webpack: mergedWebpack
  };
}
