import type { Meta, StoryObj } from "@storybook/react";
import { PrimitiveColorTokenView } from "./_color-token-view";

const meta: Meta = {
  title: "Foundations/Colors/Primitive Palette",
  parameters: {
    layout: "padded"
  }
};

export default meta;
type Story = StoryObj;

export const Showcase: Story = {
  render: () => <PrimitiveColorTokenView />
};
