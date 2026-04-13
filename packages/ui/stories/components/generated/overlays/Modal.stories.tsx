import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  Textarea,
  Switch,
  Badge
} from "../../../../index";

type ModalStoryArgs = {
  titleText: string;
  descriptionText: string;
  size: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  intent: "default" | "danger" | "warning" | "info";
  closeOnEscape: boolean;
  closeOnOutsideClick: boolean;
  hideCloseButton: boolean;
  scrollBehavior: "inside" | "outside";
  cancelText: string;
  confirmText: string;
  cancelVariant: "primary" | "secondary" | "danger" | "ghost" | "outline";
  confirmVariant: "primary" | "secondary" | "danger" | "ghost" | "outline";
  cancelDisabled: boolean;
  confirmDisabled: boolean;
  confirmLoading: boolean;
  closeOnConfirm: boolean;
  autoFocusButton: "confirm" | "cancel" | "none";
  align: "start" | "center" | "end" | "between";
  sticky: boolean;
  showCancelButton: boolean;
  showConfirmButton: boolean;
  fullWidthActions: boolean;
};

const meta: Meta<ModalStoryArgs> = {
  title: "Components/Modal",
  id: "components-generated-overlays-dialog",
  component: ModalContent,
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: {
    titleText: "문서 설정",
    descriptionText: "문서 접근 권한과 보호 키를 관리할 수 있습니다.",
    size: "md",
    intent: "default",
    closeOnEscape: true,
    closeOnOutsideClick: true,
    hideCloseButton: false,
    scrollBehavior: "inside",
    cancelText: "취소",
    confirmText: "저장",
    cancelVariant: "outline",
    confirmVariant: "primary",
    cancelDisabled: false,
    confirmDisabled: false,
    confirmLoading: false,
    closeOnConfirm: true,
    autoFocusButton: "none",
    align: "end",
    sticky: false,
    showCancelButton: true,
    showConfirmButton: true,
    fullWidthActions: false
  },
  argTypes: {
    titleText: { control: "text" },
    descriptionText: { control: "text" },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl", "full"] },
    intent: { control: "select", options: ["default", "danger", "warning", "info"] },
    closeOnEscape: { control: "boolean" },
    closeOnOutsideClick: { control: "boolean" },
    hideCloseButton: { control: "boolean" },
    scrollBehavior: { control: "select", options: ["inside", "outside"] },
    cancelText: { control: "text" },
    confirmText: { control: "text" },
    cancelVariant: { control: "select", options: ["primary", "secondary", "danger", "ghost", "outline"] },
    confirmVariant: { control: "select", options: ["primary", "secondary", "danger", "ghost", "outline"] },
    cancelDisabled: { control: "boolean" },
    confirmDisabled: { control: "boolean" },
    confirmLoading: { control: "boolean" },
    closeOnConfirm: { control: "boolean" },
    autoFocusButton: { control: "select", options: ["confirm", "cancel", "none"] },
    align: { control: "select", options: ["start", "center", "end", "between"] },
    sticky: { control: "boolean" },
    showCancelButton: { control: "boolean" },
    showConfirmButton: { control: "boolean" },
    fullWidthActions: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<ModalStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    const [title, setTitle] = React.useState("협업 문서");
    const [role, setRole] = React.useState("viewer");
    const [memo, setMemo] = React.useState("");
    const [notifyOnUpdate, setNotifyOnUpdate] = React.useState(true);

    return (
      <Modal open={open} onOpenChange={setOpen}>
        <ModalTrigger asChild>
          <Button variant="outline">설정 모달 열기</Button>
        </ModalTrigger>
        <ModalContent
          size={args.size}
          intent={args.intent}
          closeOnEscape={args.closeOnEscape}
          closeOnOutsideClick={args.closeOnOutsideClick}
          hideCloseButton={args.hideCloseButton}
          scrollBehavior={args.scrollBehavior}
        >
          <ModalHeader>
            <ModalTitle>{args.titleText}</ModalTitle>
            <ModalDescription>{args.descriptionText}</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="info">문서 설정</Badge>
                <Badge variant="outline">실시간 저장</Badge>
              </div>
              <Input
                label="문서 제목"
                placeholder="문서 제목을 입력하세요"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Select
                label="기본 권한"
                value={role}
                onChange={(next) => setRole(String(next ?? "viewer"))}
                options={[
                  { label: "viewer", value: "viewer" },
                  { label: "editor", value: "editor" },
                  { label: "admin", value: "admin" }
                ]}
              />
              <Switch
                label="업데이트 알림"
                description="문서 변경 시 토스트/이메일 알림을 전송합니다."
                checked={notifyOnUpdate}
                onCheckedChange={setNotifyOnUpdate}
              />
              <Textarea
                label="운영 메모"
                placeholder="팀 공지 또는 접근 정책을 입력하세요."
                rows={4}
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
              />
            </section>
            <section className="space-y-2">
              <h4 className="text-body-sm text-foreground font-semibold">최근 변경 이력</h4>
              <div className="border-default bg-surface-elevated max-h-40 space-y-2 overflow-y-auto rounded-[var(--radius-md)] border p-3">
                {[
                  "권한이 editor로 변경되었습니다.",
                  "보호 키 정책이 업데이트되었습니다.",
                  "자동 저장 주기가 10초로 조정되었습니다.",
                  "문서 공개 범위가 팀 내부로 설정되었습니다.",
                  "알림 채널이 슬랙으로 동기화되었습니다."
                ].map((item) => (
                  <p key={item} className="text-body-sm text-muted">
                    • {item}
                  </p>
                ))}
              </div>
            </section>
          </ModalBody>
          <ModalFooter
            cancelText={args.cancelText}
            confirmText={args.confirmText}
            cancelVariant={args.cancelVariant}
            confirmVariant={args.confirmVariant}
            cancelDisabled={args.cancelDisabled}
            confirmDisabled={args.confirmDisabled}
            confirmLoading={args.confirmLoading}
            closeOnConfirm={args.closeOnConfirm}
            autoFocusButton={args.autoFocusButton}
            align={args.align}
            sticky={args.sticky}
            showCancelButton={args.showCancelButton}
            showConfirmButton={args.showConfirmButton}
            fullWidthActions={args.fullWidthActions}
            onCancel={() => setOpen(false)}
            onConfirm={() => {
              if (args.closeOnConfirm) {
                setOpen(false);
              }
            }}
          />
        </ModalContent>
      </Modal>
    );
  }
};
