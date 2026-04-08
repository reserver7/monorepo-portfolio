export const getInitials = (name?: string, fallbackText?: string): string => {
  if (fallbackText && fallbackText.trim().length > 0) {
    return fallbackText.trim().slice(0, 2).toUpperCase();
  }

  if (!name || name.trim().length === 0) {
    return "?";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return (parts[0] ?? "?").slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
};
