export const isBrowser = () => {
  const target = globalThis as { window?: unknown };
  return typeof target.window !== "undefined";
};

export const getGlobalWindow = <TWindow extends object = object>(): TWindow | null => {
  const target = (globalThis as { window?: unknown }).window;
  if (!target) {
    return null;
  }

  return target as TWindow;
};
