import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../../index";

type AvatarStoryArgs = {
  name: string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  shape: "circle" | "rounded" | "square";
  color: "default" | "primary" | "success" | "warning" | "danger";
  showStatus: boolean;
  status: "online" | "offline" | "away" | "busy";
};

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

const meta: Meta<AvatarStoryArgs> = {
  title: "Components/Avatar",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    name: "게스트-923",
    size: "md",
    shape: "circle",
    color: "default",
    showStatus: true,
    status: "online"
  }
};

export default meta;
type Story = StoryObj<AvatarStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback color={args.color}>
        <UserRound className="h-[60%] w-[60%]" />
      </AvatarFallback>
    </Avatar>
  )
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          Avatar
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <Avatar
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">bordered</div>
            <Avatar
              {...sanitizeStoryArgs(args as Record<string, unknown>)}

              bordered
             />
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">showStatus</div>
            <Avatar
              {...sanitizeStoryArgs(args as Record<string, unknown>)}

              showStatus
             />
          </div>
      </div>
    </section>
  )
};


const OPTION_MATRIX = {
  "size": [
    "xs",
    "sm",
    "md",
    "lg",
    "xl"
  ],
  "shape": [
    "circle",
    "rounded",
    "square"
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
            Avatar
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
                      <Avatar
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
          Avatar
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <Avatar
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-1">레이아웃 배치 예시</div>
          <div className="text-caption text-muted mb-2">실제 화면 배치에서 기본 상태를 검증합니다.</div>
          <div className="min-h-10">
            <Avatar
                {...sanitizeStoryArgs(args as Record<string, unknown>)}
               />
          </div>
        </div>
      </div>
    </section>
  )
};
