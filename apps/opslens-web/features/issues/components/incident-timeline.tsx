import { Badge, Box, Flex, StateView, Typography } from "@repo/ui";
import { formatDateTime } from "@repo/utils";
import type { IncidentTimelineItem } from "@repo/opslens";

const kindLabel: Record<string, string> = {
  incident: "감지",
  deployment: "배포",
  log: "로그",
  comment: "메모",
  activity: "변경"
};

export function IncidentTimeline({ items }: { items: IncidentTimelineItem[] }) {
  if (items.length === 0) return <StateView variant="empty" size="sm" title="기록된 인시던트 타임라인이 없습니다." />;

  return (
    <Box className="mt-[var(--space-3)] max-h-[440px] space-y-[var(--space-3)] overflow-auto pr-1">
      {items.map((item) => (
        <Flex key={item.id} className="items-start gap-[var(--space-3)] border-l-2 border-default pl-[var(--space-3)]">
          <Box className="min-w-0 flex-1">
            <Flex className="flex-wrap items-center gap-[var(--space-2)]">
              <Badge size="sm" variant={item.tone === "critical" ? "danger" : item.tone === "warning" || item.tone === "high" ? "warning" : "outline"}>
                {kindLabel[item.kind] ?? item.kind}
              </Badge>
              <Typography as="p" variant="bodySm" className="font-semibold">{item.title}</Typography>
            </Flex>
            <Typography as="p" variant="caption" color="muted" className="mt-[var(--space-1)] whitespace-pre-wrap break-words">
              {item.detail}
            </Typography>
            <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
              {formatDateTime(item.occurredAt)}{item.actor ? ` · ${item.actor}` : ""}
            </Typography>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
