import type { Preview } from "@storybook/react";
import { THEME_PRELOAD_FONT_HREFS } from "@repo/theme";
import "./preview.css";

const ensurePreloadFonts = (hrefs: readonly string[]) => {
  if (typeof document === "undefined") return;
  for (const href of hrefs) {
    const selector = `link[rel="preload"][as="font"][href="${href}"]`;
    if (document.head.querySelector(selector)) continue;
    const link = document.createElement("link");
    link.setAttribute("rel", "preload");
    link.setAttribute("as", "font");
    link.setAttribute("href", href);
    link.setAttribute("type", "font/woff2");
    link.setAttribute("crossorigin", "anonymous");
    document.head.appendChild(link);
  }
};

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global color theme",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" }
        ],
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (Story, context) => {
      ensurePreloadFonts(THEME_PRELOAD_FONT_HREFS);
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
      const storyTitle = context.title ?? "";
      const storyId = context.id ?? "";
      const shouldCenter =
        storyTitle.startsWith("Foundations/Colors") ||
        storyTitle.startsWith("Foundations/Typography") ||
        storyId.includes("foundations-colors") ||
        storyId.includes("foundations-typography");

      if (!shouldCenter) {
        return <Story />;
      }

      return <div className="sb-center-wrap"><Story /></div>;
    }
  ],
  parameters: {
    layout: "padded",
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    options: {
      storySort: {
        order: ["Foundations", "*"],
        method: "alphabetical",
        locales: "ko-KR"
      }
    }
  }
};

export default preview;
