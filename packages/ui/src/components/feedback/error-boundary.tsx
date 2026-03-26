"use client";
import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "../form/button";
type ErrorBoundaryState = { error: Error | null };
export type ErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
};
class UiErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { error: null };
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }
  public componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }
  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };
  public render() {
    if (!this.state.error) {
      return this.props.children;
    }
    return (
      <div className="mx-auto my-10 max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-950 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-100">
        <p className="text-sm font-semibold">{this.props.fallbackTitle ?? "오류가 발생했습니다."}</p>
        <p className="mt-1 text-sm opacity-90">
          {this.props.fallbackDescription ?? "잠시 후 다시 시도하거나 새로고침해 주세요."}
        </p>
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={this.reset}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }
}
export const ErrorBoundary = UiErrorBoundary;
