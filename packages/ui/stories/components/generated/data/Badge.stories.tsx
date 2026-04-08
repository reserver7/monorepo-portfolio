import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../../../../index";

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

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
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
    variant: "default",
    size: "sm",
    shape: "pill",
    dot: false,
    pulse: false,
    interactive: false,
    truncate: false,
    removable: false,
    removeLabel: "제거",
    children: "Badge"
  },
  argTypes: {
    variant: {control:"select",options:["default","secondary","outline","success","warning","danger","destructive","info"],table:{defaultValue:{summary:"default"}}},
    size: {control:"select",options:["sm","md","lg"],table:{defaultValue:{summary:"sm"}}},
    shape: {control:"select",options:["pill","rounded","square"],table:{defaultValue:{summary:"pill"}}},
    removeLabel: {control:"text",table:{defaultValue:{summary:"제거"}}},
    dot: {control:"boolean",table:{defaultValue:{summary:false}}},
    pulse: {control:"boolean",table:{defaultValue:{summary:false}}},
    interactive: {control:"boolean",table:{defaultValue:{summary:false}}},
    truncate: {control:"boolean",table:{defaultValue:{summary:false}}},
    removable: {control:"boolean",table:{defaultValue:{summary:false}}},
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
type Story = StoryObj<typeof Badge>;

export const Playground: Story = {
  render: (args) => (
    <Badge
      {...sanitizeStoryArgs(args as Record<string, unknown>)}
  >
    Badge
  </Badge>
  )
};
