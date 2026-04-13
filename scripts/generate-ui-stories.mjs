import fs from "node:fs/promises";
import path from "node:path";
import { parseExportedNames } from "./lib/ui-storybook-targets.mjs";
import { loadUiStorybookMetadata } from "./lib/ui-storybook-metadata.mjs";
import {
  STORYBOOK_DATA_TABLE_COLUMNS,
  STORYBOOK_DATA_TABLE_ROWS,
  STORYBOOK_FLEX_ITEMS,
  STORYBOOK_GRID_ITEMS,
  STORYBOOK_ROLE_OPTIONS,
  STORYBOOK_SELECT_OPTIONS,
  toCardChildrenMarkup,
  toChipChildrenMarkup
} from "./lib/ui-storybook-fixtures.mjs";
import { validateGeneratedStories } from "./lib/ui-storybook-validate.mjs";

const ROOT = process.cwd();
const COMPONENT_INDEX_PATH = path.join(ROOT, "packages/ui/components/index.ts");
const STORIES_ROOT = path.join(ROOT, "packages/ui/stories");
const GENERATED_STORIES_DIR = path.join(STORIES_ROOT, "components/generated");
const LEGACY_AUTO_STORIES_DIR = path.join(STORIES_ROOT, "components/auto");

const DERIVED_COMPONENT_OPTION_CATALOG = {};
const DERIVED_COMPONENT_OPTION_DEFAULTS = {};
const DERIVED_COMPONENT_TEXT_CONTROL_PROPS = {};
const DERIVED_COMPONENT_IMPORTANT_OPTION_KEYS = {};
const DERIVED_COMPONENT_OPTION_MATRIX_KEYS = {};
const DERIVED_COMPONENT_IMPORTANT_BOOLEAN_CONTROLS = {};
const DERIVED_COMPONENT_IMPORTANT_NUMBER_CONTROLS = {};

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
    match: /^(Modal|AlertConfirm|DropdownMenu|Popover|Sheet|Tooltip)$/
  },
  {
    key: "feedback",
    title: "Feedback",
    match: /^(ErrorBoundary|Progress|Skeleton|Spinner|StateView|Toast)$/
  },
  {
    key: "data",
    title: "Data",
    match: /^(Avatar|Badge|Card|StatCard|Typography|Table|DataTable)$/
  },
  { key: "navigation", title: "Navigation", match: /^(Accordion|Tabs|Pagination)$/ },
  { key: "layout", title: "Layout", match: /^(ScrollArea|Box|Flex|Grid|Separator|Spacing)$/ }
];

const resolveCategory = (componentName) => {
  const found = CATEGORY_RULES.find((rule) => rule.match.test(componentName));
  if (found) return found;
  return { key: "misc", title: "Misc" };
};

const COMPONENT_DEFAULT_ARGS = {
  Button: { children: "Button" },
  Badge: { children: "Badge" },
  Card: { children: "Card content" },
  Label: { children: "Label" },
  Typography: { children: "Typography" },
  Progress: { value: 64, label: "64%" },
  Box: { children: "Box" },
  Flex: {
    children: toChipChildrenMarkup(STORYBOOK_FLEX_ITEMS)
  },
  Grid: {
    children: toCardChildrenMarkup(STORYBOOK_GRID_ITEMS)
  }
};

const COMPONENT_BASE_ARGS = {
  DataTable: {
    columns: STORYBOOK_DATA_TABLE_COLUMNS,
    data: STORYBOOK_DATA_TABLE_ROWS
  },
  Select: {
    label: "",
    options: STORYBOOK_SELECT_OPTIONS,
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
    options: STORYBOOK_ROLE_OPTIONS,
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
  Calendar: {
    mode: "single",
    numberOfMonths: 1,
    disablePast: false,
    disableFuture: false,
    disableWeekends: false,
    withMonthYearPicker: false
  },
  Avatar: {
    name: "홍길동",
    showStatus: false,
    bordered: false,
    interactive: false
  },
  Accordion: {
    type: "single",
    collapsible: true
  },
  Toast: {
    closeButton: false,
    richColors: true,
    expand: false,
    visibleToasts: 3
  },
  ErrorBoundary: {
    fallbackTitle: "문제가 발생했습니다.",
    fallbackDescription: "잠시 후 다시 시도해 주세요."
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
  },
  Box: {
    variant: "surface",
    padding: "md",
    radius: "lg",
    border: true
  },
  Flex: {
    direction: "row",
    align: "center",
    justify: "start",
    wrap: "wrap",
    gap: "sm"
  },
  Grid: {
    columns: 2,
    gap: "sm",
    autoFit: false,
    minColumnWidth: "md"
  },
  Pagination: {
    totalPages: 12,
    defaultPage: 4,
    totalItems: undefined,
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100]
  },
  Separator: {
    orientation: "horizontal",
    decorative: true
  },
  Spacing: {
    size: "md",
    axis: "vertical",
    responsive: false,
    className: "rounded-sm bg-primary/25"
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
  Calendar: {
    mode: ["single", "multiple", "range"],
    size: ["sm", "md", "lg"],
    density: ["comfortable", "compact"],
    variant: ["default", "elevated"]
  },
  Accordion: {
    size: ["sm", "md", "lg"],
    variant: ["default", "separated", "contained"],
    chevronPosition: ["left", "right"]
  },
  Avatar: {
    size: ["xs", "sm", "md", "lg", "xl"],
    shape: ["circle", "rounded", "square"],
    color: ["default", "primary", "success", "warning", "danger"],
    status: ["online", "offline", "away", "busy"]
  },
  Switch: {
    size: ["sm", "md"],
    color: ["primary", "success", "warning", "danger"]
  },
  Select: {
    size: ["sm", "md", "lg"],
    variant: ["default", "filled", "ghost"],
    status: ["default", "error", "success"]
  },
  Textarea: {
    size: ["sm", "md", "lg"],
    variant: ["default", "filled", "ghost"],
    status: ["default", "error", "success"],
    resize: ["none", "vertical", "horizontal", "both"]
  },
  Badge: {
    variant: ["default", "secondary", "outline", "success", "warning", "danger", "destructive", "info"],
    size: ["sm", "md", "lg"],
    shape: ["pill", "rounded", "square"]
  },
  Card: {
    variant: ["default", "elevated", "muted", "ghost"],
    padding: ["none", "sm", "md", "lg"],
    radius: ["md", "lg", "xl"]
  },
  Box: {
    variant: ["plain", "surface", "elevated", "muted"],
    padding: ["none", "sm", "md", "lg"],
    radius: ["none", "md", "lg", "xl"],
    shadow: ["none", "sm", "md"],
    border: [false, true]
  },
  Flex: {
    direction: ["row", "col"],
    align: ["start", "center", "stretch"],
    justify: ["start", "center", "between"],
    wrap: ["nowrap", "wrap"],
    gap: ["none", "sm", "md", "lg"]
  },
  Grid: {
    columns: [1, 2, 3, 4],
    gap: ["none", "sm", "md", "lg"],
    autoFit: [false, true],
    minColumnWidth: ["sm", "md", "lg"],
    dense: [false, true]
  },
  Table: {
    density: ["compact", "default", "comfortable"],
    stickyHeader: [false, true],
    striped: [false, true],
    hoverable: [false, true]
  },
  DataTable: {
    tableDensity: ["compact", "default", "comfortable"],
    stickyHeader: [false, true],
    striped: [false, true],
    isLoading: [false, true],
    isError: [false, true]
  },
  Popover: {
    size: ["sm", "md", "lg"],
    variant: ["default", "elevated"],
    withArrow: [false, true]
  },
  Progress: {
    size: ["sm", "md", "lg"],
    color: ["primary", "success", "warning", "danger", "info"]
  },
  Tabs: {
    size: ["sm", "md", "lg"],
    variant: ["pill", "underline"],
    fullWidth: [false, true]
  },
  Tooltip: {
    size: ["sm", "md", "lg"],
    color: ["default", "inverse", "primary"],
    withArrow: [false, true],
    placement: ["top", "right", "bottom", "left"],
    alignment: ["start", "center", "end"]
  },
  ScrollArea: {
    scrollBarSize: ["sm", "md", "lg"]
  },
  Separator: {
    color: ["default", "subtle", "strong", "primary"],
    inset: ["none", "sm", "md"],
    thickness: ["sm", "md", "lg"],
    lineStyle: ["solid", "dashed", "dotted"]
  },
  Pagination: {
    variant: ["default", "outline", "ghost"],
    size: ["sm", "md", "lg"],
    itemStyle: ["button", "minimal"]
  },
  Spacing: {
    size: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"],
    axis: ["vertical", "horizontal", "both"]
  },
  Label: {
    size: ["sm", "md", "lg"],
    color: ["default", "muted", "danger"]
  },
  Typography: {
    variant: ["h1", "h2", "h3", "title", "body", "bodySm", "caption", "label"],
    color: ["default", "muted", "subtle", "primary", "success", "warning", "danger", "info"]
  },
  Spinner: {
    size: ["sm", "md", "lg"],
    color: ["default", "primary", "danger"]
  },
  Skeleton: {
    variant: ["text", "rounded", "rectangular", "circular"],
    size: ["xs", "sm", "md", "lg"],
    color: ["default", "muted", "subtle"],
    animation: ["pulse", "none"],
    speed: ["slow", "normal", "fast"]
  },
  StateView: {
    variant: ["info", "success", "warning", "error", "empty", "loading"],
    size: ["sm", "md", "lg"],
    align: ["left", "center"],
    layout: ["inline", "stacked"]
  },
  StatCard: {
    color: ["default", "primary", "warning", "danger"],
    size: ["sm", "md", "lg"]
  },
  FormField: {
    size: ["sm", "md", "lg"]
  },
  Modal: {
    size: ["xs", "sm", "md", "lg", "xl", "full"],
    intent: ["default", "danger", "warning", "info"]
  },
  AlertConfirm: {
    size: ["sm", "md", "lg"],
    intent: ["default", "danger", "warning", "info"]
  },
  Sheet: {
    side: ["top", "right", "bottom", "left"],
    size: ["sm", "md", "lg", "xl"]
  },
  ErrorBoundary: {
    fullScreen: [true, false]
  },
  Toast: {
    position: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"],
    theme: ["light", "dark", "system"]
  }
};

const COMPONENT_OPTION_MATRIX_KEYS = {
  Button: ["variant", "size"],
  Input: ["variant", "status"],
  Checkbox: ["size"],
  RadioGroup: ["size"],
  DatePicker: ["mode", "status"],
  Calendar: ["mode", "variant"],
  Accordion: ["size", "variant"],
  Avatar: ["size", "shape"],
  Switch: ["size", "color"],
  Select: ["variant", "status"],
  Textarea: ["status", "resize"],
  Badge: ["variant"],
  Card: [],
  Table: [],
  DataTable: [],
  Typography: [],
  Spinner: [],
  StateView: [],
  StatCard: [],
  FormField: [],
  Pagination: ["variant", "size"],
  Separator: ["color", "lineStyle"],
  Spacing: ["size", "axis"]
};

const COMPONENT_IMPORTANT_OPTION_KEYS = {
  Button: ["variant", "size", "shape"],
  Input: ["variant", "size", "status"],
  Checkbox: ["size"],
  RadioGroup: ["size"],
  DatePicker: ["mode", "variant", "size", "status"],
  Calendar: ["mode", "size", "density", "variant"],
  Accordion: ["size", "variant", "chevronPosition"],
  Avatar: ["size", "shape", "color", "status"],
  Switch: ["size", "color"],
  Select: ["variant", "size", "status"],
  Textarea: ["variant", "size", "status", "resize"],
  Badge: ["variant", "size"],
  Card: ["variant"],
  Table: ["density", "striped"],
  DataTable: ["tableDensity", "stickyHeader", "striped", "isLoading", "isError"],
  Popover: ["size", "variant", "withArrow"],
  Progress: ["size", "color", "indeterminate"],
  Tabs: ["size", "variant"],
  Tooltip: ["placement", "alignment", "withArrow"],
  ScrollArea: ["scrollBarSize"],
  Label: ["size", "color"],
  Typography: ["variant", "color"],
  Spinner: ["size", "color"],
  Skeleton: ["variant", "size", "color", "animation", "speed"],
  StateView: ["variant", "size", "align", "layout"],
  StatCard: ["color", "size"],
  FormField: ["size"],
  Modal: ["size", "intent"],
  AlertConfirm: ["size", "intent"],
  Sheet: ["side", "size"],
  ErrorBoundary: ["fullScreen"],
  Toast: ["position", "theme"],
  Pagination: ["variant", "size"],
  Separator: ["color", "inset", "thickness", "lineStyle"],
  Spacing: ["size", "axis"]
};

const COMPONENT_OPTION_DEFAULTS = {
  Button: { variant: "primary", size: "md", shape: "default", fullWidth: false },
  Input: { size: "md", variant: "default", status: "default" },
  Checkbox: { size: "sm", disabled: false, required: false, indeterminate: false },
  RadioGroup: { size: "sm", disabled: false, required: false },
  DatePicker: { mode: "single", size: "md", variant: "default", status: "default" },
  Calendar: {
    mode: "single",
    size: "md",
    density: "comfortable",
    variant: "default",
    numberOfMonths: 1,
    disablePast: false,
    disableFuture: false,
    disableWeekends: false,
    withMonthYearPicker: false
  },
  Accordion: {
    size: "md",
    variant: "default",
    chevronPosition: "right",
    rotateChevron: true
  },
  Avatar: {
    size: "md",
    shape: "circle",
    color: "default",
    status: "offline",
    showStatus: false,
    bordered: false,
    interactive: false
  },
  Switch: { size: "sm", color: "primary", disabled: false, loading: false },
  Select: {
    size: "md",
    variant: "default",
    status: "default",
    disabled: false,
    searchable: false,
    multiple: false,
    loading: false,
    maxVisibleItems: 8,
    maxTagCount: 2
  },
  Textarea: { size: "md", variant: "default", status: "default", resize: "vertical" },
  Badge: { variant: "default", size: "sm", shape: "pill" },
  Card: { variant: "default" },
  Table: { density: "default", stickyHeader: false, striped: false, hoverable: true },
  DataTable: { tableDensity: "default", stickyHeader: false, striped: false, isLoading: false, isError: false },
  Popover: { size: "md", variant: "default", withArrow: false },
  Progress: { size: "md", color: "primary", striped: false, showValue: false, indeterminate: false, label: "" },
  Tabs: { size: "md", variant: "pill", fullWidth: false },
  Tooltip: {
    size: "md",
    color: "inverse",
    withArrow: false,
    placement: "top",
    alignment: "center",
    offset: 8
  },
  ScrollArea: { scrollBarSize: "md" },
  Separator: {
    color: "default",
    inset: "none",
    thickness: "sm",
    lineStyle: "solid",
    decorative: true,
    orientation: "horizontal"
  },
  Pagination: {
    variant: "outline",
    size: "md",
    siblingCount: 1,
    boundaryCount: 1,
    showFirstLast: true,
    showPrevNext: true,
    showTotal: false,
    showPageInfo: false,
    showPageSizeSelector: false,
    showQuickJumper: false,
    hideOnSinglePage: false,
    simple: false,
    itemStyle: "button",
    pageSizeLabel: "페이지당",
    pageSizeSuffix: "개",
    quickJumperPlaceholder: "페이지",
    quickJumperGoLabel: "이동",
    disabled: false,
    fullWidth: false
  },
  Spacing: {
    size: "md",
    axis: "vertical",
    responsive: false
  },
  Label: { size: "md", color: "default", required: false },
  Typography: { variant: "body", color: "default" },
  Spinner: { size: "md", color: "default", fullscreen: false, delayMs: 0, label: "" },
  Skeleton: {
    variant: "text",
    size: "md",
    color: "default",
    animation: "pulse",
    speed: "normal",
    lines: 3,
    lastLineWidth: "60%",
    fullWidth: true
  },
  StateView: { variant: "info", size: "md", align: "center", layout: "inline" },
  StatCard: { color: "default", size: "md" },
  FormField: { size: "md", requiredMark: false },
  Modal: {
    size: "md",
    intent: "default",
    hideCloseButton: false,
    preventEscapeClose: false,
    preventOutsideClose: false
  },
  AlertConfirm: {
    size: "md",
    intent: "default",
    preventEscapeClose: false
  },
  Sheet: {
    side: "right",
    size: "md",
    showCloseButton: true
  },
  ErrorBoundary: {
    fullScreen: false,
    showRetryButton: true,
    showRefreshButton: true,
    showHomeButton: true
  },
  Toast: {
    position: "bottom-right",
    theme: "system",
    closeButton: false,
    richColors: true,
    expand: false,
    visibleToasts: 3
  }
};

const COMPONENT_IMPORTANT_BOOLEAN_CONTROLS = {
  Button: ["disabled", "loading", "fullWidth"],
  Input: ["disabled", "required", "readOnly"],
  Checkbox: ["disabled", "required"],
  RadioGroup: ["disabled", "horizontal"],
  DatePicker: ["disabled", "required", "readOnly"],
  Calendar: ["disablePast", "disableFuture", "disableWeekends", "withMonthYearPicker"],
  Accordion: ["rotateChevron"],
  Avatar: ["showStatus", "bordered", "interactive"],
  Switch: ["disabled", "loading", "required"],
  Select: ["disabled", "searchable", "multiple", "loading", "required"],
  Textarea: ["disabled", "required", "readOnly"],
  Table: ["stickyHeader", "striped", "hoverable"],
  DataTable: ["stickyHeader", "striped", "isLoading", "isError"],
  Popover: ["withArrow"],
  Progress: ["striped", "showValue", "indeterminate"],
  Tabs: ["fullWidth"],
  Label: ["required"],
  FormField: ["requiredMark"],
  Modal: ["hideCloseButton", "preventEscapeClose", "preventOutsideClose"],
  AlertConfirm: ["preventEscapeClose"],
  Sheet: ["showCloseButton"],
  ErrorBoundary: ["showRetryButton", "showRefreshButton", "showHomeButton"],
  Toast: ["closeButton", "richColors", "expand"],
  Spinner: ["fullscreen"],
  Skeleton: ["fullWidth"],
  Pagination: ["disabled", "showFirstLast", "showPrevNext", "showTotal", "showPageInfo", "showPageSizeSelector", "showQuickJumper", "hideOnSinglePage", "simple", "fullWidth"],
  Separator: ["decorative"],
  Spacing: ["responsive"]
};

const COMPONENT_IMPORTANT_NUMBER_CONTROLS = {
  Select: ["maxVisibleItems", "maxTagCount"],
  Textarea: ["rows"],
  Calendar: ["numberOfMonths"],
  Toast: ["visibleToasts"],
  Pagination: ["totalPages", "defaultPage", "defaultPageSize", "siblingCount", "boundaryCount"],
  Spinner: ["delayMs"],
  Skeleton: ["lines"]
};

const GLOBAL_CONTROL_OFF_PROPS = [
  "children",
  "asChild",
  "leftIcon",
  "rightIcon",
  "options",
  "value",
  "defaultValue",
  "checked",
  "defaultChecked",
  "open",
  "defaultOpen",
  "onChange",
  "onCheckedChange",
  "onOpenChange"
];
const GLOBAL_TABLE_HIDE_PROPS = [
  "children",
  "asChild",
  "leftIcon",
  "rightIcon",
  "prefix",
  "suffix",
  "className",
  "containerClassName",
  "labelClassName",
  "helperClassName",
  "optionClassName",
  "optionLabelClassName",
  "optionDescriptionClassName",
  "style",
  "id"
];
const COMPONENT_TABLE_HIDE_PROPS = {
  DataTable: ["columns", "data", "getRowId", "onPageChange", "tableClassName", "totalCount", "page", "totalPages"],
  Table: ["children"],
  Modal: ["open", "onOpenChange", "defaultOpen"],
  AlertConfirm: ["open", "onOpenChange", "defaultOpen"],
  DropdownMenu: ["open", "onOpenChange", "defaultOpen"],
  Popover: ["open", "onOpenChange", "defaultOpen"],
  Tooltip: ["open", "onOpenChange", "defaultOpen"]
};
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
  Select: ["label", "placeholder", "emptyMessage"],
  Input: ["label", "placeholder"],
  DatePicker: ["label", "placeholder"],
  ErrorBoundary: ["fallbackTitle", "fallbackDescription"],
  Checkbox: ["label"],
  RadioGroup: [],
  Textarea: ["label", "placeholder"],
  FormField: ["label", "description"],
  DataTable: ["loadingMessage", "emptyTitle", "errorTitle"],
  Progress: ["label"],
  Spinner: ["label"],
  StateView: ["title", "description"],
  StatCard: ["label", "helper"],
  Pagination: [],
  Spacing: []
};

const OPTION_ORDER_PRIORITY = [
  "variant",
  "color",
  "size",
  "shape",
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

const TEXT_CONTROL_NAME_PATTERN = /(label|placeholder|title|description|message|helper|text|name)$/i;
const CLASSNAME_PROP_PATTERN = /className$/i;

const BOOLEAN_STATE_LABELS = {
  disabled: "비활성화",
  loading: "로딩",
  required: "필수",
  readOnly: "읽기 전용",
  clearable: "초기화 가능",
  dot: "도트 표시",
  pulse: "펄스 효과",
  removable: "삭제 가능",
  interactive: "인터랙션",
  truncate: "말줄임",
  indeterminate: "중간 상태",
  searchable: "검색 활성화",
  multiple: "다중 선택",
  fullWidth: "전체 너비",
  isLoading: "로딩 상태",
  isError: "오류 상태"
};

const STATE_PROP_LABELS = {
  variant: "변형",
  size: "크기",
  color: "색상",
  status: "상태",
  type: "타입",
  shape: "모양",
  side: "위치",
  align: "정렬",
  intent: "의도",
  showIcon: "아이콘 표시",
  requiredMark: "필수 표시",
  showCount: "글자 수 표시",
  disableFuture: "미래 날짜 비활성화",
  disablePast: "과거 날짜 비활성화",
  disableWeekends: "주말 비활성화",
  fullscreen: "전체 화면",
  showValue: "값 표시",
  striped: "줄무늬",
  stickyHeader: "헤더 고정",
  scrollBehavior: "스크롤 방식"
};

const NON_ESSENTIAL_BOOLEAN_STATE_PROPS = new Set([
  "dot",
  "pulse",
  "interactive",
  "truncate",
  "removable"
]);

const DEFAULT_MAX_STATE_SCENARIOS = 2;
const MAX_STATE_SCENARIOS_BY_COMPONENT = {
  Button: 3,
  Input: 3,
  Select: 3,
  DatePicker: 3,
  Calendar: 3,
  Checkbox: 3,
  RadioGroup: 3,
  Textarea: 3,
  Switch: 3,
  Modal: 3,
  AlertConfirm: 3,
  DropdownMenu: 3,
  Sheet: 3,
  Tabs: 3,
  Accordion: 3,
  DataTable: 3
};

const getMaxStateScenarios = (componentName) =>
  MAX_STATE_SCENARIOS_BY_COMPONENT[componentName] ?? DEFAULT_MAX_STATE_SCENARIOS;

const toStateLabel = (propName) => {
  if (Object.hasOwn(BOOLEAN_STATE_LABELS, propName)) {
    return BOOLEAN_STATE_LABELS[propName];
  }
  if (Object.hasOwn(STATE_PROP_LABELS, propName)) {
    return STATE_PROP_LABELS[propName];
  }
  return propName;
};

const COMPONENT_STATE_OVERRIDE_ARGS = {
  Switch: {
    disabled: { defaultChecked: false }
  }
};

const pickOptionMatrixKeys = (optionsByProp) => {
  const candidates = sortOptionEntries(optionsByProp).filter(([, values]) => Array.isArray(values) && values.length >= 2 && values.length <= 6);
  return candidates.slice(0, 2).map(([prop]) => prop);
};

const getOptionsByProp = (componentName) => DERIVED_COMPONENT_OPTION_CATALOG[componentName] ?? COMPONENT_OPTION_CATALOG[componentName];
const getOptionDefaultsByProp = (componentName) =>
  DERIVED_COMPONENT_OPTION_DEFAULTS[componentName] ?? COMPONENT_OPTION_DEFAULTS[componentName] ?? {};
const getTextControlProps = (componentName) =>
  DERIVED_COMPONENT_TEXT_CONTROL_PROPS[componentName] ?? COMPONENT_TEXT_CONTROL_PROPS[componentName] ?? [];
const getImportantOptionKeys = (componentName) =>
  DERIVED_COMPONENT_IMPORTANT_OPTION_KEYS[componentName] ?? COMPONENT_IMPORTANT_OPTION_KEYS[componentName] ?? [];
const getOptionMatrixKeys = (componentName) =>
  DERIVED_COMPONENT_OPTION_MATRIX_KEYS[componentName] ?? COMPONENT_OPTION_MATRIX_KEYS[componentName];
const getImportantBooleanControls = (componentName) =>
  DERIVED_COMPONENT_IMPORTANT_BOOLEAN_CONTROLS[componentName] ?? COMPONENT_IMPORTANT_BOOLEAN_CONTROLS[componentName] ?? [];
const getImportantNumberControls = (componentName) =>
  DERIVED_COMPONENT_IMPORTANT_NUMBER_CONTROLS[componentName] ?? COMPONENT_IMPORTANT_NUMBER_CONTROLS[componentName] ?? [];

const initializeDerivedComponentMaps = async () => {
  const metadataByComponent = await loadUiStorybookMetadata(ROOT);

  for (const [componentName, metadata] of Object.entries(metadataByComponent)) {
    const optionsByProp = metadata.options ?? {};
    const defaultsByProp = metadata.defaults ?? {};
    const stringProps = metadata.stringProps ?? [];
    const booleanProps = metadata.booleanProps ?? [];
    const numberProps = metadata.numberProps ?? [];

    if (Object.keys(optionsByProp).length > 0) {
      DERIVED_COMPONENT_OPTION_CATALOG[componentName] = optionsByProp;
      DERIVED_COMPONENT_IMPORTANT_OPTION_KEYS[componentName] = Object.keys(optionsByProp);
      DERIVED_COMPONENT_OPTION_MATRIX_KEYS[componentName] = pickOptionMatrixKeys(optionsByProp);
    }

    if (Object.keys(defaultsByProp).length > 0) {
      DERIVED_COMPONENT_OPTION_DEFAULTS[componentName] = defaultsByProp;
    }

    const semanticTextProps = stringProps.filter((propName) => TEXT_CONTROL_NAME_PATTERN.test(propName));
    if (semanticTextProps.length > 0) {
      DERIVED_COMPONENT_TEXT_CONTROL_PROPS[componentName] = semanticTextProps;
    }

    if (booleanProps.length > 0) {
      DERIVED_COMPONENT_IMPORTANT_BOOLEAN_CONTROLS[componentName] = booleanProps;
    }

    if (numberProps.length > 0) {
      DERIVED_COMPONENT_IMPORTANT_NUMBER_CONTROLS[componentName] = numberProps;
    }
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
  ...getOptionDefaultsByProp(componentName),
  ...(COMPONENT_BASE_ARGS[componentName] ?? {}),
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
  const optionsByProp = getOptionsByProp(componentName);
  const importantOptionKeys = getImportantOptionKeys(componentName);
  const orderedEntries = optionsByProp
    ? sortOptionEntries(
        Object.fromEntries(Object.entries(optionsByProp).filter(([prop]) => importantOptionKeys.includes(prop)))
      )
    : [];
  const defaultsByProp = getOptionDefaultsByProp(componentName);
  const argsByProp = getComponentArgs(componentName);
  const booleanPropsFromArgs = Object.entries(argsByProp)
    .filter(([, value]) => typeof value === "boolean")
    .map(([prop]) => prop);
  const numberPropsFromArgs = Object.entries(argsByProp)
    .filter(([, value]) => typeof value === "number")
    .map(([prop]) => prop);

  const argTypeMap = new Map();
  const mergeArgTypeConfig = (prop, config) => {
    const prev = argTypeMap.get(prop) ?? {};
    argTypeMap.set(prop, {
      ...prev,
      ...config,
      table: {
        ...(prev.table ?? {}),
        ...(config.table ?? {})
      }
    });
  };

  for (const [prop, options] of orderedEntries) {
    const defaultValue = defaultsByProp[prop];
    const defaultValueConfig = defaultValue === undefined ? {} : { table: { defaultValue: { summary: defaultValue } } };
    const isBooleanPair =
      Array.isArray(options) && options.length === 2 && options.includes(false) && options.includes(true);
    if (isBooleanPair) {
      mergeArgTypeConfig(prop, { control: "boolean", ...defaultValueConfig });
      continue;
    }
    mergeArgTypeConfig(prop, { control: "select", options, ...defaultValueConfig });
  }

  const optionProps = new Set(orderedEntries.map(([prop]) => prop));
  const allowedBooleanControls = new Set(getImportantBooleanControls(componentName));
  const allowedNumberControls = new Set(getImportantNumberControls(componentName));
  const hiddenTableProps = new Set([...GLOBAL_TABLE_HIDE_PROPS, ...(COMPONENT_TABLE_HIDE_PROPS[componentName] ?? [])]);
  for (const prop of getTextControlProps(componentName).filter(
    (name) =>
      !optionProps.has(name) &&
      !GLOBAL_CONTROL_OFF_PROPS.includes(name) &&
      !hiddenTableProps.has(name) &&
      !CLASSNAME_PROP_PATTERN.test(name)
  )) {
    const defaultValue = argsByProp[prop];
    mergeArgTypeConfig(prop, {
      control: "text",
      ...(defaultValue === undefined ? {} : { table: { defaultValue: { summary: defaultValue } } })
    });
  }

  for (const prop of booleanPropsFromArgs.filter(
    (name) => !optionProps.has(name) && !GLOBAL_CONTROL_OFF_PROPS.includes(name) && allowedBooleanControls.has(name)
  )) {
    const defaultValue = argsByProp[prop];
    mergeArgTypeConfig(prop, {
      control: "boolean",
      table: { defaultValue: { summary: defaultValue } }
    });
  }

  for (const prop of numberPropsFromArgs.filter(
    (name) => !optionProps.has(name) && !GLOBAL_CONTROL_OFF_PROPS.includes(name) && allowedNumberControls.has(name)
  )) {
    const defaultValue = argsByProp[prop];
    mergeArgTypeConfig(prop, {
      control: { type: "number" },
      table: { defaultValue: { summary: defaultValue } }
    });
  }

  const offControls = new Map();
  for (const prop of GLOBAL_CONTROL_OFF_PROPS) {
    offControls.set(prop, { ...(offControls.get(prop) ?? {}), control: false });
  }
  for (const prop of hiddenTableProps) {
    offControls.set(prop, { ...(offControls.get(prop) ?? {}), table: { disable: true } });
  }
  for (const [prop, config] of offControls.entries()) {
    mergeArgTypeConfig(prop, config);
  }

  const merged = Array.from(argTypeMap.entries())
    .map(([prop, config]) => `    ${prop}: ${JSON.stringify(config).replace(/\"([^\"]+)\":/g, "$1:")}`)
    .join(",\n");
  if (!merged) return "";

  return `  argTypes: {\n${merged}\n  },\n`;
};

const collectExistingStoryNames = async () => {
  const names = new Set();

  const walk = async (dirPath) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.name.endsWith(".stories.tsx")) continue;
      names.add(entry.name.replace(".stories.tsx", ""));
    }
  };

  await walk(STORIES_ROOT);
  return names;
};

const collectGeneratedStoryRelativePaths = async (dirPath) => {
  const relativePaths = new Set();

  const walk = async (currentPath) => {
    let entries = [];
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.name.endsWith(".stories.tsx")) continue;
      relativePaths.add(path.relative(dirPath, fullPath));
    }
  };

  await walk(dirPath);
  return relativePaths;
};

const pruneEmptyDirectories = async (dirPath) => {
  let entries = [];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return false;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await pruneEmptyDirectories(path.join(dirPath, entry.name));
  }

  const remaining = await fs.readdir(dirPath, { withFileTypes: true });
  if (remaining.length === 0) {
    await fs.rmdir(dirPath);
    return true;
  }
  return false;
};

const createPlaceholderStorySection = (exportName, title, componentName, description) => `
export const ${exportName}: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">${title}</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          ${componentName}
        </span>
      </div>
      <p className="text-body-sm text-muted">${description}</p>
    </section>
  )
};
`;

const toOptionMatrixStory = (componentName, options = {}) => {
  const { placeholderOnly = false } = options;
  if (placeholderOnly) {
    return createPlaceholderStorySection(
      "OptionMatrix",
      "옵션 매트릭스",
      componentName,
      "이 컴포넌트는 Playground에서 핵심 옵션 조합을 확인하도록 구성되어 있습니다."
    );
  }

  const optionsByProp = getOptionsByProp(componentName);
  const matrixKeys = getOptionMatrixKeys(componentName) ?? [];
  const matrixSource =
    optionsByProp && matrixKeys.length > 0
      ? Object.fromEntries(Object.entries(optionsByProp).filter(([key]) => matrixKeys.includes(key)))
      : {};

  let filteredOptionsByProp = matrixSource;
  if (Object.keys(filteredOptionsByProp).length === 0 && optionsByProp) {
    const firstEntry = sortOptionEntries(optionsByProp).find(([, values]) => Array.isArray(values) && values.length > 1);
    if (firstEntry) {
      filteredOptionsByProp = { [firstEntry[0]]: firstEntry[1].slice(0, 4) };
    }
  }

  const children = COMPONENT_DEFAULT_ARGS[componentName]?.children;
  const jsxElementClose = children
    ? `>\n                ${children}\n              </${componentName}>`
    : " />";

  if (Object.keys(filteredOptionsByProp).length === 0) {
    return `
export const OptionMatrix: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">옵션 매트릭스</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          ${componentName}
        </span>
      </div>
      <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
        <div className="text-caption text-muted mb-2">기본 구성</div>
        <div className="min-h-10">
          <${componentName}
            {...sanitizeStoryArgs(args as Record<string, unknown>)}
          ${jsxElementClose}
        </div>
      </div>
    </section>
  )
};
`;
  }

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
      <section className="rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">옵션 매트릭스</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            ${componentName}
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
                  <div key={\`\${propName}-\${String(value)}\`} className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
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

const toStatesStory = (componentName, options = {}) => {
  const { placeholderOnly = false } = options;
  if (placeholderOnly) {
    return createPlaceholderStorySection(
      "States",
      "상태",
      componentName,
      "이 컴포넌트는 Playground에서 상태 전환을 직접 확인하도록 구성되어 있습니다."
    );
  }

  const argsByProp = getComponentArgs(componentName);
  const optionsByProp = getOptionsByProp(componentName) ?? {};
  const importantBooleanProps = new Set(getImportantBooleanControls(componentName));
  const booleanProps = Object.entries(argsByProp)
    .filter(([, value]) => typeof value === "boolean")
    .map(([prop]) => prop)
    .filter(
      (prop) =>
        !["open", "defaultOpen"].includes(prop) &&
        importantBooleanProps.has(prop) &&
        !NON_ESSENTIAL_BOOLEAN_STATE_PROPS.has(prop)
    );

  const maxStateScenarios = getMaxStateScenarios(componentName);
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
    .slice(0, maxStateScenarios);

  const children = COMPONENT_DEFAULT_ARGS[componentName]?.children;
  const jsxElementClose = children
    ? `>\n              ${children}\n            </${componentName}>`
    : " />";

  const fallbackOptionEntry = sortOptionEntries(optionsByProp).find(([, values]) => Array.isArray(values) && values.length > 1);
  const fallbackStateScenario = fallbackOptionEntry
    ? `          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">${toStateLabel(fallbackOptionEntry[0])} ${String(
              fallbackOptionEntry[1][1]
            )}</div>
            <${componentName}
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              {...({ ${JSON.stringify(fallbackOptionEntry[0])}: ${JSON.stringify(fallbackOptionEntry[1][1])} } as Record<string, unknown>)}
            ${children ? `>\n              ${children}\n            </${componentName}>` : " />"}
          </div>`
    : "";

  const scenarioItems = [
    `          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">기본</div>
            <${componentName}
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
            ${jsxElementClose}
          </div>`,
    ...selectedBooleanProps.map((prop) => {
      const title = toStateLabel(prop);
      const overrideArgs = COMPONENT_STATE_OVERRIDE_ARGS[componentName]?.[prop] ?? null;
      const overrideSpread = overrideArgs ? `\n              {...${JSON.stringify(overrideArgs)} as Record<string, unknown>}` : "";
      return `          <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
            <div className="text-caption text-muted mb-2">${title}</div>
            <${componentName}
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
              ${overrideSpread}
              ${prop}
            ${jsxElementClose}
          </div>`;
    }),
    ...(selectedBooleanProps.length === 0 && fallbackStateScenario ? [fallbackStateScenario] : [])
  ].join("\n");

  return `
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
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

const toExamplesStory = (componentName, options = {}) => {
  const { placeholderOnly = false } = options;
  if (placeholderOnly) {
    return createPlaceholderStorySection(
      "Examples",
      "사용 예시",
      componentName,
      "이 컴포넌트의 실사용 예시는 Playground 또는 전용 수동 스토리에서 확인할 수 있습니다."
    );
  }

  const children = COMPONENT_DEFAULT_ARGS[componentName]?.children;
  const jsxElementClose = children
    ? `>\n                ${children}\n              </${componentName}>`
    : " />";
  const argsByProp = getComponentArgs(componentName);
  const hasDisabled = typeof argsByProp.disabled === "boolean";
  const secondaryVariant = hasDisabled
    ? `<${componentName}
                {...sanitizeStoryArgs(args as Record<string, unknown>)}
                disabled
              ${jsxElementClose}`
    : `<${componentName}
                {...sanitizeStoryArgs(args as Record<string, unknown>)}
              ${jsxElementClose}`;
  const secondaryTitle = hasDisabled ? "비활성화 예시" : "레이아웃 배치 예시";
  const secondaryDesc = hasDisabled
    ? "비활성 상태의 접근성/가독성을 함께 확인합니다."
    : "실제 화면 배치에서 기본 상태를 검증합니다.";

  return `
export const Examples: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-md text-foreground font-semibold">사용 예시</h3>
        <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
          ${componentName}
        </span>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-2">기본 사용</div>
          <div className="min-h-10">
            <${componentName}
              {...sanitizeStoryArgs(args as Record<string, unknown>)}
            ${jsxElementClose}
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          <div className="text-caption text-muted mb-1">${secondaryTitle}</div>
          <div className="text-caption text-muted mb-2">${secondaryDesc}</div>
          <div className="min-h-10">
            ${secondaryVariant}
          </div>
        </div>
      </div>
    </section>
  )
};
`;
};

const hasStoryExport = (source, exportName) => new RegExp(`export const\\s+${exportName}\\s*:\\s*Story\\s*=`).test(source);

const OVERRIDE_STORY_SECTION_ARGS = {
  AlertConfirm: {
    states: { confirmLoading: true },
    optionMatrix: { size: "lg", intent: "warning" },
    examples: { closeOnConfirm: true, autoFocusButton: "confirm" }
  },
  Modal: {
    states: { confirmLoading: true, sticky: true },
    optionMatrix: { size: "lg", align: "between" },
    examples: { intent: "info", scrollBehavior: "outside" }
  },
  DropdownMenu: {
    states: { keepOpenOnSelect: true },
    optionMatrix: { contentSize: "lg", itemSize: "sm" },
    examples: { showDangerItem: true, showLabel: true }
  },
  ScrollArea: {
    states: { scrollBarSize: "lg" },
    optionMatrix: { scrollBarSize: "sm" },
    examples: { scrollBarSize: "md" }
  },
  Sheet: {
    states: { showCloseButton: false },
    optionMatrix: { side: "left", size: "lg" },
    examples: { scrollBehavior: "outside", closeOnOutsideClick: true }
  },
  Skeleton: {
    states: { animation: "none" },
    optionMatrix: { variant: "circular", size: "lg" },
    examples: { variant: "text", lines: 4, lastLineWidth: "45%" }
  },
  Tabs: {
    states: { fullWidth: true },
    optionMatrix: { variant: "underline", size: "lg" },
    examples: { variant: "pill", size: "md" }
  },
  Toast: {
    states: { expand: true },
    optionMatrix: { position: "bottom-right", richColors: false },
    examples: { position: "top-center", richColors: true }
  },
  Tooltip: {
    states: { withArrow: true },
    optionMatrix: { color: "primary", size: "lg" },
    examples: { sideOffset: 12, color: "inverse" }
  },
  Popover: {
    states: { align: "start" },
    optionMatrix: { side: "right", align: "end" },
    examples: { side: "bottom", align: "center" }
  },
  Accordion: {
    states: { type: "multiple" },
    optionMatrix: { variant: "contained", size: "lg" },
    examples: { collapsible: false }
  },
  ErrorBoundary: {
    states: { fullScreen: true },
    optionMatrix: { showHomeButton: false, showRefreshButton: true },
    examples: { showRetryButton: true, showRefreshButton: true, showHomeButton: true }
  },
  Avatar: {
    states: { showStatus: false },
    optionMatrix: { size: "xl", shape: "rounded" },
    examples: { status: "busy", color: "primary" }
  },
  DataTable: {
    states: { isLoading: true },
    optionMatrix: { tableDensity: "compact", striped: true },
    examples: { stickyHeader: true, striped: true }
  }
};

const toOverrideReplayStory = (
  exportName,
  title,
  componentName,
  variantArgs,
  description,
  rendererName = "Playground"
) => `
export const ${exportName}: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const nextArgs = {
      ...(args as Record<string, unknown>),
      ...(${JSON.stringify(variantArgs ?? {})} as Record<string, unknown>)
    } as typeof args;

    return (
      <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-body-md text-foreground font-semibold">${title}</h3>
          <span className="text-caption text-muted rounded-full border border-default bg-surface-elevated px-2 py-0.5">
            ${componentName}
          </span>
        </div>
        <p className="text-body-sm text-muted">${description}</p>
        <div className="rounded-[var(--radius-md)] border border-default bg-surface p-3">
          {${rendererName}.render ? ${rendererName}.render(nextArgs) : null}
        </div>
      </section>
    );
  }
};
`;

const toPlaygroundStatesOverrideSource = (source, componentName) => {
  let next = source.trimEnd();

  next = next.replace(/\nexport const\s+(?!Playground)[A-Za-z]+\s*:\s*Story\s*=\s*\{[\s\S]*?\n\};\n?/g, "\n");
  return `${next}\n`;
};

const ensureRequiredStorySections = (source, componentName, options = {}) => {
  const { placeholderOnly = false } = options;
  let next = source.trimEnd();

  const overrideArgs = OVERRIDE_STORY_SECTION_ARGS[componentName] ?? {};
  const statesSection = placeholderOnly
    ? toOverrideReplayStory(
        "States",
        "상태",
        componentName,
        overrideArgs.states,
        "핵심 상태 옵션을 적용한 실제 동작 예시입니다."
      )
    : toStatesStory(componentName, { placeholderOnly });
  const optionMatrixSection = placeholderOnly
    ? toOverrideReplayStory(
        "OptionMatrix",
        "옵션 매트릭스",
        componentName,
        overrideArgs.optionMatrix,
        "주요 옵션 조합을 적용한 대표 예시입니다."
      )
    : toOptionMatrixStory(componentName, { placeholderOnly });
  const examplesSection = placeholderOnly
    ? toOverrideReplayStory(
        "Examples",
        "사용 예시",
        componentName,
        overrideArgs.examples,
        "실사용 시나리오 중심의 예시입니다."
      )
    : toExamplesStory(componentName, { placeholderOnly });

  const requiredStories = [
    ["Playground", null],
    ["States", statesSection],
    ["OptionMatrix", optionMatrixSection],
    ["Examples", examplesSection]
  ];

  for (const [storyName, storySource] of requiredStories) {
    if (hasStoryExport(next, storyName)) continue;
    if (!storySource) continue;
    next += `\n\n${storySource.trim()}\n`;
  }

  return `${next}\n`;
};

const createAlertConfirmStorySource = () => `import * as React from "react";
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
`;

const createModalStorySource = () => `import * as React from "react";
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
`;

const createDropdownMenuStorySource = () => `import * as React from "react";
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
`;

const createScrollAreaStorySource = () => `import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "../../../../index";

type ScrollAreaStoryArgs = {
  scrollBarSize: "sm" | "md" | "lg";
};

const meta: Meta<ScrollAreaStoryArgs> = {
  title: "Components/ScrollArea",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: { scrollBarSize: "md" },
  argTypes: {
    scrollBarSize: { control: "inline-radio", options: ["sm", "md", "lg"] }
  }
};

export default meta;
type Story = StoryObj<ScrollAreaStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <ScrollArea className="h-64 w-full rounded-[var(--radius-xl)] border border-default bg-surface p-3" scrollBarSize={args.scrollBarSize}>
      <div className="space-y-2 pr-2">
        {Array.from({ length: 24 }).map((_, index) => (
          <p key={index} className="text-body-sm text-foreground">
            변경 이력 #{index + 1} - CRDT state synchronized
          </p>
        ))}
      </div>
    </ScrollArea>
  )
};
`;

const createSheetStorySource = () => `import type { Meta, StoryObj } from "@storybook/react";
import {
  Button,
  Input,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "../../../../index";

type SheetStoryArgs = {
  side: "top" | "right" | "bottom" | "left";
  size: "sm" | "md" | "lg" | "xl";
  scrollBehavior: "inside" | "outside";
  showOverlay: boolean;
  showCloseButton: boolean;
  closeOnEscape: boolean;
  closeOnOutsideClick: boolean;
};

const meta: Meta<SheetStoryArgs> = {
  title: "Components/Sheet",
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: {
    side: "right",
    size: "md",
    scrollBehavior: "inside",
    showOverlay: true,
    showCloseButton: true,
    closeOnEscape: true,
    closeOnOutsideClick: true
  },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
    scrollBehavior: { control: "inline-radio", options: ["inside", "outside"] },
    showOverlay: { control: "boolean" },
    showCloseButton: { control: "boolean" },
    closeOnEscape: { control: "boolean" },
    closeOnOutsideClick: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<SheetStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">시트 열기</Button>
      </SheetTrigger>
      <SheetContent
        side={args.side}
        size={args.size}
        scrollBehavior={args.scrollBehavior}
        showOverlay={args.showOverlay}
        showCloseButton={args.showCloseButton}
        closeOnEscape={args.closeOnEscape}
        closeOnOutsideClick={args.closeOnOutsideClick}
      >
        <SheetHeader>
          <SheetTitle>보드 설정</SheetTitle>
          <SheetDescription>실제 설정 패널 패턴으로 구성된 시트입니다.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Input label="보드 이름" placeholder="예: 디자인 리뷰 보드" />
          <Input label="접근 키" placeholder="선택 입력" />
          <Input label="참여자 제한" placeholder="예: 20" />
          <Input label="자동 저장 주기(초)" placeholder="예: 5" />
          <Input label="알림 웹훅 URL" placeholder="https://..." />
          <Input label="태그" placeholder="예: 기획,디자인,개발" />
        </SheetBody>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">취소</Button>
          </SheetClose>
          <Button variant="primary">저장</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
};
`;

const createSkeletonStorySource = () => `import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "../../../../index";

type SkeletonStoryArgs = {
  variant: "rectangular" | "rounded" | "circular" | "text";
  size: "xs" | "sm" | "md" | "lg";
  color: "default" | "muted" | "subtle";
  animation: "pulse" | "none";
  speed: "slow" | "normal" | "fast";
  lines: number;
  lastLineWidth: string;
  fullWidth: boolean;
};

const meta: Meta<SkeletonStoryArgs> = {
  title: "Components/Skeleton",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    variant: "text",
    size: "md",
    color: "default",
    animation: "pulse",
    speed: "normal",
    lines: 3,
    lastLineWidth: "60%",
    fullWidth: true
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["text", "rounded", "rectangular", "circular"] },
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg"] },
    color: { control: "inline-radio", options: ["default", "muted", "subtle"] },
    animation: { control: "inline-radio", options: ["pulse", "none"] },
    speed: { control: "inline-radio", options: ["slow", "normal", "fast"] },
    lines: { control: { type: "number", min: 1, max: 8, step: 1 } },
    lastLineWidth: { control: "text" },
    fullWidth: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<SkeletonStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-xl space-y-3">
      <Skeleton
        variant={args.variant}
        size={args.size}
        color={args.color}
        animation={args.animation}
        speed={args.speed}
        lines={args.lines}
        lastLineWidth={args.lastLineWidth}
        fullWidth={args.fullWidth}
      />
    </div>
  )
};

export const CommonPatterns: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="space-y-2 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <h4 className="text-body-sm font-semibold">텍스트 블록</h4>
        <Skeleton variant="text" lines={4} lastLineWidth="45%" />
      </section>
      <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <h4 className="text-body-sm font-semibold">아바타 + 텍스트</h4>
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" size="lg" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" size="sm" lines={1} className="w-1/2" />
            <Skeleton variant="text" size="xs" lines={1} className="w-1/3" />
          </div>
        </div>
      </section>
      <section className="space-y-3 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <h4 className="text-body-sm font-semibold">카드 프리뷰</h4>
        <Skeleton variant="rounded" size="lg" className="h-28" />
        <Skeleton variant="text" lines={2} />
      </section>
      <section className="space-y-2 rounded-[var(--radius-xl)] border border-default bg-surface p-4">
        <h4 className="text-body-sm font-semibold">테이블 행</h4>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={\`row-\${index}\`} className="grid grid-cols-[1fr_120px_80px] gap-2">
              <Skeleton variant="text" size="sm" />
              <Skeleton variant="text" size="sm" />
              <Skeleton variant="rounded" size="sm" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
};
`;

const createTabsStorySource = () => `import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../index";

type TabsStoryArgs = {
  size: "sm" | "md" | "lg";
  variant: "pill" | "underline";
  fullWidth: boolean;
};

const meta: Meta<TabsStoryArgs> = {
  title: "Components/Tabs",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: { size: "md", variant: "pill", fullWidth: false },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["pill", "underline"] },
    fullWidth: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<TabsStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Tabs defaultValue="activity" className="w-full">
      <TabsList size={args.size} variant={args.variant} fullWidth={args.fullWidth}>
        <TabsTrigger value="activity" size={args.size} variant={args.variant}>활동</TabsTrigger>
        <TabsTrigger value="comments" size={args.size} variant={args.variant}>댓글</TabsTrigger>
        <TabsTrigger value="history" size={args.size} variant={args.variant}>이력</TabsTrigger>
      </TabsList>
      <TabsContent value="activity">실시간 이벤트 로그를 확인하세요.</TabsContent>
      <TabsContent value="comments">댓글/멘션 패널입니다.</TabsContent>
      <TabsContent value="history">문서 변경 이력 패널입니다.</TabsContent>
    </Tabs>
  )
};
`;

const createToastStorySource = () => `import type { Meta, StoryObj } from "@storybook/react";
import { Button, Toast, toast } from "../../../../index";

type ToastStoryArgs = {
  position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  richColors: boolean;
  expand: boolean;
  visibleToasts: number;
};

const meta: Meta<ToastStoryArgs> = {
  title: "Components/Toast",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: { position: "top-center", richColors: true, expand: false, visibleToasts: 4 },
  argTypes: {
    position: { control: "select", options: ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"] },
    richColors: { control: "boolean" },
    expand: { control: "boolean" },
    visibleToasts: { control: { type: "number", min: 1, max: 8, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<ToastStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <div className="space-y-3">
      <Toast position={args.position} richColors={args.richColors} expand={args.expand} visibleToasts={args.visibleToasts} />
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => toast.success("저장되었습니다.")}>success</Button>
        <Button variant="danger" onClick={() => toast.error("요청에 실패했습니다.")}>error</Button>
        <Button variant="outline" onClick={() => toast.warning("권한이 부족합니다.")}>warning</Button>
        <Button variant="secondary" onClick={() => toast.info("동기화가 완료되었습니다.")}>info</Button>
      </div>
    </div>
  )
};
`;

const createTooltipStorySource = () => `import type { Meta, StoryObj } from "@storybook/react";
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../index";

type TooltipStoryArgs = {
  size: "sm" | "md" | "lg";
  color: "default" | "inverse" | "primary";
  withArrow: boolean;
  placement: "top" | "right" | "bottom" | "left";
  alignment: "start" | "center" | "end";
  offset: number;
};

const meta: Meta<TooltipStoryArgs> = {
  title: "Components/Tooltip",
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: { size: "md", color: "inverse", withArrow: true, placement: "top", alignment: "center", offset: 8 },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    color: { control: "inline-radio", options: ["default", "inverse", "primary"] },
    withArrow: { control: "boolean" },
    placement: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    alignment: { control: "inline-radio", options: ["start", "center", "end"] },
    offset: { control: { type: "number", min: 0, max: 24, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<TooltipStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">툴팁 확인</Button>
        </TooltipTrigger>
        <TooltipContent
          size={args.size}
          color={args.color}
          withArrow={args.withArrow}
          placement={args.placement}
          alignment={args.alignment}
          offset={args.offset}
        >
          보호 키를 입력하면 editor 권한을 요청합니다.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
};
`;

const createPopoverStorySource = () => `import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, Popover, PopoverContent, PopoverTrigger, Select } from "../../../../index";

type PopoverStoryArgs = {
  triggerText: string;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
  sideOffset: number;
};

const meta: Meta<PopoverStoryArgs> = {
  title: "Components/Popover",
  tags: ["autodocs"],
  parameters: { layout: "centered", controls: { expanded: true } },
  args: {
    triggerText: "필터 열기",
    side: "bottom",
    align: "center",
    sideOffset: 8
  },
  argTypes: {
    triggerText: { control: "text" },
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    sideOffset: { control: { type: "number", min: 0, max: 24, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<PopoverStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">{args.triggerText}</Button>
      </PopoverTrigger>
      <PopoverContent side={args.side} align={args.align} sideOffset={args.sideOffset}>
        <div className="space-y-3">
          <h4 className="text-body-sm font-semibold">권한 필터</h4>
          <Select
            value="viewer"
            options={[
              { label: "viewer", value: "viewer" },
              { label: "editor", value: "editor" },
              { label: "admin", value: "admin" }
            ]}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
};
`;

const createAccordionStorySource = () => `import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../../index";

type AccordionStoryArgs = {
  type: "single" | "multiple";
  collapsible: boolean;
  size: "sm" | "md" | "lg";
  variant: "default" | "separated" | "contained";
};

const meta: Meta<AccordionStoryArgs> = {
  title: "Components/Accordion",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    type: "single",
    collapsible: true,
    size: "md",
    variant: "separated"
  },
  argTypes: {
    type: { control: "inline-radio", options: ["single", "multiple"] },
    collapsible: { control: "boolean" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["default", "separated", "contained"] }
  }
};

export default meta;
type Story = StoryObj<AccordionStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const rootProps =
      args.type === "single"
        ? { type: "single" as const, collapsible: args.collapsible, defaultValue: "item-1" }
        : { type: "multiple" as const, defaultValue: ["item-1"] };

    return (
      <Accordion {...rootProps} size={args.size} variant={args.variant}>
        <AccordionItem value="item-1">
          <AccordionTrigger>문서 권한 안내</AccordionTrigger>
          <AccordionContent>viewer는 읽기 전용, editor는 수정이 가능합니다.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>실시간 동기화</AccordionTrigger>
          <AccordionContent>변경 사항은 자동 저장되며 사용자 간 동기화됩니다.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
};
`;

const createErrorBoundaryStorySource = () => `import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button, ErrorBoundary } from "../../../../index";

type ErrorBoundaryStoryArgs = {
  fallbackTitle: string;
  fallbackDescription: string;
  fullScreen: boolean;
  showRetryButton: boolean;
  showRefreshButton: boolean;
  showHomeButton: boolean;
};

function CrashPanel() {
  const [shouldCrash, setShouldCrash] = React.useState(false);
  if (shouldCrash) {
    throw new Error("스토리북 오류 시뮬레이션");
  }
  return (
    <Button variant="danger" onClick={() => setShouldCrash(true)}>
      오류 발생시키기
    </Button>
  );
}

const meta: Meta<ErrorBoundaryStoryArgs> = {
  title: "Components/ErrorBoundary",
  component: ErrorBoundary,
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    fallbackTitle: "문제가 발생했습니다.",
    fallbackDescription: "잠시 후 다시 시도해주세요.",
    fullScreen: false,
    showRetryButton: true,
    showRefreshButton: true,
    showHomeButton: true
  }
};

export default meta;
type Story = StoryObj<ErrorBoundaryStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <ErrorBoundary {...args}>
      <CrashPanel />
    </ErrorBoundary>
  )
};
`;

const createAvatarStorySource = () => `import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "../../../../index";

type AvatarStoryArgs = {
  name: string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  shape: "circle" | "rounded" | "square";
  color: "default" | "primary" | "success" | "warning" | "danger";
  showStatus: boolean;
  status: "online" | "offline" | "away" | "busy";
};

const meta: Meta<AvatarStoryArgs> = {
  title: "Components/Avatar",
  tags: ["autodocs"],
  parameters: { layout: "padded", controls: { expanded: true } },
  args: {
    name: "게스트-923",
    size: "md",
    shape: "circle",
    color: "default",
    showStatus: true,
    status: "online"
  }
};

export default meta;
type Story = StoryObj<AvatarStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback color={args.color}>
        <UserRound className="h-[60%] w-[60%]" />
      </AvatarFallback>
    </Avatar>
  )
};
`;

const createCardStorySource = () => `import type { Meta, StoryObj } from "@storybook/react";
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../index";

type CardStoryArgs = {
  variant: "default" | "elevated" | "muted" | "ghost";
  padding: "none" | "sm" | "md" | "lg";
  radius: "md" | "lg" | "xl";
  bordered: boolean;
  interactive: boolean;
  showBadge: boolean;
  showFooterAction: boolean;
};

const meta: Meta<CardStoryArgs> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { expanded: true, exclude: ["className", "style", "children", "id", /^on[A-Z].*/] }
  },
  args: {
    variant: "elevated",
    padding: "md",
    radius: "xl",
    bordered: true,
    interactive: false,
    showBadge: true,
    showFooterAction: true
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "elevated", "muted", "ghost"] },
    padding: { control: "inline-radio", options: ["none", "sm", "md", "lg"] },
    radius: { control: "inline-radio", options: ["md", "lg", "xl"] },
    bordered: { control: "boolean" },
    interactive: { control: "boolean" },
    showBadge: { control: "boolean" },
    showFooterAction: { control: "boolean" }
  }
};

export default meta;
type Story = StoryObj<CardStoryArgs>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-xl">
      <Card
        variant={args.variant}
        padding={args.padding}
        radius={args.radius}
        bordered={args.bordered}
        interactive={args.interactive}
      >
        <CardHeader padding="none">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>협업 문서 카드</CardTitle>
            {args.showBadge ? <Badge variant="info">live</Badge> : null}
          </div>
          <CardDescription>권한, 상태, 메타 데이터를 묶어 표현하는 기본 카드 패턴입니다.</CardDescription>
        </CardHeader>
        <CardContent padding="none">
          <div className="text-body-sm text-muted space-y-1">
            <p>최근 수정: 2분 전</p>
            <p>동시 접속: 3명</p>
          </div>
        </CardContent>
        <CardFooter padding="none" className="mt-4 justify-end gap-2">
          {args.showFooterAction ? (
            <>
              <Button size="sm" variant="outline">닫기</Button>
              <Button size="sm" variant="primary">열기</Button>
            </>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
};
`;

const createDataTableStorySource = () => `import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Badge, Button, DataTable, DataTableColumnHeader } from "../../../../index";

type IssueRow = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved";
  service: string;
  occurrences: number;
  updatedAt: string;
};

type DataTableStoryArgs = {
  isLoading: boolean;
  isError: boolean;
  enablePagination: boolean;
  paginationAlign: "left" | "center" | "right";
  columnDivider: boolean;
  headerTextAlign: "left" | "center" | "right";
  cellTextAlign: "left" | "center" | "right";
  selectable: boolean;
  rowSelectionMode: "single" | "multiple";
  sortable: boolean;
  columnResizeEnabled: boolean;
  virtualized: boolean;
  virtualizationMode: "paged" | "infinite";
  virtualRowHeight: number;
  virtualOverscan: number;
  tableDensity: "compact" | "default" | "comfortable";
  stickyHeader: boolean;
  striped: boolean;
  emptyTitle: string;
  errorTitle: string;
  defaultPageSize: number;
};

const rows: IssueRow[] = [
  {
    id: "ISSUE-1024",
    title: "문서 권한 강등 후 재요청 루프",
    severity: "high",
    status: "investigating",
    service: "docs-api",
    occurrences: 37,
    updatedAt: "2분 전"
  },
  {
    id: "ISSUE-1021",
    title: "화이트보드 연결 끊김 재연결 지연",
    severity: "medium",
    status: "open",
    service: "socket-gateway",
    occurrences: 14,
    updatedAt: "11분 전"
  },
  {
    id: "ISSUE-998",
    title: "보호 키 검증 실패 토스트 문구 누락",
    severity: "low",
    status: "resolved",
    service: "ui-shell",
    occurrences: 5,
    updatedAt: "34분 전"
  }
];

const severityToBadge: Record<IssueRow["severity"], "danger" | "warning" | "info" | "secondary"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "info"
};

const statusToBadge: Record<IssueRow["status"], "danger" | "warning" | "success"> = {
  open: "danger",
  investigating: "warning",
  resolved: "success"
};

const columns = [
  {
    id: "title",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="이슈" />,
    cell: ({ row }: { row: { original: IssueRow } }) => (
      <div className="space-y-0.5">
        <p className="font-medium">{row.original.title}</p>
        <p className="text-muted text-xs">{row.original.id}</p>
      </div>
    )
  },
  {
    id: "severity",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="심각도" />,
    cell: ({ row }: { row: { original: IssueRow } }) => (
      <Badge variant={severityToBadge[row.original.severity]}>{row.original.severity}</Badge>
    )
  },
  {
    id: "status",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="상태" />,
    cell: ({ row }: { row: { original: IssueRow } }) => <Badge variant={statusToBadge[row.original.status]}>{row.original.status}</Badge>
  },
  {
    id: "service",
    accessorKey: "service",
    fixed: "left",
    width: 180,
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="서비스" />
  },
  {
    id: "occurrences",
    accessorKey: "occurrences",
    align: "right",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="발생 횟수" />,
    cellClassName: ({ value }: { value: unknown }) => (Number(value) >= 30 ? "text-danger font-semibold" : undefined)
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="최근 발생" />
  },
  {
    id: "action",
    header: ({ column }: { column: { id: string } }) => <DataTableColumnHeader column={column} title="액션" />,
    fixed: "right",
    align: "center",
    width: 120,
    render: ({ row }: { row: { isLast: boolean } }) =>
      row.isLast ? (
        <Button size="sm" variant="outline" onClick={() => window.alert("마지막 행 액션")}>
          선택
        </Button>
      ) : (
        "-"
      )
  }
];

const meta: Meta<DataTableStoryArgs> = {
  title: "Components/DataTable",
  component: DataTable,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { expanded: true, exclude: ["className", "id", "name", /^on[A-Z].*/] }
  },
  args: {
    isLoading: false,
    isError: false,
    enablePagination: true,
    paginationAlign: "center",
    columnDivider: false,
    headerTextAlign: "center",
    cellTextAlign: "center",
    selectable: false,
    rowSelectionMode: "multiple",
    sortable: false,
    columnResizeEnabled: true,
    virtualized: false,
    virtualizationMode: "paged",
    virtualRowHeight: 44,
    virtualOverscan: 6,
    tableDensity: "default",
    stickyHeader: true,
    striped: true,
    emptyTitle: "표시할 이슈가 없습니다.",
    errorTitle: "이슈 목록을 불러오지 못했습니다.",
    defaultPageSize: 10
  },
  argTypes: {
    isLoading: { control: "boolean" },
    isError: { control: "boolean" },
    enablePagination: { control: "boolean" },
    paginationAlign: { control: "inline-radio", options: ["left", "center", "right"] },
    columnDivider: { control: "boolean" },
    headerTextAlign: { control: "inline-radio", options: ["left", "center", "right"] },
    cellTextAlign: { control: "inline-radio", options: ["left", "center", "right"] },
    selectable: { control: "boolean" },
    rowSelectionMode: { control: "inline-radio", options: ["single", "multiple"] },
    sortable: { control: "boolean" },
    columnResizeEnabled: { control: "boolean" },
    virtualized: { control: "boolean" },
    virtualizationMode: { control: "inline-radio", options: ["paged", "infinite"] },
    virtualRowHeight: { control: { type: "number", min: 24, step: 1 } },
    virtualOverscan: { control: { type: "number", min: 0, step: 1 } },
    tableDensity: { control: "inline-radio", options: ["compact", "default", "comfortable"] },
    stickyHeader: { control: "boolean" },
    striped: { control: "boolean" },
    emptyTitle: { control: "text" },
    errorTitle: { control: "text" },
    defaultPageSize: { control: { type: "number", min: 1, step: 1 } }
  }
};

export default meta;
type Story = StoryObj<DataTableStoryArgs>;

export const Playground: Story = {
  render: (args) => {
    const [filters, setFilters] = React.useState<Record<string, string>>({});

    return (
      <DataTable<IssueRow>
        columns={columns}
        data={rows}
        isLoading={args.isLoading}
        isError={args.isError}
        enablePagination={args.enablePagination}
        paginationAlign={args.paginationAlign}
        columnDivider={args.columnDivider}
        headerTextAlign={args.headerTextAlign}
        cellTextAlign={args.cellTextAlign}
        selectable={args.selectable}
        rowSelectionMode={args.rowSelectionMode}
        sortable={args.sortable}
        columnResizeEnabled={args.columnResizeEnabled}
        virtualized={args.virtualized}
        virtualizationMode={args.virtualizationMode}
        virtualRowHeight={args.virtualRowHeight}
        virtualOverscan={args.virtualOverscan}
        emptyTitle={args.emptyTitle}
        errorTitle={args.errorTitle}
        tableDensity={args.tableDensity}
        stickyHeader={args.stickyHeader}
        striped={args.striped}
        defaultPageSize={args.defaultPageSize}
        filters={filters}
        onFiltersChange={(nextFilters) => setFilters(nextFilters as Record<string, string>)}
        filterFn={(row, activeFilters) => {
          const keyword = String(activeFilters.keyword ?? "").trim().toLowerCase();
          if (!keyword) return true;
          return (
            row.title.toLowerCase().includes(keyword) ||
            row.id.toLowerCase().includes(keyword) ||
            row.service.toLowerCase().includes(keyword) ||
            row.status.toLowerCase().includes(keyword) ||
            row.severity.toLowerCase().includes(keyword)
          );
        }}
        toolbar={({ query, setFilters, resetFilters }) => (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={String(query.filters.keyword ?? "")}
              onChange={(event) => setFilters({ ...query.filters, keyword: event.currentTarget.value })}
              placeholder="키워드 검색"
              className="border-default h-9 w-[220px] rounded-[var(--radius-md)] border bg-surface px-3 text-sm"
            />
            <Button size="sm" variant="outline" onClick={resetFilters}>
              초기화
            </Button>
          </div>
        )}
        getRowId={(row) => row.id}
      />
    );
  }
};
`;

const QUALITY_STORY_OVERRIDES = {
  Card: createCardStorySource,
  AlertConfirm: createAlertConfirmStorySource,
  Modal: createModalStorySource,
  DropdownMenu: createDropdownMenuStorySource,
  ScrollArea: createScrollAreaStorySource,
  Sheet: createSheetStorySource,
  Skeleton: createSkeletonStorySource,
  Tabs: createTabsStorySource,
  Toast: createToastStorySource,
  Tooltip: createTooltipStorySource,
  DataTable: createDataTableStorySource,
  Popover: createPopoverStorySource,
  Accordion: createAccordionStorySource,
  ErrorBoundary: createErrorBoundaryStorySource,
  Avatar: createAvatarStorySource
};

const createStorySource = (componentName) => {
  const override = QUALITY_STORY_OVERRIDES[componentName];
  if (override) {
    return toPlaygroundStatesOverrideSource(override(), componentName);
  }

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
  title: "Components/${componentName}",
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
    <${componentName}
      {...sanitizeStoryArgs(args as Record<string, unknown>)}
  ${playgroundCloseTag}
  )
};
`;
};

const runGeneratedStoryValidation = async (modeLabel) => {
  const { fileCount, errors } = await validateGeneratedStories(GENERATED_STORIES_DIR);
  if (errors.length === 0) {
    console.log(`[storybook:${modeLabel}] 검증 통과: ${fileCount}개 스토리`);
    return;
  }

  console.error(`[storybook:${modeLabel}] 검증 실패: ${errors.length}건`);
  for (const error of errors) {
    console.error(`- ${path.relative(ROOT, error.filePath)}: ${error.reason}`);
  }
  process.exit(1);
};

const runCheck = async () => {
  const indexSource = await fs.readFile(COMPONENT_INDEX_PATH, "utf8");
  const expected = parseExportedNames(indexSource);
  const existing = await collectExistingStoryNames();
  const missing = expected.filter((name) => !existing.has(name));

  if (missing.length === 0) {
    console.log(`[storybook:check] OK - 모든 대상 컴포넌트(${expected.length})에 스토리가 있습니다.`);
    await runGeneratedStoryValidation("check");
    return;
  }

  console.error(`[storybook:check] 누락된 스토리: ${missing.length}`);
  console.error(missing.map((name) => `- ${name}`).join("\n"));
  console.error("\n실행: pnpm storybook:gen");
  process.exit(1);
};

const runGenerate = async () => {
  await initializeDerivedComponentMaps();
  const componentIndexSource = await fs.readFile(COMPONENT_INDEX_PATH, "utf8");
  const exportedComponentNames = parseExportedNames(componentIndexSource);

  await fs.rm(LEGACY_AUTO_STORIES_DIR, { recursive: true, force: true });
  await fs.rm(path.join(STORIES_ROOT, "components/actions"), { recursive: true, force: true });
  await fs.rm(path.join(STORIES_ROOT, "components/forms"), { recursive: true, force: true });
  await fs.mkdir(GENERATED_STORIES_DIR, { recursive: true });

  const existingStoryRelativePaths = await collectGeneratedStoryRelativePaths(GENERATED_STORIES_DIR);
  const nextStoryRelativePaths = new Set();

  const created = [];
  const byCategory = new Map();
  let updated = 0;
  let unchanged = 0;

  for (const componentName of exportedComponentNames) {
    const category = resolveCategory(componentName);
    const categoryDir = path.join(GENERATED_STORIES_DIR, category.key);
    const storyFileName = `${componentName}.stories.tsx`;
    const storyPath = path.join(categoryDir, storyFileName);
    const relativeStoryPath = path.join(category.key, storyFileName);
    const nextStorySource = createStorySource(componentName);

    await fs.mkdir(categoryDir, { recursive: true });
    nextStoryRelativePaths.add(relativeStoryPath);

    let previousStorySource = null;
    try {
      previousStorySource = await fs.readFile(storyPath, "utf8");
    } catch {
      previousStorySource = null;
    }

    if (previousStorySource === nextStorySource) {
      unchanged += 1;
    } else {
      await fs.writeFile(storyPath, nextStorySource, "utf8");
      updated += 1;
    }

    created.push(componentName);
    byCategory.set(category.title, (byCategory.get(category.title) ?? 0) + 1);
  }

  let removed = 0;
  for (const relativeStoryPath of existingStoryRelativePaths) {
    if (nextStoryRelativePaths.has(relativeStoryPath)) continue;
    await fs.rm(path.join(GENERATED_STORIES_DIR, relativeStoryPath), { force: true });
    removed += 1;
  }

  const categoryDirs = await fs.readdir(GENERATED_STORIES_DIR, { withFileTypes: true });
  for (const entry of categoryDirs) {
    if (!entry.isDirectory()) continue;
    await pruneEmptyDirectories(path.join(GENERATED_STORIES_DIR, entry.name));
  }

  console.log(`[storybook:gen] 대상 컴포넌트: ${exportedComponentNames.length}`);
  console.log(`[storybook:gen] 생성: ${created.length}`);
  console.log(`[storybook:gen] 갱신: ${updated}`);
  console.log(`[storybook:gen] 유지: ${unchanged}`);
  console.log(`[storybook:gen] 정리: 제거 ${removed}`);

  if (byCategory.size > 0) {
    const summary = [...byCategory.entries()]
      .map(([category, count]) => `${category}=${count}`)
      .join(", ");
    console.log(`[storybook:gen] 카테고리: ${summary}`);
  }

  if (created.length > 0) {
    console.log(`[storybook:gen] 생성 목록: ${created.join(", ")}`);
  }

  await runGeneratedStoryValidation("gen");
};

const main = async () => {
  const args = new Set(process.argv.slice(2));
  if (args.has("--check")) {
    await runCheck();
    return;
  }
  await runGenerate();
};

main().catch((error) => {
  const mode = process.argv.slice(2).includes("--check") ? "check" : "gen";
  console.error(`[storybook:${mode}] 실패:`, error);
  process.exit(1);
});
