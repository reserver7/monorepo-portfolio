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
  title: "Components/Generated/Forms Primitives/Select",
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
  "name",
  /^on[A-Z].*/,
  /.*ClassName$/
] }
  },
  args: {
    label: "",
    options: [{"label":"옵션 A","value":"a"},{"label":"옵션 B","value":"b"},{"label":"옵션 C","value":"c"}],
    placeholder: "선택하세요",
    disabled: false,
    searchable: false,
    multiple: false,
    loading: false,
    size: "md",
    variant: "default",
    state: "default",
    maxVisibleItems: 8,
    maxTagCount: 2
  },
  argTypes: {
    variant: { control: "select", options: ["default","filled","ghost"], table: { defaultValue: { summary: "default" } } },
    size: { control: "select", options: ["sm","md","lg"], table: { defaultValue: { summary: "md" } } },
    state: { control: "select", options: ["default","error","success"], table: { defaultValue: { summary: "default" } } },
    label: { control: "text", table: { defaultValue: { summary: "" } } },
    helperText: { control: "text" },
    errorMessage: { control: "text" },
    disabled: { control: "boolean", table: { defaultValue: { summary: false } } },
    searchable: { control: "boolean", table: { defaultValue: { summary: false } } },
    multiple: { control: "boolean", table: { defaultValue: { summary: false } } },
    loading: { control: "boolean", table: { defaultValue: { summary: false } } },
    maxVisibleItems: { control: { type: "number" }, table: { defaultValue: { summary: 8 } } },
    maxTagCount: { control: { type: "number" }, table: { defaultValue: { summary: 2 } } },
    children: { control: false },
    asChild: { control: false },
    leftIcon: { control: false },
    rightIcon: { control: false }
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-lg rounded-xl border border-default bg-surface p-4">
      <Select
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
          Select
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <Select
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">비활성화</div>
            <Select
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              disabled
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">로딩</div>
            <Select
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              loading
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">다중 선택</div>
            <Select
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              multiple
             />
          </div>
          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">검색 활성화</div>
            <Select
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              
              searchable
             />
          </div>
      </div>
    </section>
  )
};

const OPTION_MATRIX = {
  "variant": [
    "default",
    "filled",
    "ghost"
  ],
  "state": [
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
            Select
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
                      <Select
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
