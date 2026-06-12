import { Box, StateView } from "@repo/ui";
import { formatDateTime } from "@repo/utils";
import type { Issue } from "@repo/opslens";

type IssueLogListProps = {
  logs: Issue["logs"];
};

export function IssueLogList({ logs }: IssueLogListProps) {
  if (logs.length === 0) {
    return <StateView variant="empty" size="sm" title="로그 데이터가 없습니다." className="mt-[var(--space-3)]" />;
  }

  return (
    <Box className="mt-[var(--space-3)] max-h-[360px] space-y-[var(--space-2)] overflow-auto pr-1">
      {logs.map((log) => (
        <Box key={log.id} className="border-default rounded-lg border p-[var(--space-3)]">
          <Box as="p" className="text-muted-foreground text-caption">
            {formatDateTime(log.occurredAt)} · {log.source} · {log.level}
          </Box>
          <Box as="p" className="text-foreground mt-[var(--space-1)] whitespace-pre-wrap break-all font-mono text-caption">
            {log.rawMessage}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
