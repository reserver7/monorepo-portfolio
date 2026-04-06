import type { Meta, StoryObj } from "@storybook/react";
import { SemanticColorTokenView } from "./_color-token-view";

const meta: Meta = {
  title: "Foundations/Colors/Semantic Tokens",
  parameters: {
    layout: "padded"
  }
};

export default meta;
type Story = StoryObj;

export const Showcase: Story = {
  render: () => <SemanticColorTokenView />
};
