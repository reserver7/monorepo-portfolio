import { HistoryEntry } from "@/lib/collab";
import { formatExactTime } from "@/lib/collab";
import { Card, Typography } from "@repo/ui";

interface HistoryPanelProps {
  entries: HistoryEntry[];
}

const actionLabel: Record<HistoryEntry["action"], string> = {
  create: "생성",
  update: "수정",
  save: "저장",
  comment: "댓글"
};

export const HistoryPanel = ({ entries }: HistoryPanelProps) => {
  return (
    <Card className="p-4">
      <Typography as="h3" variant="bodySm" className="mb-3 font-semibold">
        변경 이력
      </Typography>

      <div className="max-h-64 space-y-2 overflow-auto pr-1">
        {entries.length === 0 ? (
          <Typography variant="caption" tone="subtle">
            아직 기록된 히스토리가 없습니다.
          </Typography>
        ) : (
          entries.slice(0, 20).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-default bg-surface p-2.5">
              <div className="mb-1 flex items-center justify-between">
                <Typography as="span" variant="caption" tone="default" className="text-[11px] text-primary">
                  {actionLabel[entry.action]}
                </Typography>
                <Typography as="span" variant="caption" tone="subtle" className="text-[11px]">
                  {formatExactTime(entry.at)}
                </Typography>
              </div>
              <Typography variant="caption" tone="muted" className="text-xs">
                {entry.summary}
              </Typography>
              <Typography variant="caption" tone="subtle" className="mt-1 text-[11px]">
                by {entry.actor}
              </Typography>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
