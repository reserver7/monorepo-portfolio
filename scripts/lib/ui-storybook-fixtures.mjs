const escapeText = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const STORYBOOK_SELECT_OPTIONS = [
  { label: "옵션 A", value: "a" },
  { label: "옵션 B", value: "b" },
  { label: "옵션 C", value: "c" }
];

export const STORYBOOK_ROLE_OPTIONS = [
  { label: "viewer", value: "viewer" },
  { label: "editor", value: "editor" }
];

export const STORYBOOK_DATA_TABLE_COLUMNS = [
  { id: "name", header: "이름", accessorKey: "name" },
  { id: "role", header: "권한", accessorKey: "role" },
  { id: "updatedAt", header: "최근 수정", accessorKey: "updatedAt" }
];

export const STORYBOOK_DATA_TABLE_ROWS = [
  { name: "게스트-923", role: "viewer", updatedAt: "2분 전" },
  { name: "게스트-101", role: "editor", updatedAt: "10분 전" },
  { name: "게스트-777", role: "admin", updatedAt: "31분 전" }
];

export const STORYBOOK_FLEX_ITEMS = ["Item A", "Item B", "Item C"];
export const STORYBOOK_GRID_ITEMS = ["Card 1", "Card 2", "Card 3", "Card 4"];

export const toChipChildrenMarkup = (items) =>
  items
    .map(
      (item) =>
        `<div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated px-3 py-1.5 text-body-sm">${escapeText(item)}</div>`
    )
    .join("\n    ");

export const toCardChildrenMarkup = (items) =>
  items
    .map(
      (item) =>
        `<div className="rounded-[var(--radius-md)] border border-default bg-surface-elevated p-3 text-body-sm">${escapeText(item)}</div>`
    )
    .join("\n    ");

