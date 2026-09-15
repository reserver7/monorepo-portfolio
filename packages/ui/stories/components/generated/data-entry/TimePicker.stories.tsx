import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TimePicker } from "../../../../index";

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

const meta: Meta<typeof TimePicker> = {
  title: "Components/TimePicker",
  component: TimePicker,
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
    format: "HH:mm:ss",
    use12Hours: false,
    showSeconds: true,
    hourStep: 1,
    minuteStep: 1,
    secondStep: 1,
    hideDisabledOptions: false,
    needConfirm: true,
    showNow: true,
    changeOnScroll: false,
    placement: "bottomLeft",
    allowClear: true,
    clearable: true,
    placeholder: "Select time"
  },
  argTypes: {
    variant: {control:"select",options:["outlined","filled","borderless","underlined","default","outline","ghost"],table:{}},
    status: {control:"select",options:["error","warning","success","validating","default"],table:{}},
    format: {control:"select",options:["HH:mm","HH:mm:ss","h:mm A","h:mm:ss A"],table:{defaultValue:{summary:"HH:mm:ss"}}},
    placement: {control:"select",options:["bottomLeft","bottomRight","topLeft","topRight"],table:{defaultValue:{summary:"bottomLeft"}}},
    use12Hours: {control:"boolean",table:{defaultValue:{summary:false}}},
    showSeconds: {control:"boolean",table:{defaultValue:{summary:true}}},
    hideDisabledOptions: {control:"boolean",table:{defaultValue:{summary:false}}},
    needConfirm: {control:"boolean",table:{defaultValue:{summary:true}}},
    showNow: {control:"boolean",table:{defaultValue:{summary:true}}},
    changeOnScroll: {control:"boolean",table:{defaultValue:{summary:false}}},
    clearable: {control:"boolean",table:{defaultValue:{summary:true}}},
    hourStep: {control:{type:"number"},table:{defaultValue:{summary:1}}},
    minuteStep: {control:{type:"number"},table:{defaultValue:{summary:1}}},
    secondStep: {control:{type:"number"},table:{defaultValue:{summary:1}}},
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
    id: {table:{disable:true}},
    title: {table:{disable:true}}
  },
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

export const Playground: Story = {
  render: (args) => (
    <TimePicker
      {...sanitizeStoryArgs(args as Record<string, unknown>)}
   />
  )
};
