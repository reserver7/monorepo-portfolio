import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FileText, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
  Button
} from "../../../../index";

type DropdownMenuStoryArgs = {
  triggerText: string;
  sideOffset: number;
  contentSize: "sm" | "md" | "lg";
  itemSize: "sm" | "md" | "lg";
  showDangerItem: boolean;
  keepOpenOnSelect: boolean;
  showLabel: boolean;
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
  for (const key of ["children","leftIcon","rightIcon","prefix","suffix","label","helperText","errorMessage","title","description","helper"]) {
    if (!isRenderableNode(next[key])) delete next[key];
  }
  return next;
};

const meta: Meta<DropdownMenuStoryArgs> = {
  title: "Components/DropdownMenu",
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: {
    triggerText: "메뉴 열기",
    sideOffset: 4,
    contentSize: "md",
    itemSize: "md",
    showDangerItem: true,
    keepOpenOnSelect: false,
    showLabel: true
  },
  argTypes: {
    triggerText: { control: "text" },
    sideOffset: { control: { type: "number", min: 0, max: 24, step: 1 } },
    contentSize: { control: "inline-radio", options: ["sm", "md", "lg"] },
    itemSize: { control: "inline-radio", options: ["sm", "md", "lg"] },
    showDangerItem: { control: "boolean" },
    keepOpenOnSelect: { control: "boolean" },
    showLabel: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<DropdownMenuStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const [favorite, setFavorite] = React.useState(true);
    const [role, setRole] = React.useState("viewer");

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{args.triggerText}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={args.sideOffset} size={args.contentSize}>
          {args.showLabel ? <DropdownMenuLabel size={args.itemSize}>문서 작업</DropdownMenuLabel> : null}
          <DropdownMenuItem
            size={args.itemSize}
            keepOpenOnSelect={args.keepOpenOnSelect}
            leftSlot={<FileText className="h-4 w-4" />}
            rightSlot={<DropdownMenuShortcut>Cmd+D</DropdownMenuShortcut>}
          >
            복제
          </DropdownMenuItem>
          <DropdownMenuItem
            size={args.itemSize}
            keepOpenOnSelect={args.keepOpenOnSelect}
            leftSlot={<Pencil className="h-4 w-4" />}
            rightSlot={<DropdownMenuShortcut>Cmd+R</DropdownMenuShortcut>}
          >
            이름 변경
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={favorite}
            size={args.itemSize}
            keepOpenOnSelect={args.keepOpenOnSelect}
            onCheckedChange={(checked) => setFavorite(Boolean(checked))}
          >
            즐겨찾기 고정
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={role} onValueChange={setRole}>
            <DropdownMenuRadioItem value="viewer" size={args.itemSize} keepOpenOnSelect={args.keepOpenOnSelect}>
              viewer
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="editor" size={args.itemSize} keepOpenOnSelect={args.keepOpenOnSelect}>
              editor
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          {args.showDangerItem ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem color="danger" size={args.itemSize} leftSlot={<Trash2 className="h-4 w-4" />}>
                삭제
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
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
          DropdownMenu
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <DropdownMenu
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">크기 md</div>
            <DropdownMenu
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              {...({ "size": "md" } as Record<string, unknown>)}
             />
          </div>
      </div>
    </section>
  )
};


const OPTION_MATRIX = {
  "size": [
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
            DropdownMenu
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
                      <DropdownMenu
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
          DropdownMenu
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <DropdownMenu
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
             />
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-1">레이아웃 배치 예시</div>
          <div className="text-caption text-muted mb-2">실제 화면 배치에서 기본 상태를 검증합니다.</div>
          <div className="min-h-10">
            <DropdownMenu
                {...sanitizeStoryArgs(args as Record<string, unknown>)}
               />
          </div>
        </div>
      </div>
    </section>
  )
};
