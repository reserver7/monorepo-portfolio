import { Badge, Box, Flex, Typography } from "@repo/ui";
import { FeedbackState } from "@/features/common/components/feedback-state";
import { formatDateTime } from "@repo/utils";
import type { IncidentTimelineItem } from "@repo/opslens";

export function IncidentTimeline({ items }: { items: IncidentTimelineItem[] }) {
  if (items.length === 0) return <FeedbackState variant="empty" size="sm" title="기록된 인시던트 타임라인이 없습니다." />;

  return (
    <Box className="mt-[var(--space-3)] max-h-[440px] space-y-[var(--space-3)] overflow-auto pr-1">
      {items.map((item) => (
        <Flex
          key={item.id}
          className="border-default items-start gap-[var(--space-3)] border-l-2 pl-[var(--space-3)]"
        >
          <Box className="min-w-0 flex-1">
            <Flex className="flex-wrap items-center gap-[var(--space-2)]">
              <Badge
                size="sm"
                variant={
                  item.tone === "critical"
                    ? "danger"
                    : item.tone === "warning" || item.tone === "high"
                      ? "warning"
                      : "outline"
                }
              >
                {getKindLabel(item.kind)}
              </Badge>
              <Typography as="p" variant="bodySm" className="font-semibold">
                {item.title}
              </Typography>
            </Flex>
            <Typography
              as="p"
              variant="caption"
              color="muted"
              className="mt-[var(--space-1)] whitespace-pre-wrap break-words"
            >
              {item.detail}
            </Typography>
            <Typography as="p" variant="caption" color="subtle" className="mt-[var(--space-1)]">
              {formatDateTime(item.occurredAt, locale)}
              {item.actor ? ` · ${item.actor}` : ""}
            </Typography>
          </Box>
        </Flex>
      ))}
    </Box>
  );
}
