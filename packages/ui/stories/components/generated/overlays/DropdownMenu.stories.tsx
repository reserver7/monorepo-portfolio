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
