import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "../../../../index";

type ScrollAreaStoryArgs = {
  scrollBarSize: "sm" | "md" | "lg";
};

const meta: Meta<ScrollAreaStoryArgs> = {
  title: "Components/ScrollArea",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: { scrollBarSize: "md" },
  argTypes: {
    scrollBarSize: { control: "inline-radio", options: ["sm", "md", "lg"] }
  }
};

export default meta;
type Story = StoryObj<ScrollAreaStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <ScrollArea className="h-64 w-full rounded-[var(--radius-xl)] border border-default bg-surface p-3" scrollBarSize={args.scrollBarSize}>
      <div className="space-y-2 pr-2">
        {Array.from({ length: 24 }).map((_, index) => (
          <p key={index} className="text-body-sm text-foreground">
            변경 이력 #{index + 1} - CRDT state synchronized
          </p>
        ))}
      </div>
    </ScrollArea>
  )
};
