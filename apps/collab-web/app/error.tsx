"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui";
import { FeedbackState } from "@/features/common/components/feedback-state";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <FeedbackState
        variant="error"
        title="화면을 불러오지 못했습니다."
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={reset}>다시 시도</Button>}
      />
    </main>
  );
}
