export const isWorkspaceSearchShortcut = (
  key: string,
  hasMetaKey: boolean,
  hasControlKey: boolean
): boolean =>
  (key === "/" && !hasMetaKey && !hasControlKey) ||
  (key.toLowerCase() === "k" && (hasMetaKey || hasControlKey));
