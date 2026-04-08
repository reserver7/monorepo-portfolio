import * as React from "react";
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
