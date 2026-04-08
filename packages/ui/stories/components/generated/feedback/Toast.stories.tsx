import type { Meta, StoryObj } from "@storybook/react";
import { Button, Toast, toast } from "../../../../index";

type ToastStoryArgs = {
  position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  richColors: boolean;
  expand: boolean;
  visibleToasts: number;
};

const meta: Meta<ToastStoryArgs> = {
  title: "Components/Toast",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: { position: "top-center", richColors: true, expand: false, visibleToasts: 4 },
  argTypes: {
    position: { control: "select", options: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"] },
    richColors: { control: "boolean" },
    expand: { control: "boolean" },
    visibleToasts: { control: { type: "number", min: 1, max: 8, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<ToastStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <div className="space-y-3">
      <Toast position={args.position} richColors={args.richColors} expand={args.expand} visibleToasts={args.visibleToasts} />
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => toast.success("저장되었습니다.")}>success</Button>
        <Button variant="danger" onClick={() => toast.error("요청에 실패했습니다.")}>error</Button>
        <Button variant="outline" onClick={() => toast.warning("권한이 부족합니다.")}>warning</Button>
        <Button variant="secondary" onClick={() => toast.info("동기화가 완료되었습니다.")}>info</Button>
      </div>
    </div>
  )
};
