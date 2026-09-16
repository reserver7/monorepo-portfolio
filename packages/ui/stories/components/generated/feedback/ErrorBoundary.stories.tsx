import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, ErrorBoundary } from "../../../../index";

type ErrorBoundaryStoryArgs = {
  fallbackTitle: string;
  fallbackDescription: string;
  fullScreen: boolean;
  showRetryButton: boolean;
  showRefreshButton: boolean;
  showHomeButton: boolean;
};

function CrashPanel() {
  const [shouldCrash, setShouldCrash] = React.useState(false);
  if (shouldCrash) {
    throw new Error("스토리북 오류 시뮬레이션");
  }
  return (
    <Button variant="danger" onClick={() => setShouldCrash(true)}>
      오류 발생시키기
    </Button>
  );
}

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

const meta: Meta<ErrorBoundaryStoryArgs> = {
  title: "Components/ErrorBoundary",
  component: ErrorBoundary,
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    fallbackTitle: "문제가 발생했습니다.",
    fallbackDescription: "잠시 후 다시 시도해주세요.",
    fullScreen: false,
    showRetryButton: true,
    showRefreshButton: true,
    showHomeButton: true
  }
};

export default meta;
type Story = StoryObj<ErrorBoundaryStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <ErrorBoundary {...args}>
      <CrashPanel />
    </ErrorBoundary>
  )
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="border-default bg-surface space-y-3 rounded-[var(--radius-xl)] border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted border-default bg-surface-elevated rounded-full border px-2 py-0.5">
          ErrorBoundary
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-2">기본</div>
          <ErrorBoundary {...sanitizeStoryArgs(args as Record<string, unknown>)} />
        </div>
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-2">fullScreen</div>
          <ErrorBoundary {...sanitizeStoryArgs(args as Record<string, unknown>)} fullScreen />
        </div>
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-2">showDetailInDev</div>
          <ErrorBoundary {...sanitizeStoryArgs(args as Record<string, unknown>)} showDetailInDev />
        </div>
      </div>
    </section>
  )
};

const OPTION_MATRIX = {
  fullScreen: [true, false]
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
      <section className="border-default bg-surface rounded-[var(--radius-xl)] border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">옵션 매트릭스</h3>
          <span className="text-caption text-muted border-default bg-surface-elevated rounded-full border px-2 py-0.5">
            ErrorBoundary
          </span>
        </div>
        <div className="space-y-4">
          {Object.entries(OPTION_MATRIX).map(([propName, values]) => (
            <article
              key={propName}
              className="border-default bg-surface-elevated rounded-[var(--radius-lg)] border p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-body-sm text-foreground font-medium">{propName}</h4>
                <span className="text-caption text-muted">{values.length} options</span>
              </div>
              <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(values as readonly unknown[]).map((value) => (
                  <div
                    key={`${propName}-${String(value)}`}
                    className="border-default bg-surface rounded-[var(--radius-md)] border p-3"
                  >
                    <div className="text-caption text-muted mb-2">{String(value)}</div>
                    <div className="min-h-10">
                      <ErrorBoundary
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
    <section className="border-default bg-surface space-y-3 rounded-[var(--radius-xl)] border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">사용 예시</h3>
        <span className="text-caption text-muted border-default bg-surface-elevated rounded-full border px-2 py-0.5">
          ErrorBoundary
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <ErrorBoundary {...sanitizeStoryArgs(args as Record<string, unknown>)} />
          </div>
        </div>
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-1">레이아웃 배치 예시</div>
          <div className="text-caption text-muted mb-2">실제 화면 배치에서 기본 상태를 검증합니다.</div>
          <div className="min-h-10">
            <ErrorBoundary {...sanitizeStoryArgs(args as Record<string, unknown>)} />
          </div>
        </div>
      </div>
    </section>
  )
};
