import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "../../../../index";

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

const meta: Meta<typeof Pagination> = {
  title: "Components/Pagination",
  component: Pagination,
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
    defaultPage: 4,
    totalPages: 12,
    totalItems: undefined,
    defaultPageSize: 10,
    pageSizeOptions: [10,20,50,100],
    siblingCount: 1,
    boundaryCount: 1,
    showFirstLast: true,
    showPrevNext: true,
    showTotal: false,
    showPageInfo: false,
    showPageSizeSelector: false,
    showQuickJumper: false,
    hideOnSinglePage: false,
    simple: false,
    pageSizeLabel: "페이지당",
    pageSizeSuffix: "개",
    quickJumperPlaceholder: "페이지",
    quickJumperGoLabel: "이동",
    disabled: false,
    size: "md",
    variant: "outline",
    itemStyle: "minimal",
    fullWidth: false
  },
  argTypes: {
    variant: {control:"select",options:["default","outline","ghost"],table:{defaultValue:{summary:"outline"}}},
    size: {control:"select",options:["sm","md","lg"],table:{defaultValue:{summary:"md"}}},
    itemStyle: {control:"select",options:["button","minimal"],table:{defaultValue:{summary:"minimal"}}},
    pageSizeLabel: {control:"text",table:{defaultValue:{summary:"페이지당"}}},
    quickJumperPlaceholder: {control:"text",table:{defaultValue:{summary:"페이지"}}},
    quickJumperGoLabel: {control:"text",table:{defaultValue:{summary:"이동"}}},
    showFirstLast: {control:"boolean",table:{defaultValue:{summary:true}}},
    showPrevNext: {control:"boolean",table:{defaultValue:{summary:true}}},
    showPageInfo: {control:"boolean",table:{defaultValue:{summary:false}}},
    showPageSizeSelector: {control:"boolean",table:{defaultValue:{summary:false}}},
    showQuickJumper: {control:"boolean",table:{defaultValue:{summary:false}}},
    hideOnSinglePage: {control:"boolean",table:{defaultValue:{summary:false}}},
    simple: {control:"boolean",table:{defaultValue:{summary:false}}},
    disabled: {control:"boolean",table:{defaultValue:{summary:false}}},
    fullWidth: {control:"boolean",table:{defaultValue:{summary:false}}},
    defaultPage: {control:{type:"number"},table:{defaultValue:{summary:4}}},
    totalPages: {control:{type:"number"},table:{defaultValue:{summary:12}}},
    defaultPageSize: {control:{type:"number"},table:{defaultValue:{summary:10}}},
    siblingCount: {control:{type:"number"},table:{defaultValue:{summary:1}}},
    boundaryCount: {control:{type:"number"},table:{defaultValue:{summary:1}}},
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
type Story = StoryObj<typeof Pagination>;

export const Playground: Story = {
  render: (args) => (
    <Pagination
      {...sanitizeStoryArgs(args as Record<string, unknown>)}
   />
  )
};
