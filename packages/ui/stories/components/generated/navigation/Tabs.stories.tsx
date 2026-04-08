import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../index";

type TabsStoryArgs = {
  size: "sm" | "md" | "lg";
  variant: "pill" | "underline";
  fullWidth: boolean;
};

const meta: Meta<TabsStoryArgs> = {
  title: "Components/Tabs",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: { size: "md", variant: "pill", fullWidth: false },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["pill", "underline"] },
    fullWidth: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<TabsStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Tabs defaultValue="activity" className="w-full">
      <TabsList size={args.size} variant={args.variant} fullWidth={args.fullWidth}>
        <TabsTrigger value="activity" size={args.size} variant={args.variant}>활동</TabsTrigger>
        <TabsTrigger value="comments" size={args.size} variant={args.variant}>댓글</TabsTrigger>
        <TabsTrigger value="history" size={args.size} variant={args.variant}>이력</TabsTrigger>
      </TabsList>
      <TabsContent value="activity">실시간 이벤트 로그를 확인하세요.</TabsContent>
      <TabsContent value="comments">댓글/멘션 패널입니다.</TabsContent>
      <TabsContent value="history">문서 변경 이력 패널입니다.</TabsContent>
    </Tabs>
  )
};
