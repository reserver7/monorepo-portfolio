"use client";

import type { PropsWithChildren } from "react";
import { QueryClientProvider, createAppQueryClient, type QueryClientConfig } from "@repo/react-query";
import { AlertConfirmProvider, AutoEllipsisTooltip, ErrorBoundary, Toast, useStableValue } from "@repo/ui";
import type { ToastProps } from "@repo/ui";
import { AppThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

export interface AppProvidersProps extends PropsWithChildren {
  queryClientConfig?: QueryClientConfig;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onResetError?: () => void;
  showThemeToggle?: boolean;
  showToaster?: boolean;
  toasterOptions?: ToastProps;
}

export function AppProviders({
  children,
  queryClientConfig,
  fallbackTitle,
  fallbackDescription,
  onResetError,
  showThemeToggle = true,
  showToaster = true,
  toasterOptions
}: AppProvidersProps) {
  const queryClient = useStableValue(() => createAppQueryClient(queryClientConfig));

  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          fallbackTitle={fallbackTitle}
          fallbackDescription={fallbackDescription}
          onReset={onResetError}
        >
          {children}
          <AlertConfirmProvider />
          <AutoEllipsisTooltip />
        </ErrorBoundary>
        {showThemeToggle ? <ThemeToggle /> : null}
        {showToaster ? <Toast {...toasterOptions} /> : null}
      </QueryClientProvider>
    </AppThemeProvider>
  );
}
