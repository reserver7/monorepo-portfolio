import { Card, Typography } from "@repo/ui";

interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  return (
    <Card className="p-4">
      <Typography as="h3" variant="bodySm" className="mb-3 font-semibold">
        실시간 이벤트 로그
      </Typography>
      <div className="max-h-56 space-y-1 overflow-auto pr-1">
        {logs.length === 0 ? (
          <Typography variant="caption" tone="subtle">
            이벤트가 발생하면 여기에 표시됩니다.
          </Typography>
        ) : (
          logs.map((log, index) => (
            <Typography key={`${index}-${log}`} variant="caption" tone="muted" className="text-[11px]">
              {log}
            </Typography>
          ))
        )}
      </div>
    </Card>
  );
};
