import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../../index";

type AccordionStoryArgs = {
  type: "single" | "multiple";
  collapsible: boolean;
  size: "sm" | "md" | "lg";
  variant: "default" | "separated" | "contained";
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

const meta: Meta<AccordionStoryArgs> = {
  title: "Components/Accordion",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    type: "single",
    collapsible: true,
    size: "md",
    variant: "separated"
  },
  argTypes: {
    type: { control: "inline-radio", options: ["single", "multiple"] },
    collapsible: { control: "boolean" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["default", "separated", "contained"] }
  }
};

export default meta;
type Story = StoryObj<AccordionStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const rootProps =
      args.type === "single"
        ? { type: "single" as const, collapsible: args.collapsible, defaultValue: "item-1" }
        : { type: "multiple" as const, defaultValue: ["item-1"] };

    return (
      <Accordion {...rootProps} size={args.size} variant={args.variant}>
        <AccordionItem value="item-1">
          <AccordionTrigger>문서 권한 안내</AccordionTrigger>
          <AccordionContent>viewer는 읽기 전용, editor는 수정이 가능합니다.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>실시간 동기화</AccordionTrigger>
          <AccordionContent>변경 사항은 자동 저장되며 사용자 간 동기화됩니다.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="border-default bg-surface space-y-3 rounded-[var(--radius-xl)] border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted border-default bg-surface-elevated rounded-full border px-2 py-0.5">
          Accordion
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-2">기본</div>
          <Accordion {...sanitizeStoryArgs(args as Record<string, unknown>)} />
        </div>
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-2">rotateChevron</div>
          <Accordion {...sanitizeStoryArgs(args as Record<string, unknown>)} rotateChevron />
        </div>
      </div>
    </section>
  )
};

const OPTION_MATRIX = {
  chevronPosition: ["left", "right"]
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
            Accordion
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
                      <Accordion
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
          Accordion
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <Accordion {...sanitizeStoryArgs(args as Record<string, unknown>)} />
          </div>
        </div>
        <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
          <div className="text-caption text-muted mb-1">레이아웃 배치 예시</div>
          <div className="text-caption text-muted mb-2">실제 화면 배치에서 기본 상태를 검증합니다.</div>
          <div className="min-h-10">
            <Accordion {...sanitizeStoryArgs(args as Record<string, unknown>)} />
          </div>
        </div>
      </div>
    </section>
  )
};
