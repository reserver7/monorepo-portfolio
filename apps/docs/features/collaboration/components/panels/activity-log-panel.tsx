import { Card, Typography } from "@repo/ui";

interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  const visibleLogs = logs.slice(0, 80);
  const panelItemClass = "rounded-xl border border-default bg-surface px-4 py-3";

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Typography as="h3" variant="body" className="font-semibold">
          실시간 이벤트 로그
        </Typography>
        <Typography as="span" variant="caption" color="subtle">
          최근 {logs.length}개
        </Typography>
      </div>
      <div className="max-h-72 space-y-3 overflow-auto pr-1">
        {logs.length === 0 ? (
          <Typography variant="bodySm" color="subtle">
            이벤트가 발생하면 여기에 표시됩니다.
          </Typography>
        ) : (
          visibleLogs.map((log, index) => (
            <div key={`${index}-${log}`} className={panelItemClass}>
              <Typography variant="bodySm" color="muted" className="font-mono leading-6">
                {log}
              </Typography>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
