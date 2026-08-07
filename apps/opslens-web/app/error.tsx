"use client";

import { useEffect } from "react";
import { Box, Button, StateView } from "@repo/ui";

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box className="bg-background flex min-h-screen items-center justify-center p-[var(--space-4)]">
      <Box className="w-full max-w-2xl">
        <StateView
          variant="error"
          size="lg"
          align="center"
          title="화면을 불러오지 못했습니다."
          description="잠시 후 다시 시도하거나 새로고침해 주세요."
          action={<Button onClick={reset}>다시 시도</Button>}
        />
      </Box>
    </Box>
  );
}
