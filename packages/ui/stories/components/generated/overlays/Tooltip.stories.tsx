import type { Meta, StoryObj } from "@storybook/react";
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../index";

type TooltipStoryArgs = {
  size: "sm" | "md" | "lg";
  color: "default" | "inverse" | "primary";
  withArrow: boolean;
  placement: "top" | "right" | "bottom" | "left";
  alignment: "start" | "center" | "end";
  offset: number;
};

const meta: Meta<TooltipStoryArgs> = {
  title: "Components/Tooltip",
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: { size: "md", color: "inverse", withArrow: true, placement: "top", alignment: "center", offset: 8 },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    color: { control: "inline-radio", options: ["default", "inverse", "primary"] },
    withArrow: { control: "boolean" },
    placement: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    alignment: { control: "inline-radio", options: ["start", "center", "end"] },
    offset: { control: { type: "number", min: 0, max: 24, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<TooltipStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">툴팁 확인</Button>
        </TooltipTrigger>
        <TooltipContent
          size={args.size}
          color={args.color}
          withArrow={args.withArrow}
          placement={args.placement}
          alignment={args.alignment}
          offset={args.offset}
        >
          보호 키를 입력하면 editor 권한을 요청합니다.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
};
