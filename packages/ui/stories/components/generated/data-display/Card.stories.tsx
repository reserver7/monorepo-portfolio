import type { Meta, StoryObj } from "@storybook/react";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../index";

type CardStoryArgs = {
  variant: "default" | "elevated" | "muted" | "ghost";
  padding: "none" | "sm" | "md" | "lg";
  radius: "md" | "lg" | "xl";
  bordered: boolean;
  interactive: boolean;
  showBadge: boolean;
  showFooterAction: boolean;
};

const meta: Meta<CardStoryArgs> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { expanded: true, exclude: ["className", "style", "children", "id", /^on[A-Z].*/] }
  },
  args: {
    variant: "elevated",
    padding: "md",
    radius: "xl",
    bordered: true,
    interactive: false,
    showBadge: true,
    showFooterAction: true
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "elevated", "muted", "ghost"] },
    padding: { control: "inline-radio", options: ["none", "sm", "md", "lg"] },
    radius: { control: "inline-radio", options: ["md", "lg", "xl"] },
    bordered: { control: "boolean" },
    interactive: { control: "boolean" },
    showBadge: { control: "boolean" },
    showFooterAction: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<CardStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-xl">
      <Card
        variant={args.variant}
        padding={args.padding}
        radius={args.radius}
        bordered={args.bordered}
        interactive={args.interactive}
      >
        <CardHeader padding="none">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>협업 문서 카드</CardTitle>
            {args.showBadge ? <Badge variant="info">live</Badge> : null}
          </div>
          <CardDescription>권한, 상태, 메타 데이터를 묶어 표현하는 기본 카드 패턴입니다.</CardDescription>
        </CardHeader>
        <CardContent padding="none">
          <div className="text-body-sm text-muted space-y-1">
            <p>최근 수정: 2분 전</p>
            <p>동시 접속: 3명</p>
          </div>
        </CardContent>
        <CardFooter padding="none" className="mt-4 justify-end gap-2">
          {args.showFooterAction ? (
            <>
              <Button size="sm" variant="outline">닫기</Button>
              <Button size="sm" variant="primary">열기</Button>
            </>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          Card
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <Card
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
            >
              Card content
            </Card>
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">bordered</div>
            <Card
              {...sanitizeStoryArgs(args as Record<string, unknown>)}

              bordered
            >
              Card content
            </Card>
          </div>
      </div>
    </section>
  )
};


const OPTION_MATRIX = {
  "variant": [
    "default",
    "elevated",
    "muted",
    "ghost"
  ],
  "padding": [
    "none",
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
            Card
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
                      <Card
                        {...sanitizeMatrixArgs(args as Record<string, unknown>)}
                        {...({ [propName]: value } as Record<string, unknown>)}
                      >
                Card content
              </Card>
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
          Card
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <Card
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
            >
                Card content
              </Card>
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-1">레이아웃 배치 예시</div>
          <div className="text-caption text-muted mb-2">실제 화면 배치에서 기본 상태를 검증합니다.</div>
          <div className="min-h-10">
            <Card
                {...sanitizeStoryArgs(args as Record<string, unknown>)}
              >
                Card content
              </Card>
          </div>
        </div>
      </div>
    </section>
  )
};
