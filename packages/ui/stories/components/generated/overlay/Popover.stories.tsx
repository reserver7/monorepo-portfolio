import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Popover, PopoverContent, PopoverTrigger, Select } from "../../../../index";

type PopoverStoryArgs = {
  triggerText: string;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
  sideOffset: number;
};

const meta: Meta<PopoverStoryArgs> = {
  title: "Components/Popover",
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: {
    triggerText: "필터 열기",
    side: "bottom",
    align: "center",
    sideOffset: 8
  },
  argTypes: {
    triggerText: { control: "text" },
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    sideOffset: { control: { type: "number", min: 0, max: 24, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<PopoverStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">{args.triggerText}</Button>
      </PopoverTrigger>
      <PopoverContent side={args.side} align={args.align} sideOffset={args.sideOffset}>
        <div className="space-y-3">
          <h4 className="text-body-sm font-semibold">권한 필터</h4>
          <Select
            value="viewer"
            options={[
              { label: "viewer", value: "viewer" },
              { label: "editor", value: "editor" },
              { label: "admin", value: "admin" }
            ]}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          Popover
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <Popover
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">withArrow</div>
            <Popover
              {...sanitizeStoryArgs(args as Record<string, unknown>)}

              withArrow
             />
          </div>
      </div>
    </section>
  )
};


const OPTION_MATRIX = {
  "variant": [
    "default",
    "elevated"
  ],
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
      <section className="rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">옵션 매트릭스</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            Popover
          </span>
        </div>
        <div className="space-y-4">
          {Object.entries(OPTION_MATRIX).map(([propName, values]) => (
            <article key={propName} className="rounded-[var(--radius-lg)] border border-default bg-surface-elevated p-3">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-body-sm text-foreground font-medium">{propName}</h4>
                <span className="text-caption text-muted">{values.length} options</span>
              </div>
              <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(values as readonly unknown[]).map((value) => (
                  <div key={`${propName}-${String(value)}`} className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
                    <div className="text-caption text-muted mb-2">{String(value)}</div>
                    <div className="min-h-10">
                      <Popover
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


export const Examples: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">사용 예시</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          Popover
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <Popover
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-1">레이아웃 배치 예시</div>
          <div className="text-caption text-muted mb-2">실제 화면 배치에서 기본 상태를 검증합니다.</div>
          <div className="min-h-10">
            <Popover
                {...sanitizeStoryArgs(args as Record<string, unknown>)}
               />
          </div>
        </div>
      </div>
    </section>
  )
};
