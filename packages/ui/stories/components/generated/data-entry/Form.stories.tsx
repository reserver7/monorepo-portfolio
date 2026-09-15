import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Form, FormItem, Input } from "../../../../index";

type FormStoryArgs = { layout: "horizontal" | "vertical" | "inline" };

const meta: Meta<FormStoryArgs> = {
  title: "Components/Form",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: { layout: "vertical" },
  argTypes: { layout: { control: "inline-radio", options: ["vertical", "horizontal", "inline"] } }
};

export default meta;
type Story = StoryObj<FormStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const [submitted, setSubmitted] = React.useState("");
    return (
      <div className="max-w-xl space-y-4">
        <Form
          layout={args.layout}
          initialValues={{ name: "" }}
          onFinish={(values) => setSubmitted(String(values.name ?? "제출 완료"))}
        >
          <FormItem name="name" label="이름" required rules={[{ required: true, message: "이름을 입력해 주세요." }]}>
            <Input placeholder="이름을 입력하세요" />
          </FormItem>
          <FormItem name="email" label="이메일" rules={[{ validator: (value) => value && !String(value).includes("@") ? "이메일 형식을 확인해 주세요." : null }]}>
            <Input type="email" placeholder="name@example.com" />
          </FormItem>
          <div className="flex gap-2">
            <Button type="submit">저장</Button>
            <Button type="reset" variant="outline">초기화</Button>
          </div>
        </Form>
        {submitted ? <p role="status" className="text-sm text-success">저장됨: {submitted}</p> : null}
      </div>
    );
  }
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          Form
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <Form
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">layout vertical</div>
            <Form
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              {...({ "layout": "vertical" } as Record<string, unknown>)}
             />
          </div>
      </div>
    </section>
  )
};


const OPTION_MATRIX = {
  "layout": [
    "horizontal",
    "vertical",
    "inline"
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
            Form
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
                      <Form
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
          Form
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <Form
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-1">레이아웃 배치 예시</div>
          <div className="text-caption text-muted mb-2">실제 화면 배치에서 기본 상태를 검증합니다.</div>
          <div className="min-h-10">
            <Form
                {...sanitizeStoryArgs(args as Record<string, unknown>)}
               />
          </div>
        </div>
      </div>
    </section>
  )
};
