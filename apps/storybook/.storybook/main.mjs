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
    return {
      ...config,
      define: {
        ...(config.define ?? {}),
        "process.env": {}
      }
    };
  },
  docs: {
    autodocs: "tag"
  }
};

export default config;
