"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppProviders, type AppProvidersProps } from "./app-providers";

type WrapChildren = (children: ReactNode) => ReactNode;

export interface CreateAppProvidersOptions extends Pick<
  AppProvidersProps,
  | "queryClientConfig"
  | "fallbackTitle"
  | "fallbackDescription"
  | "showThemeToggle"
  | "showToaster"
  | "toasterOptions"
> {
  wrapChildren?: WrapChildren;
}

export function createAppProviders(options: CreateAppProvidersOptions) {
  return function Providers({ children }: PropsWithChildren) {
    const router = useRouter();

    const content = (
      <AppProviders
        queryClientConfig={options.queryClientConfig}
        fallbackTitle={options.fallbackTitle}
        fallbackDescription={options.fallbackDescription}
        showThemeToggle={options.showThemeToggle}
        showToaster={options.showToaster}
        toasterOptions={options.toasterOptions}
        onResetError={() => router.refresh()}
      >
        {children}
      </AppProviders>
    );

    return options.wrapChildren ? <>{options.wrapChildren(content)}</> : content;
  };
}
