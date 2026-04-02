"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import { Typography } from "./typography";

export interface ErrorBoundaryProps extends React.PropsWithChildren {
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
  stack?: string;
}

interface ErrorFallbackViewProps {
  title: string;
  description: string;
  detail?: string;
  onRetry: () => void;
}

function ErrorFallbackView({ title, description, detail, onRetry }: ErrorFallbackViewProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center justify-center">
        <Card className="w-full rounded-2xl border border-default bg-surface p-6 shadow-sm md:p-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertCircle className="h-6 w-6" />
            </div>

            <Typography as="h2" variant="h2" className="leading-tight">
              {title}
            </Typography>
            <Typography variant="body" tone="subtle" className="mt-2 leading-7">
              {description}
            </Typography>

            <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-2">
              <Button variant="primary" size="md" onClick={onRetry}>
                다시 시도
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  router.refresh();
                }}
              >
                새로고침
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  router.push("/");
                }}
              >
                홈으로
              </Button>
            </div>

            {process.env.NODE_ENV !== "production" && detail ? (
              <details className="mt-6 w-full rounded-xl border border-default bg-surface-elevated p-3 text-left">
                <summary className="cursor-pointer text-body-sm font-semibold text-foreground">
                  개발용 오류 상세
                </summary>
                <Typography as="pre" variant="caption" tone="subtle" className="mt-2 whitespace-pre-wrap break-words">
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

    const { fallbackTitle, fallbackDescription, onReset } = this.props;

    return (
      <ErrorFallbackView
        title={fallbackTitle ?? "예기치 않은 오류가 발생했습니다."}
        description={fallbackDescription ?? this.state.message ?? "잠시 후 다시 시도해 주세요."}
        detail={this.state.stack ?? this.state.message}
        onRetry={() => {
          this.setState({ hasError: false, message: undefined, stack: undefined });
          onReset?.();
        }}
      />
    );
  }
}
