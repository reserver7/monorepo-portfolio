"use client";

import type { PropsWithChildren } from "react";
import {
  QueryClientProvider,
  createAppQueryClient,
  type QueryClientConfig
} from "@repo/react-query";
import { AlertConfirmProvider, ErrorBoundary, Toaster, useStableValue } from "@repo/ui";
import type { ToasterProps } from "@repo/ui";
import { AppThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

export interface AppProvidersProps extends PropsWithChildren {
  queryClientConfig?: QueryClientConfig;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onResetError?: () => void;
  showThemeToggle?: boolean;
  showToaster?: boolean;
  toasterOptions?: ToasterProps;
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
        </ErrorBoundary>
        {showThemeToggle ? <ThemeToggle /> : null}
        {showToaster ? <Toaster {...toasterOptions} /> : null}
      </QueryClientProvider>
    </AppThemeProvider>
  );
}
