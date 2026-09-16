import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Transfer } from "../../../../index";

const isRenderableNode = (value: unknown): boolean => {
  if (value == null) return true;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
  if (React.isValidElement(value)) return true;
  if (Array.isArray(value)) return value.every(isRenderableNode);
  return false;
};

const sanitizeStoryArgs = (args: Record<string, unknown>): Record<string, unknown> => {
  const next = { ...args };
  for (const key of [
    "children",
    "leftIcon",
    "rightIcon",
    "prefix",
    "suffix",
    "label",
    "helperText",
    "errorMessage",
    "title",
    "description",
    "helper"
  ]) {
    if (!isRenderableNode(next[key])) delete next[key];
  }
  return next;
};

const meta: Meta<typeof Transfer> = {
  title: "Components/Transfer",
  component: Transfer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: {
      expanded: true,
      exclude: [
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
      ]
    }
  },
  args: {
    dataSource: [
      { key: "design", title: "디자인 리뷰" },
      { key: "frontend", title: "프론트엔드" },
      { key: "backend", title: "백엔드" },
      { key: "qa", title: "품질 검증" }
    ],
    defaultTargetKeys: ["backend"],
    showSearch: true,
    titles: ["사용 가능", "선택됨"]
  },
  argTypes: {
    showSearch: { control: "boolean", table: { defaultValue: { summary: true } } },
    children: { control: false, table: { disable: true } },
    asChild: { control: false, table: { disable: true } },
    leftIcon: { control: false, table: { disable: true } },
    rightIcon: { control: false, table: { disable: true } },
    options: { control: false, table: {} },
    value: { control: false, table: {} },
    defaultValue: { control: false, table: {} },
    checked: { control: false, table: {} },
    defaultChecked: { control: false, table: {} },
    open: { control: false, table: {} },
    defaultOpen: { control: false, table: {} },
    onChange: { control: false, table: {} },
    onCheckedChange: { control: false, table: {} },
    onOpenChange: { control: false, table: {} },
    prefix: { table: { disable: true } },
    suffix: { table: { disable: true } },
    className: { table: { disable: true } },
    containerClassName: { table: { disable: true } },
    labelClassName: { table: { disable: true } },
    helperClassName: { table: { disable: true } },
    optionClassName: { table: { disable: true } },
    optionLabelClassName: { table: { disable: true } },
    optionDescriptionClassName: { table: { disable: true } },
    style: { table: { disable: true } },
    id: { table: { disable: true } },
    title: { table: { disable: true } }
  }
};

export default meta;
type Story = StoryObj<typeof Transfer>;

export const Playground: Story = {
  render: (args) => <Transfer {...sanitizeStoryArgs(args as Record<string, unknown>)} />
};
