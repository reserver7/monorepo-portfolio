import * as React from "react";

export interface ErrorBoundaryProps extends React.PropsWithChildren {
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
  fullScreen?: boolean;
  showRetryButton?: boolean;
  showRefreshButton?: boolean;
  showHomeButton?: boolean;
  showDetailInDev?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
  stack?: string;
}

export interface ErrorFallbackViewProps {
  title: string;
  description: string;
  detail?: string;
  onRetry: () => void;
  fullScreen: boolean;
  showRetryButton: boolean;
  showRefreshButton: boolean;
  showHomeButton: boolean;
  showDetailInDev: boolean;
}
