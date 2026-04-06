import * as React from "react";
import { PRIMITIVE_COLOR_PALETTE, SEMANTIC_COLOR_TOKENS } from "../../../index";

type SemanticTokenKey = keyof typeof SEMANTIC_COLOR_TOKENS;

type TokenGroup = {
  title: string;
  description?: string;
  items: Array<{ name: SemanticTokenKey; cssVar: string }>;
};

const semanticGroups: TokenGroup[] = [
  {
    title: "Surface",
    description: "페이지/패널 배경 계층",
    items: [
      { name: "background", cssVar: "var(--color-bg-canvas)" },
      { name: "surface", cssVar: "var(--color-bg-surface)" },
      { name: "surfaceElevated", cssVar: "var(--color-bg-surface-raised)" },
      { name: "border", cssVar: "var(--color-border-default)" }
    ]
  },
  {
    title: "Text",
    description: "본문/보조 텍스트",
    items: [
      { name: "foreground", cssVar: "var(--color-fg-default)" },
      { name: "muted", cssVar: "var(--color-fg-muted)" },
      { name: "subtle", cssVar: "var(--color-fg-subtle)" }
    ]
  },
  {
    title: "Brand",
    description: "브랜드 액션 계열",
    items: [
      { name: "primary", cssVar: "var(--color-accent-primary)" },
      { name: "primaryForeground", cssVar: "var(--color-fg-on-accent)" }
    ]
  },
  {
    title: "Feedback",
    description: "상태/알림 계열",
    items: [
      { name: "success", cssVar: "var(--color-feedback-success)" },
      { name: "successForeground", cssVar: "var(--color-fg-on-success)" },
      { name: "warning", cssVar: "var(--color-feedback-warning)" },
      { name: "warningForeground", cssVar: "var(--color-fg-on-warning)" },
      { name: "danger", cssVar: "var(--color-feedback-danger)" },
      { name: "dangerForeground", cssVar: "var(--color-fg-on-danger)" },
      { name: "info", cssVar: "var(--color-feedback-info)" },
      { name: "infoForeground", cssVar: "var(--color-fg-on-info)" }
    ]
  }
];

const primitiveFamilyOrder = [
  "BLUE",
  "INDIGO",
  "NATURAL",
  "GRAY",
  "GREEN",
  "RED",
  "YELLOW",
  "SKY",
  "ORANGE",
  "MINT",
  "PURPLE"
] as const;

const primitiveSpecialKeys = ["BRAND", "WHITE", "BLACK", "TEXT", "TEXT_COLOR", "TABLE_HEADER"] as const;

const primitiveFamilyMap = Object.entries(PRIMITIVE_COLOR_PALETTE).reduce<Record<string, Array<[string, string]>>>(
  (acc, [name, hex]) => {
    const family = name.includes("_") ? name.split("_")[0] : "SPECIAL";
    if (!acc[family]) acc[family] = [];
    acc[family].push([name, hex]);
    return acc;
  },
  {}
);

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <header className="space-y-1">
        <h3 className="text-body-md text-foreground font-semibold">{title}</h3>
        {description ? <p className="text-caption text-muted">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Swatch({ name, value, styleValue }: { name: string; value: string; styleValue: string }) {
  return (
    <div className="border-default bg-surface rounded-lg border p-3">
      <div className="border-default h-10 rounded-md border" style={{ background: styleValue }} />
      <p className="text-body-sm text-foreground mt-2 font-semibold">{name}</p>
      <p className="text-caption text-muted break-all">{value}</p>
    </div>
  );
}

export function SemanticColorTokenView() {
  return (
    <div className="w-full max-w-[980px] space-y-6">
      {semanticGroups.map((group) => (
        <Section key={group.title} title={group.title} description={group.description}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map(({ name, cssVar }) => (
              <Swatch key={name} name={name} value={SEMANTIC_COLOR_TOKENS[name]} styleValue={`rgb(${cssVar})`} />
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

export function PrimitiveColorTokenView() {
  return (
    <div className="w-full max-w-[980px] space-y-6">
      <Section title="Special" description="브랜드/기본 색상">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {primitiveSpecialKeys.map((key) => {
            const value = PRIMITIVE_COLOR_PALETTE[key];
            return <Swatch key={key} name={key} value={value} styleValue={value} />;
          })}
        </div>
      </Section>

      {primitiveFamilyOrder.map((family) => {
        const entries = (primitiveFamilyMap[family] ?? []).sort((a, b) => b[0].localeCompare(a[0]));
        if (entries.length === 0) return null;

        return (
          <Section key={family} title={family}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {entries.map(([name, value]) => (
                <Swatch key={name} name={name} value={value} styleValue={value} />
              ))}
            </div>
          </Section>
        );
      })}
    </div>
  );
}
