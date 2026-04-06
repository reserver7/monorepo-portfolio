import type { Preview } from "@storybook/react";
import "./preview.css";

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
        order: [
          "Foundations",
          ["Colors", ["Primitive Palette", "Semantic Tokens"], "Typography Tokens"],
          "Components",
          ["Generated", ["Actions", "Forms Primitives", "Overlays", "Feedback", "Data", "Navigation", "Layout", "Misc"]],
          "Patterns"
        ]
      }
    }
  }
};

export default preview;
