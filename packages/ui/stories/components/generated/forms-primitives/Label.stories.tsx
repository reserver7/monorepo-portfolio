import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../../../../index";

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

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
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
    size: "md",
    color: "default",
    required: false,
    children: "Label"
  },
  argTypes: {
    size: {control:"select",options:["sm","md","lg"],table:{defaultValue:{summary:"md"}}},
    required: {control:"boolean",table:{defaultValue:{summary:false}}},
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
type Story = StoryObj<typeof Label>;

export const Playground: Story = {
  render: (args) => (
    <Label
      {...sanitizeStoryArgs(args as Record<string, unknown>)}
  >
    Label
  </Label>
  )
};
