export const shouldShowErrorDetail = (showDetailInDev: boolean) =>
  showDetailInDev && process.env.NODE_ENV !== "production";

const isStorybookPreviewFrame = () => {
  if (typeof window === "undefined") return false;
  return window.location.pathname.includes("iframe.html") || window.location.search.includes("path=/story/");
};

export const navigateToHomeSafely = () => {
  if (typeof window === "undefined") return;

  const isInFrame = window.self !== window.top;
  if (isInFrame && isStorybookPreviewFrame() && window.top) {
    window.top.location.assign("/");
    return;
  }

  window.location.assign("/");
};
