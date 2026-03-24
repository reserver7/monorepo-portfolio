"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactNode, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Providers = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="collab-theme">
      <QueryClientProvider client={queryClient}>
        {children}
        <ThemeToggle />
      </QueryClientProvider>
    </ThemeProvider>
  );
};
