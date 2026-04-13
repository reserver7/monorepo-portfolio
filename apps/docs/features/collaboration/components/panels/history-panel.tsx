import { HistoryEntry } from "@/features/collaboration/model";
import { formatExactTime } from "@/features/collaboration/model";
import { Badge, Card, Typography } from "@repo/ui";

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
  const panelItemClass = "rounded-lg border border-default/70 bg-surface-elevated/65 px-3.5 py-3";

  return (
    <Card className="border border-default/80 bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Typography as="h3" variant="title" className="text-body-md font-semibold">
          변경 이력
        </Typography>
        <Badge variant="outline" size="sm">
          {entries.length}건
        </Badge>
      </div>

      <div className="max-h-[20rem] space-y-3 overflow-y-auto overscroll-contain">
        {entries.length === 0 ? (
          <Typography variant="bodySm" color="subtle">
            아직 기록된 히스토리가 없습니다.
          </Typography>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className={panelItemClass}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge variant="info" size="sm">
                  {actionLabel[entry.action]}
                </Badge>
                <Typography as="span" variant="caption" color="subtle">
                  {formatExactTime(entry.at)}
                </Typography>
              </div>
              <Typography variant="bodySm" color="muted" className="leading-6">
                {entry.summary}
              </Typography>
              <Typography variant="bodySm" color="subtle" className="mt-1">
                by {entry.actor}
              </Typography>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
