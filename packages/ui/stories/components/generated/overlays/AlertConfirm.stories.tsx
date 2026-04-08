import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  AlertConfirm,
  AlertConfirmTrigger,
  AlertConfirmContent,
  AlertConfirmHeader,
  AlertConfirmTitle,
  AlertConfirmDescription,
  AlertConfirmFooter,
  Button
} from "../../../../index";

type AlertConfirmStoryArgs = {
  titleText: string;
  descriptionText: string;
  size: "sm" | "md" | "lg";
  intent: "default" | "danger" | "warning" | "info";
  preventEscapeClose: boolean;
  cancelText: string;
  confirmText: string;
  cancelVariant: "primary" | "secondary" | "danger" | "ghost" | "outline";
  confirmVariant: "primary" | "secondary" | "danger" | "ghost" | "outline";
  cancelDisabled: boolean;
  confirmDisabled: boolean;
  confirmLoading: boolean;
  closeOnConfirm: boolean;
  autoFocusButton: "confirm" | "cancel" | "none";
};

const meta: Meta<AlertConfirmStoryArgs> = {
  title: "Components/AlertConfirm",
  component: AlertConfirmContent,
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: {
    titleText: "정말 삭제하시겠습니까?",
    descriptionText: "삭제 후에는 되돌릴 수 없습니다.",
    size: "md",
    intent: "danger",
    preventEscapeClose: false,
    cancelText: "취소",
    confirmText: "삭제",
    cancelVariant: "secondary",
    confirmVariant: "danger",
    cancelDisabled: false,
    confirmDisabled: false,
    confirmLoading: false,
    closeOnConfirm: true,
    autoFocusButton: "confirm"
  },
  argTypes: {
    titleText: { control: "text" },
    descriptionText: { control: "text" },
    size: { control: "select", options: ["sm", "md", "lg"] },
    intent: { control: "select", options: ["default", "danger", "warning", "info"] },
    preventEscapeClose: { control: "boolean" },
    cancelText: { control: "text" },
    confirmText: { control: "text" },
    cancelVariant: { control: "select", options: ["primary", "secondary", "danger", "ghost", "outline"] },
    confirmVariant: { control: "select", options: ["primary", "secondary", "danger", "ghost", "outline"] },
    cancelDisabled: { control: "boolean" },
    confirmDisabled: { control: "boolean" },
    confirmLoading: { control: "boolean" },
    closeOnConfirm: { control: "boolean" },
    autoFocusButton: { control: "select", options: ["confirm", "cancel", "none"] }
  }
};

export default meta;
type Story = StoryObj<AlertConfirmStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(false);

    return (
      <AlertConfirm open={open} onOpenChange={setOpen}>
        <AlertConfirmTrigger asChild>
          <Button variant="secondary">AlertConfirm 열기</Button>
        </AlertConfirmTrigger>
        <AlertConfirmContent size={args.size} intent={args.intent} preventEscapeClose={args.preventEscapeClose}>
          <AlertConfirmHeader>
            <AlertConfirmTitle>{args.titleText}</AlertConfirmTitle>
            <AlertConfirmDescription>{args.descriptionText}</AlertConfirmDescription>
          </AlertConfirmHeader>
          <AlertConfirmFooter
            cancelText={args.cancelText}
            confirmText={args.confirmText}
            cancelVariant={args.cancelVariant}
            confirmVariant={args.confirmVariant}
            cancelDisabled={args.cancelDisabled}
            confirmDisabled={args.confirmDisabled}
            confirmLoading={args.confirmLoading}
            closeOnConfirm={args.closeOnConfirm}
            autoFocusButton={args.autoFocusButton}
            onCancel={() => setOpen(false)}
            onConfirm={() => {
              if (args.closeOnConfirm) {
                setOpen(false);
              }
            }}
          />
        </AlertConfirmContent>
      </AlertConfirm>
    );
  }
};
