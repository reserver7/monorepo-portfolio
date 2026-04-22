"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../button";
import { Card } from "../card";
import { cn } from "../cn";
import { Typography } from "../typography";
import { ERROR_BOUNDARY_DEFAULTS } from "./error-boundary.constants";
import { navigateToHomeSafely, shouldShowErrorDetail } from "./error-boundary.utils";
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorFallbackViewProps
} from "./error-boundary.types";

function ErrorFallbackView({
  title,
  description,
  detail,
  onRetry,
  fullScreen,
  showRetryButton,
  showRefreshButton,
  showHomeButton,
  showDetailInDev
}: ErrorFallbackViewProps) {
  return (
    <div className="bg-background px-4 py-8 md:px-8">
      <div
        className={cn(
          "mx-auto flex w-full max-w-2xl items-center justify-center",
          fullScreen ? "min-h-[var(--size-error-boundary-full-min-h)]" : "min-h-[var(--size-error-boundary-min-h)]"
        )}
      >
        <Card className="border-default bg-surface w-full rounded-[var(--radius-xl)] border p-6 shadow-card md:p-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="bg-danger/10 text-danger mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <AlertCircle className="h-6 w-6" />
            </div>

            <Typography as="h2" variant="h2" className="leading-tight">
              {title}
            </Typography>
            <Typography variant="body" color="subtle" className="mt-2 leading-7">
              {description}
            </Typography>

            <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-2">
              {showRetryButton ? (
                <Button variant="primary" size="md" onClick={onRetry}>
                  다시 시도
                </Button>
              ) : null}
              {showRefreshButton ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.reload();
                    }
                  }}
                >
                  새로고침
                </Button>
              ) : null}
              {showHomeButton ? (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    navigateToHomeSafely();
                  }}
                >
                  홈으로
                </Button>
              ) : null}
            </div>

            {shouldShowErrorDetail(showDetailInDev) && detail ? (
              <details className="border-default bg-surface-elevated mt-6 w-full rounded-[var(--radius-xl)] border p-3 text-left">
                <summary className="text-body-sm text-foreground cursor-pointer font-semibold">
                  개발용 오류 상세
                </summary>
                <Typography
                  as="pre"
                  variant="caption"
                  color="subtle"
                  className="mt-2 whitespace-pre-wrap break-words"
                >
                  {detail}
                </Typography>
              </details>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message, stack: error.stack };
  }

  componentDidCatch() {
    // noop
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const {
      fallbackTitle,
      fallbackDescription,
      onReset,
      fullScreen = ERROR_BOUNDARY_DEFAULTS.fullScreen,
      showRetryButton = ERROR_BOUNDARY_DEFAULTS.showRetryButton,
      showRefreshButton = ERROR_BOUNDARY_DEFAULTS.showRefreshButton,
      showHomeButton = ERROR_BOUNDARY_DEFAULTS.showHomeButton,
      showDetailInDev = ERROR_BOUNDARY_DEFAULTS.showDetailInDev
    } = this.props;

    return (
      <ErrorFallbackView
        title={fallbackTitle ?? ERROR_BOUNDARY_DEFAULTS.fallbackTitle}
        description={fallbackDescription ?? this.state.message ?? ERROR_BOUNDARY_DEFAULTS.fallbackDescription}
        detail={this.state.stack ?? this.state.message}
        fullScreen={fullScreen}
        showRetryButton={showRetryButton}
        showRefreshButton={showRefreshButton}
        showHomeButton={showHomeButton}
        showDetailInDev={showDetailInDev}
        onRetry={() => {
          this.setState({ hasError: false, message: undefined, stack: undefined });
          onReset?.();
        }}
      />
    );
  }
}
