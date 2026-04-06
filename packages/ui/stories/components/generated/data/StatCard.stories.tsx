import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { StatCard } from "../../../../index";

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

const meta: Meta<typeof StatCard> = {
  title: "Components/Generated/Data/StatCard",
  component: StatCard,
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
  "name",
  /^on[A-Z].*/,
  /.*ClassName$/
] }
  },
  args: {
    label: "지표",
    value: "128",
    helper: "전일 대비 +12%",
    tone: "default",
    size: "md"
  },
  argTypes: {
    size: { control: "select", options: ["sm","md","lg"], table: { defaultValue: { summary: "md" } } },
    tone: { control: "select", options: ["default","primary","warning","danger"], table: { defaultValue: { summary: "default" } } },
    label: { control: "text", table: { defaultValue: { summary: "지표" } } },
    helper: { control: "text", table: { defaultValue: { summary: "전일 대비 +12%" } } },
    children: { control: false },
    asChild: { control: false },
    leftIcon: { control: false },
    rightIcon: { control: false }
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-lg rounded-xl border border-default bg-surface p-4">
      <StatCard
        {...sanitizeStoryArgs(args as Record<string, unknown>)}
     />
    </div>
  )
};

const OPTION_MATRIX = {
  "tone": [
    "default",
    "primary",
    "warning",
    "danger"
  ]
} as const;

const sanitizeMatrixArgs = (args: Record<string, unknown>) => {
  const next = sanitizeStoryArgs(args);
  delete next.children;
  delete next.leftIcon;
  delete next.rightIcon;
  return next;
};

export const OptionMatrix: Story = {
  render: (args) => (
    <div className="space-y-4">
      <section className="rounded-xl border border-default bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">옵션 매트릭스</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            StatCard
          </span>
        </div>
        <div className="space-y-4">
          {Object.entries(OPTION_MATRIX).map(([propName, values]) => (
            <article key={propName} className="rounded-lg border border-default bg-surface-elevated p-3">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-body-sm text-foreground font-medium">{propName}</h4>
                <span className="text-caption text-muted">{values.length} options</span>
              </div>
              <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(values as readonly unknown[]).map((value) => (
                  <div key={`${propName}-${String(value)}`} className="rounded-md border border-default bg-surface p-3">
                    <div className="text-caption text-muted mb-2">{String(value)}</div>
                    <div className="min-h-10">
                      <StatCard
                        {...sanitizeMatrixArgs(args as Record<string, unknown>)}
                        {...({ [propName]: value } as Record<string, unknown>)}
                       />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
          <div className="text-caption text-muted">
            Playground controls와 함께 사용해서 옵션 조합을 추가 검증하세요.
          </div>
        </div>
      </section>
    </div>
  )
};
