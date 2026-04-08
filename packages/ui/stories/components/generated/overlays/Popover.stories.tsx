import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Popover, PopoverContent, PopoverTrigger, Select } from "../../../../index";

type PopoverStoryArgs = {
  triggerText: string;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
  sideOffset: number;
};

const meta: Meta<PopoverStoryArgs> = {
  title: "Components/Popover",
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: {
    triggerText: "필터 열기",
    side: "bottom",
    align: "center",
    sideOffset: 8
  },
  argTypes: {
    triggerText: { control: "text" },
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    sideOffset: { control: { type: "number", min: 0, max: 24, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<PopoverStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">{args.triggerText}</Button>
      </PopoverTrigger>
      <PopoverContent side={args.side} align={args.align} sideOffset={args.sideOffset}>
        <div className="space-y-3">
          <h4 className="text-body-sm font-semibold">권한 필터</h4>
          <Select
            value="viewer"
            options={[
              { label: "viewer", value: "viewer" },
              { label: "editor", value: "editor" },
              { label: "admin", value: "admin" }
            ]}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
};
