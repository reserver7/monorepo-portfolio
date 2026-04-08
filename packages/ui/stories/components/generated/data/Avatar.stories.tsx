import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../../index";

type AvatarStoryArgs = {
  name: string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  shape: "circle" | "rounded" | "square";
  color: "default" | "primary" | "success" | "warning" | "danger";
  showStatus: boolean;
  status: "online" | "offline" | "away" | "busy";
};

const meta: Meta<AvatarStoryArgs> = {
  title: "Components/Avatar",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    name: "게스트-923",
    size: "md",
    shape: "circle",
    color: "default",
    showStatus: true,
    status: "online"
  }
};

export default meta;
type Story = StoryObj<AvatarStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback color={args.color}>
        <UserRound className="h-[60%] w-[60%]" />
      </AvatarFallback>
    </Avatar>
  )
};
