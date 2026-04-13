import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Flex } from "../../../../index";

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

const meta: Meta<typeof Flex> = {
  title: "Components/Flex",
  component: Flex,
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
  /^on[A-Z].*/,
  /.*ClassName$/
] }
  },
  args: {
    direction: "row",
    align: "center",
    justify: "start",
    wrap: "wrap",
    gap: "sm",
    inline: false,
    fullWidth: false,
    children: "<div className=\"rounded-[var(--radius-md)] border border-default bg-surface-elevated px-3 py-1.5 text-body-sm\">Item A</div>\n    <div className=\"rounded-[var(--radius-md)] border border-default bg-surface-elevated px-3 py-1.5 text-body-sm\">Item B</div>\n    <div className=\"rounded-[var(--radius-md)] border border-default bg-surface-elevated px-3 py-1.5 text-body-sm\">Item C</div>"
  },
  argTypes: {
    align: {control:"select",options:["start","center","end","stretch","baseline"],table:{defaultValue:{summary:"stretch"}}},
    direction: {control:"select",options:["row","row-reverse","col","col-reverse"],table:{defaultValue:{summary:"row"}}},
    gap: {control:"select",options:["none","xs","sm","md","lg","xl"],table:{defaultValue:{summary:"none"}}},
    justify: {control:"select",options:["start","center","end","between","around","evenly"],table:{defaultValue:{summary:"start"}}},
    wrap: {control:"select",options:["nowrap","wrap","wrap-reverse"],table:{defaultValue:{summary:"nowrap"}}},
    inline: {control:"boolean",table:{defaultValue:{summary:false}}},
    fullWidth: {control:"boolean",table:{defaultValue:{summary:false}}},
    children: {control:false,table:{disable:true}},
    asChild: {control:false,table:{disable:true}},
    leftIcon: {control:false,table:{disable:true}},
    rightIcon: {control:false,table:{disable:true}},
    options: {control:false,table:{}},
    value: {control:false,table:{}},
    defaultValue: {control:false,table:{}},
    checked: {control:false,table:{}},
    defaultChecked: {control:false,table:{}},
    open: {control:false,table:{}},
    defaultOpen: {control:false,table:{}},
    onChange: {control:false,table:{}},
    onCheckedChange: {control:false,table:{}},
    onOpenChange: {control:false,table:{}},
    prefix: {table:{disable:true}},
    suffix: {table:{disable:true}},
    className: {table:{disable:true}},
    containerClassName: {table:{disable:true}},
    labelClassName: {table:{disable:true}},
    helperClassName: {table:{disable:true}},
    optionClassName: {table:{disable:true}},
    optionLabelClassName: {table:{disable:true}},
    optionDescriptionClassName: {table:{disable:true}},
    style: {table:{disable:true}},
    id: {table:{disable:true}}
  },
};

export default meta;
type Story = StoryObj<typeof Flex>;

export const Playground: Story = {
  render: (args) => (
    <Flex
      {...sanitizeStoryArgs(args as Record<string, unknown>)}
  >
    <div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated px-3 py-1.5 text-body-sm">Item A</div>
    <div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated px-3 py-1.5 text-body-sm">Item B</div>
    <div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated px-3 py-1.5 text-body-sm">Item C</div>
  </Flex>
  )
};
