import { FeedbackState } from "@/features/common/components/feedback-state";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <FeedbackState variant="loading" title="화면을 불러오는 중입니다." description="잠시만 기다려 주세요." />
    </main>
  );
}
