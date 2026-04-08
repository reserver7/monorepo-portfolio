import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "../../../../index";

type SkeletonStoryArgs = {
  variant: "rectangular" | "rounded" | "circular" | "text";
  size: "xs" | "sm" | "md" | "lg";
  color: "default" | "muted" | "subtle";
  animation: "pulse" | "none";
  speed: "slow" | "normal" | "fast";
  lines: number;
  lastLineWidth: string;
  fullWidth: boolean;
};

const meta: Meta<SkeletonStoryArgs> = {
  title: "Components/Skeleton",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    variant: "text",
    size: "md",
    color: "default",
    animation: "pulse",
    speed: "normal",
    lines: 3,
    lastLineWidth: "60%",
    fullWidth: true
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["text", "rounded", "rectangular", "circular"] },
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] },
    color: { control: "inline-radio", options: ["default", "muted", "subtle"] },
    animation: { control: "inline-radio", options: ["pulse", "none"] },
    speed: { control: "inline-radio", options: ["slow", "normal", "fast"] },
    lines: { control: { type: "number", min: 1, max: 8, step: 1 } },
    lastLineWidth: { control: "text" },
    fullWidth: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<SkeletonStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-xl space-y-3">
      <Skeleton
        variant={args.variant}
        size={args.size}
        color={args.color}
        animation={args.animation}
        speed={args.speed}
        lines={args.lines}
        lastLineWidth={args.lastLineWidth}
        fullWidth={args.fullWidth}
      />
    </div>
  )
};


