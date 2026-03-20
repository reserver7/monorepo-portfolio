import { HistoryEntry } from "@/lib/types";
import { formatExactTime } from "@/lib/time";
import { Card } from "@repo/ui";

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
      <h3 className="font-heading mb-3 text-sm font-semibold text-slate-800">변경 이력</h3>

      <div className="max-h-64 space-y-2 overflow-auto pr-1">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-500">아직 기록된 히스토리가 없습니다.</p>
        ) : (
          entries.slice(0, 20).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-cyan-700">{actionLabel[entry.action]}</span>
                <span className="text-[11px] text-slate-500">{formatExactTime(entry.at)}</span>
              </div>
              <p className="text-xs text-slate-700">{entry.summary}</p>
              <p className="mt-1 text-[11px] text-slate-400">by {entry.actor}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
