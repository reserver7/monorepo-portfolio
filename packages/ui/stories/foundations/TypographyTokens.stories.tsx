import type { Meta, StoryObj } from "@storybook/react";
import { TYPOGRAPHY_TOKENS } from "../../index";

const meta: Meta = {
  title: "Foundations/Typography Tokens"
};

export default meta;
type Story = StoryObj;

function TypographyPreview() {
  const rows = [
    { name: "headingXl", className: "font-display text-heading-xl text-foreground", text: "Brand-Style Display Hero" },
    { name: "headingLg", className: "font-display text-heading-lg text-foreground", text: "Section Headline with Tight Rhythm" },
    { name: "headingMd", className: "font-display text-heading-md text-foreground", text: "Tile Heading" },
    { name: "title", className: "font-display text-title text-foreground", text: "Card Title / Sub-heading" },
    { name: "bodyMd", className: "font-body text-body-md text-foreground", text: "본문은 가독성과 정보 밀도의 균형이 가장 중요합니다." },
    { name: "bodySm", className: "font-body text-body-sm text-foreground", text: "보조 본문 텍스트 크기" },
    { name: "caption", className: "font-body text-caption text-muted", text: "캡션/메타 정보 텍스트" },
    { name: "micro", className: "font-body text-micro text-muted", text: "fine print / legal" }
  ] as const;

  return (
    <div className="w-[980px] max-w-full space-y-3">
      {rows.map((row) => (
        <div key={row.name} className="border-default bg-surface rounded-[var(--radius-md)] border p-4">
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
