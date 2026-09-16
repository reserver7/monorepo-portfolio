import { Box } from "@repo/ui";
import { FeedbackState } from "@/features/common/components/feedback-state";
import { formatDateTime } from "@repo/utils";
import type { Issue } from "@repo/opslens";

type IssueLogListProps = {
  logs: Issue["logs"];
};

export function IssueLogList({ logs }: IssueLogListProps) {
  const t = useTranslations("issues.logs");
  const locale = useLocale();
  if (logs.length === 0) {
    return <FeedbackState variant="empty" size="sm" title="로그 데이터가 없습니다." className="mt-[var(--space-3)]" />;
  }

  return (
    <Box className="mt-[var(--space-3)] max-h-[360px] space-y-[var(--space-2)] overflow-auto pr-1">
      {logs.map((log) => (
        <Box key={log.id} className="border-default rounded-lg border p-[var(--space-3)]">
          <Box as="p" className="text-muted-foreground text-caption">
            {formatDateTime(log.occurredAt, locale)} · {log.source} · {log.level}
          </Box>
          <Box
            as="p"
            className="text-foreground text-caption mt-[var(--space-1)] whitespace-pre-wrap break-all font-mono"
          >
            {log.rawMessage}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
