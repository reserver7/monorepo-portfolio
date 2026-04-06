import fs from "node:fs/promises";
import path from "node:path";
import { parseExportedNames } from "./lib/ui-storybook-targets.mjs";

const ROOT = process.cwd();
const COMPONENT_INDEX_PATH = path.join(ROOT, "packages/ui/components/index.ts");
const STORIES_ROOT = path.join(ROOT, "packages/ui/stories");
const GENERATED_STORIES_DIR = path.join(STORIES_ROOT, "components/generated");
const LEGACY_AUTO_STORIES_DIR = path.join(STORIES_ROOT, "components/auto");

const CATEGORY_RULES = [
  { key: "actions", title: "Actions", match: /^(Button)$/ },
  {
    key: "forms-primitives",
    title: "Forms Primitives",
    match: /^(Input|Textarea|Select|Checkbox|Switch|RadioGroup|Label|FormField|DatePicker|Calendar)$/
  },
  {
    key: "overlays",
    title: "Overlays",
    match: /^(Dialog|AlertDialog|DropdownMenu|Popover|Sheet|Tooltip)$/
  },
  {
    key: "feedback",
    title: "Feedback",
    match: /^(ErrorBoundary|Progress|Skeleton|Spinner|StateView|Toaster)$/
  },
  {
    key: "data",
    title: "Data",
    match: /^(Avatar|Badge|Card|StatCard|Typography|Table|DataTable)$/
  },
  { key: "navigation", title: "Navigation", match: /^(Accordion|Tabs)$/ },
  { key: "layout", title: "Layout", match: /^(ScrollArea)$/ }
];

const resolveCategory = (componentName) => {
  const found = CATEGORY_RULES.find((rule) => rule.match.test(componentName));
  if (found) return found;
  return { key: "misc", title: "Misc" };
};

const COMPONENT_DEFAULT_ARGS = {
  Button: { children: "Button" },
  Badge: { children: "Badge" },
  Label: { children: "Label" },
  Typography: { children: "Typography" }
};

const COMPONENT_BASE_ARGS = {
  Select: {
    label: "",
    options: [
      { label: "옵션 A", value: "a" },
      { label: "옵션 B", value: "b" },
      { label: "옵션 C", value: "c" }
    ],
    placeholder: "선택하세요",
    disabled: false,
    searchable: false,
    multiple: false,
    loading: false
  },
  Input: {
    label: "",
    placeholder: "값을 입력하세요",
    required: false,
    disabled: false,
    readOnly: false,
    clearable: false
  },
  Checkbox: {
    label: "약관에 동의합니다",
    disabled: false,
    required: false,
    indeterminate: false
  },
  RadioGroup: {
    label: "",
    options: [
      { label: "viewer", value: "viewer" },
      { label: "editor", value: "editor" }
    ],
    defaultValue: "viewer",
    disabled: false,
    required: false
  },
  Switch: {
    defaultChecked: true
  },
  Textarea: {
    label: "",
    placeholder: "내용을 입력하세요",
    disabled: false,
    required: false,
    readOnly: false,
    showCount: false,
    rows: 4,
    maxLength: 200
  },
  DatePicker: {
    mode: "single",
    label: "",
    placeholder: "날짜를 선택하세요",
    disabled: false,
    required: false,
    readOnly: false,
    clearable: true,
    minDate: "2026-01-01",
    maxDate: "2026-12-31"
  },
  StateView: {
    title: "상태 제목",
    description: "상태 설명"
  },
  StatCard: {
    label: "지표",
    value: "128",
    helper: "전일 대비 +12%"
  },
  FormField: {
    label: "필드 라벨",
    description: "필드 설명",
    requiredMark: false
  }
};

const COMPONENT_OPTION_CATALOG = {
  Button: {
    variant: ["primary", "secondary", "danger", "ghost", "outline"],
    size: ["sm", "md", "lg"],
    shape: ["default", "rounded", "pill"],
    fullWidth: [false, true]
  },
  Input: {
    size: ["sm", "md", "lg"],
    variant: ["default", "outline", "filled", "ghost"],
    status: ["default", "error", "success"]
  },
  Checkbox: {
    size: ["sm", "md"]
  },
  RadioGroup: {
    size: ["sm", "md"]
  },
  DatePicker: {
    mode: ["single", "range"],
    size: ["sm", "md", "lg"],
    variant: ["default", "outline", "filled", "ghost"],
    status: ["default", "error", "success"]
  },
  Switch: {
    size: ["sm", "md"],
    color: ["primary", "success", "warning", "danger"]
  },
  Select: {
    size: ["sm", "md", "lg"],
    variant: ["default", "filled", "ghost"],
    state: ["default", "error", "success"]
  },
  Textarea: {
    size: ["sm", "md", "lg"],
    variant: ["default", "filled", "ghost"],
    state: ["default", "error", "success"],
    resize: ["none", "vertical", "horizontal", "both"]
  },
  Badge: {
    variant: ["default", "secondary", "outline", "success", "warning", "danger", "destructive", "info"],
    size: ["sm", "md", "lg"],
    shape: ["pill", "rounded", "square"]
  },
  Card: {
    variant: ["default", "elevated", "muted", "ghost"]
  },
  Table: {
    density: ["compact", "default", "comfortable"],
    stickyHeader: [false, true]
  },
  Typography: {
    variant: ["h1", "h2", "h3", "title", "body", "bodySm", "caption", "label"],
    tone: ["default", "muted", "subtle", "primary", "success", "warning", "danger", "info"]
  },
  Spinner: {
    size: ["sm", "md", "lg"],
    tone: ["default", "primary", "danger"]
  },
  StateView: {
    variant: ["info", "success", "warning", "error", "empty", "loading"],
    size: ["sm", "md", "lg"]
  },
  StatCard: {
    tone: ["default", "primary", "warning", "danger"],
    size: ["sm", "md", "lg"]
  },
  FormField: {
    size: ["sm", "md", "lg"]
  }
};

const COMPONENT_OPTION_MATRIX_KEYS = {
  Button: ["variant", "size"],
  Input: ["variant", "status"],
  Checkbox: ["size"],
  RadioGroup: ["size"],
  DatePicker: ["mode", "variant", "status"],
  Switch: ["size", "color"],
  Select: ["variant", "state"],
  Textarea: ["variant", "state", "resize"],
  Badge: ["variant"],
  Card: ["variant"],
  Table: ["density"],
  Typography: ["variant", "tone"],
  Spinner: ["size"],
  StateView: ["variant"],
  StatCard: ["tone"],
  FormField: ["size"]
};

const COMPONENT_IMPORTANT_OPTION_KEYS = {
  Button: ["variant", "size", "shape"],
  Input: ["variant", "size", "status"],
  Checkbox: ["size"],
  RadioGroup: ["size"],
  DatePicker: ["mode", "variant", "size", "status"],
  Switch: ["size", "color"],
  Select: ["variant", "size", "state"],
  Textarea: ["variant", "size", "state", "resize"],
  Badge: ["variant", "size"],
  Card: ["variant"],
  Table: ["density"],
  Typography: ["variant", "tone"],
  Spinner: ["size", "tone"],
  StateView: ["variant", "size"],
  StatCard: ["tone", "size"],
  FormField: ["size"]
};

const COMPONENT_OPTION_DEFAULTS = {
  Button: { variant: "primary", size: "md", shape: "default", fullWidth: false },
  Input: { size: "md", variant: "default", status: "default" },
  Checkbox: { size: "sm", disabled: false, required: false, indeterminate: false },
  RadioGroup: { size: "sm", disabled: false, required: false },
  DatePicker: { mode: "single", size: "md", variant: "default", status: "default" },
  Switch: { size: "sm", color: "primary", disabled: false, loading: false },
  Select: {
    size: "md",
    variant: "default",
    state: "default",
    disabled: false,
    searchable: false,
    multiple: false,
    loading: false,
    maxVisibleItems: 8,
    maxTagCount: 2
  },
  Textarea: { size: "md", variant: "default", state: "default", resize: "vertical" },
  Badge: { variant: "default", size: "sm", shape: "pill" },
  Card: { variant: "default" },
  Table: { density: "default", stickyHeader: false },
  Typography: { variant: "body", tone: "default" },
  Spinner: { size: "md", tone: "default" },
  StateView: { variant: "info", size: "md" },
  StatCard: { tone: "default", size: "md" },
  FormField: { size: "md", requiredMark: false }
};

const COMPONENT_IMPORTANT_BOOLEAN_CONTROLS = {
  Button: ["disabled", "loading", "fullWidth"],
  Input: ["disabled", "required", "readOnly", "clearable"],
  Checkbox: ["disabled", "required", "indeterminate"],
  RadioGroup: ["disabled", "required"],
  DatePicker: ["disabled", "required", "readOnly", "clearable"],
  Switch: ["disabled", "loading"],
  Select: ["disabled", "searchable", "multiple", "loading"],
  Textarea: ["disabled", "required", "readOnly", "showCount"],
  Table: ["stickyHeader"],
  FormField: ["requiredMark"]
};

const COMPONENT_IMPORTANT_NUMBER_CONTROLS = {
  Select: ["maxVisibleItems", "maxTagCount"],
  Textarea: ["rows", "maxLength"]
};

const GLOBAL_CONTROL_OFF_PROPS = ["children", "asChild", "leftIcon", "rightIcon"];
const GLOBAL_CONTROLS_EXCLUDE_CODE = `[
  "className",
  "containerClassName",
  "labelClassName",
  "helperClassName",
  "optionClassName",
  "optionLabelClassName",
  "optionDescriptionClassName",
  "style",
  "id",
  "name",
  /^on[A-Z].*/,
  /.*ClassName$/
]`;
const RENDERABLE_NODE_PROP_KEYS = [
  "children",
  "leftIcon",
  "rightIcon",
  "prefix",
  "suffix",
  "label",
  "helperText",
  "errorMessage",
  "title",
  "description",
  "helper"
];
const COMPONENT_TEXT_CONTROL_PROPS = {
  Select: ["label", "helperText", "errorMessage"],
  Input: ["label", "helperText", "errorMessage"],
  DatePicker: ["label", "helperText", "errorMessage", "minDate", "maxDate"],
  Checkbox: ["label", "helperText", "errorMessage"],
  RadioGroup: ["helperText", "errorMessage"],
  Textarea: ["label", "helperText", "errorMessage"],
  FormField: ["label", "description"],
  StateView: ["title", "description"],
  StatCard: ["label", "helper"]
};

const OPTION_ORDER_PRIORITY = [
  "variant",
  "color",
  "size",
  "shape",
  "tone",
  "state",
  "status",
  "density",
  "stickyHeader",
  "interactive",
  "disabled",
  "loading",
  "clearable",
  "searchable",
  "multiple"
];

const BOOLEAN_STATE_LABELS = {
  disabled: "비활성화",
  loading: "로딩",
  required: "필수",
  readOnly: "읽기 전용",
  clearable: "초기화 가능",
  indeterminate: "중간 상태",
  searchable: "검색 활성화",
  multiple: "다중 선택",
  fullWidth: "전체 너비"
};

const COMPONENT_STATE_OVERRIDE_ARGS = {
  Switch: {
    disabled: { defaultChecked: false }
  }
};

const sortOptionEntries = (optionsByProp) => {
  const rank = new Map(OPTION_ORDER_PRIORITY.map((name, index) => [name, index]));

  return Object.entries(optionsByProp).sort(([a], [b]) => {
    const aRank = rank.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bRank = rank.get(b) ?? Number.MAX_SAFE_INTEGER;

    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
  });
};

const getComponentArgs = (componentName) => ({
  ...(COMPONENT_BASE_ARGS[componentName] ?? {}),
  ...(COMPONENT_OPTION_DEFAULTS[componentName] ?? {}),
  ...(COMPONENT_DEFAULT_ARGS[componentName] ?? {})
});

const toArgsBlock = (componentName) => {
  const args = getComponentArgs(componentName);

  if (Object.keys(args).length === 0) return "";

  const entries = Object.entries(args)
    .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)
    .join(",\n");

  return `  args: {\n${entries}\n  },\n`;
};

const toArgTypesBlock = (componentName) => {
  const optionsByProp = COMPONENT_OPTION_CATALOG[componentName];
  const importantOptionKeys = COMPONENT_IMPORTANT_OPTION_KEYS[componentName] ?? [];
  const orderedEntries = optionsByProp
    ? sortOptionEntries(
        Object.fromEntries(Object.entries(optionsByProp).filter(([prop]) => importantOptionKeys.includes(prop)))
      )
    : [];
  const defaultsByProp = COMPONENT_OPTION_DEFAULTS[componentName] ?? {};
  const argsByProp = getComponentArgs(componentName);
  const booleanPropsFromArgs = Object.entries(argsByProp)
    .filter(([, value]) => typeof value === "boolean")
    .map(([prop]) => prop);
  const numberPropsFromArgs = Object.entries(argsByProp)
    .filter(([, value]) => typeof value === "number")
    .map(([prop]) => prop);

  const optionEntries = orderedEntries
    .map(([prop, options]) => {
      const defaultValue = defaultsByProp[prop];
      const defaultSummary =
        defaultValue === undefined ? "" : `, table: { defaultValue: { summary: ${JSON.stringify(defaultValue)} } }`;
      const isBooleanPair = Array.isArray(options) && options.length === 2 && options.includes(false) && options.includes(true);
      if (isBooleanPair) {
        return `    ${prop}: { control: "boolean"${defaultSummary} }`;
      }
      return `    ${prop}: { control: "select", options: ${JSON.stringify(options)}${defaultSummary} }`;
    })
    .join(",\n");

  const optionProps = new Set(orderedEntries.map(([prop]) => prop));
  const allowedBooleanControls = new Set(COMPONENT_IMPORTANT_BOOLEAN_CONTROLS[componentName] ?? []);
  const allowedNumberControls = new Set(COMPONENT_IMPORTANT_NUMBER_CONTROLS[componentName] ?? []);
  const textControlEntries = (COMPONENT_TEXT_CONTROL_PROPS[componentName] ?? [])
    .filter((prop) => !optionProps.has(prop) && !GLOBAL_CONTROL_OFF_PROPS.includes(prop))
    .map((prop) => {
      const defaultValue = argsByProp[prop];
      const defaultSummary =
        defaultValue === undefined ? "" : `, table: { defaultValue: { summary: ${JSON.stringify(defaultValue)} } }`;
      return `    ${prop}: { control: "text"${defaultSummary} }`;
    })
    .join(",\n");
  const booleanEntries = booleanPropsFromArgs
    .filter(
      (prop) =>
        !optionProps.has(prop) &&
        !GLOBAL_CONTROL_OFF_PROPS.includes(prop) &&
        allowedBooleanControls.has(prop)
    )
    .map((prop) => {
      const defaultValue = argsByProp[prop];
      return `    ${prop}: { control: "boolean", table: { defaultValue: { summary: ${JSON.stringify(defaultValue)} } } }`;
    })
    .join(",\n");
  const numberEntries = numberPropsFromArgs
    .filter(
      (prop) =>
        !optionProps.has(prop) &&
        !GLOBAL_CONTROL_OFF_PROPS.includes(prop) &&
        allowedNumberControls.has(prop)
    )
    .map((prop) => {
      const defaultValue = argsByProp[prop];
      return `    ${prop}: { control: { type: "number" }, table: { defaultValue: { summary: ${JSON.stringify(defaultValue)} } } }`;
    })
    .join(",\n");

  const globalOffEntries = GLOBAL_CONTROL_OFF_PROPS.map((prop) => `    ${prop}: { control: false }`).join(",\n");
  const merged = [optionEntries, textControlEntries, booleanEntries, numberEntries, globalOffEntries]
    .filter(Boolean)
    .join(",\n");
  if (!merged) return "";

  return `  argTypes: {\n${merged}\n  },\n`;
};

const toOptionMatrixStory = (componentName) => {
  const optionsByProp = COMPONENT_OPTION_CATALOG[componentName];
  if (!optionsByProp) return "";

  const matrixKeys = COMPONENT_OPTION_MATRIX_KEYS[componentName];
  if (!matrixKeys || matrixKeys.length === 0) return "";

  const filteredOptionsByProp = Object.fromEntries(
    Object.entries(optionsByProp).filter(([key]) => matrixKeys.includes(key))
  );
  if (Object.keys(filteredOptionsByProp).length === 0) return "";

  const children = COMPONENT_DEFAULT_ARGS[componentName]?.children;
  const jsxElementClose = children
    ? `>\n                ${children}\n              </${componentName}>`
    : " />";
  const orderedOptionMatrix = Object.fromEntries(sortOptionEntries(filteredOptionsByProp));
  const matrixConst = `const OPTION_MATRIX = ${JSON.stringify(orderedOptionMatrix, null, 2)} as const;\n`;
  const sanitizeArgsConst = `const sanitizeMatrixArgs = (args: Record<string, unknown>) => {
  const next = sanitizeStoryArgs(args);
  delete next.children;
  delete next.leftIcon;
  delete next.rightIcon;
  return next;
};\n`;

  return `
${matrixConst}
${sanitizeArgsConst}
export const OptionMatrix: Story = {
  render: (args) => (
    <div className="space-y-4">
      <section className="rounded-xl border border-default bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">옵션 매트릭스</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            ${componentName}
          </span>
        </div>
        <div className="space-y-4">
          {Object.entries(OPTION_MATRIX).map(([propName, values]) => (
            <article key={propName} className="rounded-lg border border-default bg-surface-elevated p-3">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-body-sm text-foreground font-medium">{propName}</h4>
                <span className="text-caption text-muted">{values.length} options</span>
              </div>
              <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {(values as readonly unknown[]).map((value) => (
                  <div key={\`\${propName}-\${String(value)}\`} className="rounded-md border border-default bg-surface p-3">
                    <div className="text-caption text-muted mb-2">{String(value)}</div>
                    <div className="min-h-10">
                      <${componentName}
                        {...sanitizeMatrixArgs(args as Record<string, unknown>)}
                        {...({ [propName]: value } as Record<string, unknown>)}
                      ${jsxElementClose}
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
`;
};

const toStatesStory = (componentName) => {
  const argsByProp = getComponentArgs(componentName);
  const importantBooleanProps = new Set(COMPONENT_IMPORTANT_BOOLEAN_CONTROLS[componentName] ?? []);
  const booleanProps = Object.entries(argsByProp)
    .filter(([, value]) => typeof value === "boolean")
    .map(([prop]) => prop)
    .filter((prop) => !["open", "defaultOpen"].includes(prop) && importantBooleanProps.has(prop));

  if (booleanProps.length === 0) return "";

  const selectedBooleanProps = booleanProps
    .sort((a, b) => {
      if (a === "required" && b !== "required") return 1;
      if (a !== "required" && b === "required") return -1;
      const aKnown = Object.hasOwn(BOOLEAN_STATE_LABELS, a);
      const bKnown = Object.hasOwn(BOOLEAN_STATE_LABELS, b);
      if (aKnown && !bKnown) return -1;
      if (!aKnown && bKnown) return 1;
      return a.localeCompare(b);
    })
    .slice(0, 5);

  const children = COMPONENT_DEFAULT_ARGS[componentName]?.children;
  const jsxElementClose = children
    ? `>\n              ${children}\n            </${componentName}>`
    : " />";

  const scenarioItems = [
    `          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <${componentName}
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
            ${jsxElementClose}
          </div>`,
    ...selectedBooleanProps.map((prop) => {
      const title = BOOLEAN_STATE_LABELS[prop] ?? `${prop}=true`;
      const overrideArgs = COMPONENT_STATE_OVERRIDE_ARGS[componentName]?.[prop] ?? null;
      const overrideSpread = overrideArgs ? `\n              {...${JSON.stringify(overrideArgs)} as Record<string, unknown>}` : "";
      return `          <div className="rounded-md border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">${title}</div>
            <${componentName}
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              ${overrideSpread}
              ${prop}
            ${jsxElementClose}
          </div>`;
    })
  ].join("\n");

  return `
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-xl border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">상태</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          ${componentName}
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
${scenarioItems}
      </div>
    </section>
  )
};
`;
};

const createStorySource = (componentName, categoryTitle) => {
  const defaultChildren = COMPONENT_DEFAULT_ARGS[componentName]?.children;
  const playgroundCloseTag = defaultChildren ? `>\n    ${defaultChildren}\n  </${componentName}>` : " />";

  return `import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ${componentName} } from "../../../../index";

const isRenderableNode = (value: unknown): boolean => {
  if (value == null) return true;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
  if (React.isValidElement(value)) return true;
  if (Array.isArray(value)) return value.every(isRenderableNode);
  return false;
};

const sanitizeStoryArgs = (args: Record<string, unknown>): Record<string, unknown> => {
  const next = { ...args };
  for (const key of ${JSON.stringify(RENDERABLE_NODE_PROP_KEYS)}) {
    if (!isRenderableNode(next[key])) delete next[key];
  }
  return next;
};

const meta: Meta<typeof ${componentName}> = {
  title: "Components/Generated/${categoryTitle}/${componentName}",
  component: ${componentName},
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { expanded: true, exclude: ${GLOBAL_CONTROLS_EXCLUDE_CODE} }
  },
${toArgsBlock(componentName)}${toArgTypesBlock(componentName)}};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-lg rounded-xl border border-default bg-surface p-4">
      <${componentName}
        {...sanitizeStoryArgs(args as Record<string, unknown>)}
    ${playgroundCloseTag}
    </div>
  )
};
${toStatesStory(componentName)}${toOptionMatrixStory(componentName)}`;
};

const main = async () => {
  const componentIndexSource = await fs.readFile(COMPONENT_INDEX_PATH, "utf8");
  const exportedComponentNames = parseExportedNames(componentIndexSource);

  await fs.rm(GENERATED_STORIES_DIR, { recursive: true, force: true });
  await fs.rm(LEGACY_AUTO_STORIES_DIR, { recursive: true, force: true });
  await fs.rm(path.join(STORIES_ROOT, "components/actions"), { recursive: true, force: true });
  await fs.rm(path.join(STORIES_ROOT, "components/forms"), { recursive: true, force: true });
  await fs.mkdir(GENERATED_STORIES_DIR, { recursive: true });

  const created = [];
  const byCategory = new Map();

  for (const componentName of exportedComponentNames) {
    const category = resolveCategory(componentName);
    const categoryDir = path.join(GENERATED_STORIES_DIR, category.key);
    const storyPath = path.join(categoryDir, `${componentName}.stories.tsx`);

    await fs.mkdir(categoryDir, { recursive: true });
    await fs.writeFile(storyPath, createStorySource(componentName, category.title), "utf8");

    created.push(componentName);
    byCategory.set(category.title, (byCategory.get(category.title) ?? 0) + 1);
  }

  console.log(`[storybook:gen] 대상 컴포넌트: ${exportedComponentNames.length}`);
  console.log(`[storybook:gen] 생성: ${created.length}`);
  console.log("[storybook:gen] 스킵: 0");
  console.log("[storybook:gen] 정리: 기존 generated 스토리 디렉터리 초기화");

  if (byCategory.size > 0) {
    const summary = [...byCategory.entries()]
      .map(([category, count]) => `${category}=${count}`)
      .join(", ");
    console.log(`[storybook:gen] 카테고리: ${summary}`);
  }

  if (created.length > 0) {
    console.log(`[storybook:gen] 생성 목록: ${created.join(", ")}`);
  }
};

main().catch((error) => {
  console.error("[storybook:gen] 실패:", error);
  process.exit(1);
});
