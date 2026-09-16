"use client";

import type { PropsWithChildren } from "react";
import { QueryClientProvider, createAppQueryClient, type QueryClientConfig } from "@repo/react-query";
import { AutoEllipsisTooltip, ErrorBoundary, useStableValue } from "@repo/ui";
import { AlertConfirmProvider, Toast } from "@repo/ui/internal";
import type { ToastProps } from "@repo/ui/internal";
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
  locale?: string;
}

export function AppProviders({
  children,
  queryClientConfig,
  fallbackTitle,
  fallbackDescription,
  onResetError,
  showThemeToggle = true,
  showToaster = true,
  toasterOptions,
  locale
}: AppProvidersProps) {
  const queryClient = useStableValue(() => createAppQueryClient(queryClientConfig));

  return (
    <AppThemeProvider>
      <QueryClientProvider client={queryClient}>
        <UiLocaleProvider locale={locale}>
          <ErrorBoundary
            fallbackTitle={fallbackTitle}
            fallbackDescription={fallbackDescription}
            onReset={onResetError}
          >
            {children}
            <AlertConfirmProvider />
            <AutoEllipsisTooltip />
          </ErrorBoundary>
        </UiLocaleProvider>
        {showThemeToggle ? <ThemeToggle /> : null}
        {showToaster ? <Toast {...toasterOptions} /> : null}
      </QueryClientProvider>
    </AppThemeProvider>
  );
}
