import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Input, Select } from "../../index";

const roleOptions = [
  { label: "editor (편집 가능)", value: "editor" },
  { label: "viewer (보기 전용)", value: "viewer" }
];

const meta: Meta = {
  title: "Patterns/Form Row"
};

export default meta;
type Story = StoryObj;

export const CreateRoomRow: Story = {
  render: () => {
    const [name, setName] = React.useState("게스트-923");
    const [title, setTitle] = React.useState("협업 문서");
    const [role, setRole] = React.useState<string | null>("viewer");

    return (
      <div className="w-[980px] rounded-xl border border-default bg-surface p-6">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-3">
          <Input label="표시 이름" value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="새 문서 제목" value={title} onChange={(event) => setTitle(event.target.value)} />
          <div>
            <p className="mb-2 text-body-sm font-medium text-foreground">입장 권한</p>
            <Select options={roleOptions} value={role} onChange={(next) => setRole((next as string) ?? null)} />
          </div>
          <Button size="lg">새 문서 만들기</Button>
        </div>
      </div>
    );
  }
};
