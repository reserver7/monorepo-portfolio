/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  stories: ["../../../packages/ui/stories/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  async viteFinal(config) {
    const ignoreWarnings = [
      "Module level directives cause errors when bundled",
      "Can't resolve original location of error."
    ];

    return {
      ...config,
      define: {
        ...(config.define ?? {}),
        "process.env": {}
      },
      build: {
        ...(config.build ?? {}),
        rollupOptions: {
          ...(config.build?.rollupOptions ?? {}),
          onwarn(warning, warn) {
            const message = warning?.message ?? "";
            if (ignoreWarnings.some((text) => message.includes(text))) return;
            warn(warning);
          }
        }
      }
    };
  },
  docs: {
    autodocs: "tag"
  }
};

export default config;
