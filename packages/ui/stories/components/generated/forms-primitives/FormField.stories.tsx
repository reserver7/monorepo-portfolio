import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "../../../../index";

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

const meta: Meta<typeof FormField> = {
  title: "Components/Generated/Forms Primitives/FormField",
  component: FormField,
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
    label: "필드 라벨",
    description: "필드 설명",
    requiredMark: false,
    size: "md"
  },
  argTypes: {
    size: { control: "select", options: ["sm","md","lg"], table: { defaultValue: { summary: "md" } } },
    label: { control: "text", table: { defaultValue: { summary: "필드 라벨" } } },
    description: { control: "text", table: { defaultValue: { summary: "필드 설명" } } },
    requiredMark: { control: "boolean", table: { defaultValue: { summary: false } } },
    children: { control: false },
    asChild: { control: false },
    leftIcon: { control: false },
    rightIcon: { control: false }
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-lg rounded-xl border border-default bg-surface p-4">
      <FormField
        {...sanitizeStoryArgs(args as Record<string, unknown>)}
     />
    </div>
  )
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-xl border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          FormField
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <FormField
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">requiredMark=true</div>
            <FormField
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              requiredMark
             />
          </div>
      </div>
    </section>
  )
};

const OPTION_MATRIX = {
  "size": [
    "sm",
    "md",
    "lg"
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
            FormField
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
                      <FormField
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
