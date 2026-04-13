import * as React from "react";
import { PRIMITIVE_COLOR_PALETTE, SEMANTIC_COLOR_TOKENS } from "../../../index";

type SemanticTokenKey = keyof typeof SEMANTIC_COLOR_TOKENS;

type TokenGroup = {
  title: string;
  description?: string;
  items: Array<{
    name: SemanticTokenKey;
    cssVar: string;
    preview?: {
      mode: "text" | "swatch";
      backgroundCssVar?: string;
      sampleLabel?: string;
    };
  }>;
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
      {
        name: "text",
        cssVar: "var(--color-fg-default)",
        preview: { mode: "text", backgroundCssVar: "var(--color-bg-surface)", sampleLabel: "Body Text" }
      },
      {
        name: "muted",
        cssVar: "var(--color-fg-muted)",
        preview: { mode: "text", backgroundCssVar: "var(--color-bg-surface)", sampleLabel: "Muted Text" }
      },
      {
        name: "subtle",
        cssVar: "var(--color-fg-subtle)",
        preview: { mode: "text", backgroundCssVar: "var(--color-bg-surface)", sampleLabel: "Subtle Text" }
      }
    ]
  },
  {
    title: "Interactive",
    description: "클릭/탭 가능한 인터랙션 전용 색상",
    items: [
      { name: "primary", cssVar: "var(--color-accent-primary)" },
      {
        name: "link",
        cssVar: "var(--color-accent-link)",
        preview: { mode: "text", backgroundCssVar: "var(--color-bg-surface)", sampleLabel: "Learn more" }
      },
      {
        name: "linkDark",
        cssVar: "var(--color-accent-link-dark)",
        preview: { mode: "text", backgroundCssVar: "var(--color-fg-default)", sampleLabel: "Learn more" }
      },
      {
        name: "primaryText",
        cssVar: "var(--color-fg-on-accent)",
        preview: { mode: "text", backgroundCssVar: "var(--color-accent-primary)", sampleLabel: "Primary Text" }
      }
    ]
  },
  {
    title: "Feedback",
    description: "상태/알림 계열",
    items: [
      { name: "success", cssVar: "var(--color-feedback-success)" },
      {
        name: "successText",
        cssVar: "var(--color-fg-on-success)",
        preview: { mode: "text", backgroundCssVar: "var(--color-feedback-success)", sampleLabel: "Success Text" }
      },
      { name: "warning", cssVar: "var(--color-feedback-warning)" },
      {
        name: "warningText",
        cssVar: "var(--color-fg-on-warning)",
        preview: { mode: "text", backgroundCssVar: "var(--color-feedback-warning)", sampleLabel: "Warning Text" }
      },
      { name: "danger", cssVar: "var(--color-feedback-danger)" },
      {
        name: "dangerText",
        cssVar: "var(--color-fg-on-danger)",
        preview: { mode: "text", backgroundCssVar: "var(--color-feedback-danger)", sampleLabel: "Danger Text" }
      },
      { name: "info", cssVar: "var(--color-feedback-info)" },
      {
        name: "infoText",
        cssVar: "var(--color-fg-on-info)",
        preview: { mode: "text", backgroundCssVar: "var(--color-feedback-info)", sampleLabel: "Info Text" }
      }
    ]
  }
];

const feedbackStateCards: Array<{
  key: "success" | "warning" | "danger" | "info";
  label: string;
  bgVar: string;
  textVar: string;
}> = [
  { key: "success", label: "Success", bgVar: "var(--color-feedback-success)", textVar: "var(--color-fg-on-success)" },
  { key: "warning", label: "Warning", bgVar: "var(--color-feedback-warning)", textVar: "var(--color-fg-on-warning)" },
  { key: "danger", label: "Danger", bgVar: "var(--color-feedback-danger)", textVar: "var(--color-fg-on-danger)" },
  { key: "info", label: "Info", bgVar: "var(--color-feedback-info)", textVar: "var(--color-fg-on-info)" }
];

const primitiveFamilyOrder = [
  "BLUE",
  "NATURAL",
  "GREEN",
  "RED",
  "YELLOW",
  "SKY",
  "ORANGE",
  "PURPLE",
  "INDIGO"
] as const;

const primitiveSpecialKeys = ["BRAND", "WHITE", "BLACK", "TEXT"] as const;

const primitiveFamilyMap = Object.entries(PRIMITIVE_COLOR_PALETTE).reduce<Record<string, Array<[string, string]>>>(
  (acc, [name, hex]) => {
    const family = name.includes("_") ? name.split("_")[0] : "SPECIAL";
    if (!acc[family]) acc[family] = [];
    acc[family].push([name, hex]);
    return acc;
  },
  {}
);

const getTokenScale = (tokenName: string): number | null => {
  const [, scale] = tokenName.split("_");
  if (!scale) return null;
  const parsed = Number.parseInt(scale, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const comparePrimitiveToken = (a: [string, string], b: [string, string]) => {
  const aScale = getTokenScale(a[0]);
  const bScale = getTokenScale(b[0]);

  if (aScale !== null && bScale !== null) {
    return bScale - aScale;
  }

  return a[0].localeCompare(b[0]);
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <header className="space-y-1">
        <h3 className="text-title text-foreground">{title}</h3>
        {description ? <p className="text-caption text-muted">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Swatch({
  name,
  value,
  styleValue,
  preview
}: {
  name: string;
  value: string;
  styleValue: string;
  preview?: {
    mode: "text" | "swatch";
    backgroundCssVar?: string;
    sampleLabel?: string;
  };
}) {
  const isTextPreview = preview?.mode === "text";
  const sampleBackgroundToken = preview?.backgroundCssVar;
  const sampleBackground =
    sampleBackgroundToken ? `rgb(${sampleBackgroundToken})` : "rgb(var(--color-bg-surface))";
  const sampleLabel = preview?.sampleLabel ?? "Sample Text";

  return (
    <div className="border-default bg-surface rounded-[var(--radius-md)] border p-3">
      {isTextPreview ? (
        <div className="border-default flex h-10 items-center rounded-[var(--radius-sm)] border px-2" style={{ background: sampleBackground }}>
          <span className="text-caption font-semibold" style={{ color: styleValue }}>
            {sampleLabel}
          </span>
        </div>
      ) : (
        <div className="border-default h-10 rounded-[var(--radius-sm)] border" style={{ background: styleValue }} />
      )}
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
            {group.items.map(({ name, cssVar, preview }) => (
              <Swatch
                key={name}
                name={name}
                value={SEMANTIC_COLOR_TOKENS[name]}
                styleValue={`rgb(${cssVar})`}
                preview={preview}
              />
            ))}
          </div>
        </Section>
      ))}

      <Section
        title="Feedback Preview"
        description="상태별 배경/보더/텍스트 색을 실제 컴포넌트 카드 형태로 미리 확인합니다."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {feedbackStateCards.map((state) => (
            <article
              key={state.key}
              className="rounded-[var(--radius-md)] border p-4"
              style={{
                background: `rgb(${state.bgVar})`,
                borderColor: `rgb(${state.bgVar})`,
                color: `rgb(${state.textVar})`
              }}
            >
              <p className="text-body-sm font-semibold">{state.label}</p>
              <p className="text-caption mt-1 opacity-90">Button / Badge / Alert 텍스트 대비 확인</p>
              <div className="mt-3 rounded-[var(--radius-sm)] border border-white/30 bg-white/10 px-2 py-1 text-caption">
                {state.key} / {state.key}Text
              </div>
            </article>
          ))}
        </div>
      </Section>
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
        const entries = [...(primitiveFamilyMap[family] ?? [])].sort(comparePrimitiveToken);
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
