import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "../../../../index";

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

const meta: Meta<typeof Grid> = {
  title: "Components/Grid",
  component: Grid,
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
    columns: 2,
    gap: "sm",
    rowGap: "none",
    columnGap: "none",
    align: "stretch",
    justify: "start",
    autoFit: false,
    minColumnWidth: "md",
    dense: false,
    fullWidth: false,
    children: "<div className=\"rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm\">Card 1</div>\n    <div className=\"rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm\">Card 2</div>\n    <div className=\"rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm\">Card 3</div>\n    <div className=\"rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm\">Card 4</div>"
  },
  argTypes: {
    align: {control:"select",options:["start","center","end","stretch"],table:{defaultValue:{summary:"stretch"}}},
    columnGap: {control:"select",options:["none","xs","sm","md","lg","xl"],table:{defaultValue:{summary:"none"}}},
    columns: {control:"select",options:[1,2,3,4,5,6,8,10,12],table:{defaultValue:{summary:1}}},
    gap: {control:"select",options:["none","xs","sm","md","lg","xl"],table:{defaultValue:{summary:"none"}}},
    justify: {control:"select",options:["start","center","end","between"],table:{defaultValue:{summary:"start"}}},
    minColumnWidth: {control:"select",options:["xs","sm","md","lg","xl"],table:{defaultValue:{summary:"md"}}},
    rowGap: {control:"select",options:["none","xs","sm","md","lg","xl"],table:{defaultValue:{summary:"none"}}},
    autoFit: {control:"boolean",table:{defaultValue:{summary:false}}},
    dense: {control:"boolean",table:{defaultValue:{summary:false}}},
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
type Story = StoryObj<typeof Grid>;

export const Playground: Story = {
  render: (args) => (
    <Grid
      {...sanitizeStoryArgs(args as Record<string, unknown>)}
  >
    <div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm">Card 1</div>
    <div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm">Card 2</div>
    <div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm">Card 3</div>
    <div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm">Card 4</div>
  </Grid>
  )
};
