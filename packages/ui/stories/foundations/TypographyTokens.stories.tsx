import type { Meta, StoryObj } from "@storybook/react";
import { TYPOGRAPHY_TOKENS } from "../../index";

const meta: Meta = {
  title: "Foundations/Typography Tokens"
};

export default meta;
type Story = StoryObj;

function TypographyPreview() {
  const rows = [
    { name: "headingXl", className: "text-heading-xl font-bold", text: "실시간 협업 인터페이스 헤드라인" },
    { name: "headingLg", className: "text-heading-lg font-semibold", text: "섹션 타이틀은 한눈에 읽혀야 합니다." },
    { name: "headingMd", className: "text-heading-md font-semibold", text: "서브 섹션 제목" },
    { name: "bodyMd", className: "text-body text-foreground", text: "본문은 가독성이 가장 중요합니다." },
    { name: "bodySm", className: "text-body-sm text-foreground", text: "보조 본문 텍스트 크기" },
    { name: "caption", className: "text-caption text-muted", text: "캡션/메타 정보 텍스트" }
  ] as const;

  return (
    <div className="w-[860px] space-y-3">
      {rows.map((row) => (
        <div key={row.name} className="border-default bg-surface rounded-lg border p-4">
          <p className={row.className}>{row.text}</p>
          <p className="text-caption text-muted mt-2">
            {row.name}: {TYPOGRAPHY_TOKENS[row.name]}
          </p>
        </div>
      ))}
    </div>
  );
}

export const Showcase: Story = {
  render: () => <TypographyPreview />
};
