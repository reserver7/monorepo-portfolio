import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../../../../index";

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

const meta: Meta<typeof Input> = {
  title: "Components/Generated/Forms Primitives/Input",
  component: Input,
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
    label: "",
    placeholder: "값을 입력하세요",
    required: false,
    disabled: false,
    readOnly: false,
    clearable: false,
    size: "md",
    variant: "default",
    status: "default"
  },
  argTypes: {
    variant: { control: "select", options: ["default","outline","filled","ghost"], table: { defaultValue: { summary: "default" } } },
    size: { control: "select", options: ["sm","md","lg"], table: { defaultValue: { summary: "md" } } },
    status: { control: "select", options: ["default","error","success"], table: { defaultValue: { summary: "default" } } },
    label: { control: "text", table: { defaultValue: { summary: "" } } },
    helperText: { control: "text" },
    errorMessage: { control: "text" },
    required: { control: "boolean", table: { defaultValue: { summary: false } } },
    disabled: { control: "boolean", table: { defaultValue: { summary: false } } },
    readOnly: { control: "boolean", table: { defaultValue: { summary: false } } },
    clearable: { control: "boolean", table: { defaultValue: { summary: false } } },
    children: { control: false },
    asChild: { control: false },
    leftIcon: { control: false },
    rightIcon: { control: false }
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-lg rounded-xl border border-default bg-surface p-4">
      <Input
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
          Input
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <Input
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">초기화 가능</div>
            <Input
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              clearable
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">비활성화</div>
            <Input
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              disabled
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">읽기 전용</div>
            <Input
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              readOnly
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">필수</div>
            <Input
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              required
             />
          </div>
      </div>
    </section>
  )
};

const OPTION_MATRIX = {
  "variant": [
    "default",
    "outline",
    "filled",
    "ghost"
  ],
  "status": [
    "default",
    "error",
    "success"
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
            Input
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
                      <Input
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
