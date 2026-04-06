import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "../../../../index";

const isRenderableNode = (value: unknown): boolean => {
  if (value == null) return true;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
  if (React.isValidElement(value)) return true;
  if (Array.isArray(value)) return value.every(isRenderableNode);
  return false;
};

const sanitizeStoryArgs = (args: Record<string, unknown>): Record<string, unknown> => {
  const next = { ...args };
  for (const key of ["children","leftIcon","rightIcon","prefix","suffix","label","helperText","errorMessage","title","description","helper"]) {
    if (!isRenderableNode(next[key])) delete next[key];
  }
  return next;
};

const meta: Meta<typeof Skeleton> = {
  title: "Components/Generated/Feedback/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { expanded: true, exclude: [
  "className",
  "containerClassName",
  "labelClassName",
  "helperClassName",
  "optionClassName",
  "optionLabelClassName",
  "optionDescriptionClassName",
  "style",
  "id",
  "name",
  /^on[A-Z].*/,
  /.*ClassName$/
] }
  },
  argTypes: {
    children: { control: false },
    asChild: { control: false },
    leftIcon: { control: false },
    rightIcon: { control: false }
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-lg rounded-xl border border-default bg-surface p-4">
      <Skeleton
        {...sanitizeStoryArgs(args as Record<string, unknown>)}
     />
    </div>
  )
};
