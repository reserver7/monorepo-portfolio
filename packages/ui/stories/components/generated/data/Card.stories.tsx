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
