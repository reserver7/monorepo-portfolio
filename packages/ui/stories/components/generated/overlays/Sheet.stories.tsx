import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Input,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "../../../../index";

type SheetStoryArgs = {
  side: "top" | "right" | "bottom" | "left";
  size: "sm" | "md" | "lg" | "xl";
  scrollBehavior: "inside" | "outside";
  showOverlay: boolean;
  showCloseButton: boolean;
  closeOnEscape: boolean;
  closeOnOutsideClick: boolean;
};

const meta: Meta<SheetStoryArgs> = {
  title: "Components/Sheet",
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: {
    side: "right",
    size: "md",
    scrollBehavior: "inside",
    showOverlay: true,
    showCloseButton: true,
    closeOnEscape: true,
    closeOnOutsideClick: true
  },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
    scrollBehavior: { control: "inline-radio", options: ["inside", "outside"] },
    showOverlay: { control: "boolean" },
    showCloseButton: { control: "boolean" },
    closeOnEscape: { control: "boolean" },
    closeOnOutsideClick: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<SheetStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">시트 열기</Button>
      </SheetTrigger>
      <SheetContent
        side={args.side}
        size={args.size}
        scrollBehavior={args.scrollBehavior}
        showOverlay={args.showOverlay}
        showCloseButton={args.showCloseButton}
        closeOnEscape={args.closeOnEscape}
        closeOnOutsideClick={args.closeOnOutsideClick}
      >
        <SheetHeader>
          <SheetTitle>보드 설정</SheetTitle>
          <SheetDescription>실제 설정 패널 패턴으로 구성된 시트입니다.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Input label="보드 이름" placeholder="예: 디자인 리뷰 보드" />
          <Input label="접근 키" placeholder="선택 입력" />
          <Input label="참여자 제한" placeholder="예: 20" />
          <Input label="자동 저장 주기(초)" placeholder="예: 5" />
          <Input label="알림 웹훅 URL" placeholder="https://..." />
          <Input label="태그" placeholder="예: 기획,디자인,개발" />
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">취소</Button>
          </SheetClose>
          <Button variant="primary">저장</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
};
