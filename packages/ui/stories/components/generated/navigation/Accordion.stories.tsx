import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../../index";

type AccordionStoryArgs = {
  type: "single" | "multiple";
  collapsible: boolean;
  size: "sm" | "md" | "lg";
  variant: "default" | "separated" | "contained";
};

const meta: Meta<AccordionStoryArgs> = {
  title: "Components/Accordion",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    type: "single",
    collapsible: true,
    size: "md",
    variant: "separated"
  },
  argTypes: {
    type: { control: "inline-radio", options: ["single", "multiple"] },
    collapsible: { control: "boolean" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["default", "separated", "contained"] }
  }
};

export default meta;
type Story = StoryObj<AccordionStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const rootProps =
      args.type === "single"
        ? { type: "single" as const, collapsible: args.collapsible, defaultValue: "item-1" }
        : { type: "multiple" as const, defaultValue: ["item-1"] };

    return (
      <Accordion {...rootProps} size={args.size} variant={args.variant}>
        <AccordionItem value="item-1">
          <AccordionTrigger>문서 권한 안내</AccordionTrigger>
          <AccordionContent>viewer는 읽기 전용, editor는 수정이 가능합니다.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>실시간 동기화</AccordionTrigger>
          <AccordionContent>변경 사항은 자동 저장되며 사용자 간 동기화됩니다.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
};
