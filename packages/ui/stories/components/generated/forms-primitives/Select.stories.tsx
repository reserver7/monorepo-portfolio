import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "../../../../index";

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

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
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
    placeholder: "선택하세요",
    emptyMessage: "결과가 없습니다.",
    searchPlaceholder: "검색",
    size: "md",
    variant: "default",
    status: "default",
    searchable: false,
    multiple: false,
    loading: false,
    maxVisibleItems: 8,
    maxTagCount: 2,
    label: "",
    options: [{"label":"옵션 A","value":"a"},{"label":"옵션 B","value":"b"},{"label":"옵션 C","value":"c"}],
    disabled: false
  },
  argTypes: {
    variant: {control:"select",options:["default","filled","ghost"],table:{defaultValue:{summary:"default"}}},
    size: {control:"select",options:["sm","md","lg"],table:{defaultValue:{summary:"md"}}},
    status: {control:"select",options:["default","error","success"],table:{defaultValue:{summary:"default"}}},
    name: {control:"text",table:{}},
    placeholder: {control:"text",table:{defaultValue:{summary:"선택하세요"}}},
    emptyMessage: {control:"text",table:{defaultValue:{summary:"결과가 없습니다."}}},
    searchPlaceholder: {control:"text",table:{defaultValue:{summary:"검색"}}},
    searchable: {control:"boolean",table:{defaultValue:{summary:false}}},
    multiple: {control:"boolean",table:{defaultValue:{summary:false}}},
    loading: {control:"boolean",table:{defaultValue:{summary:false}}},
    disabled: {control:"boolean",table:{defaultValue:{summary:false}}},
    maxVisibleItems: {control:{type:"number"},table:{defaultValue:{summary:8}}},
    maxTagCount: {control:{type:"number"},table:{defaultValue:{summary:2}}},
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
type Story = StoryObj<typeof Select>;

export const Playground: Story = {
  render: (args) => (
    <Select
      {...sanitizeStoryArgs(args as Record<string, unknown>)}
   />
  )
};
