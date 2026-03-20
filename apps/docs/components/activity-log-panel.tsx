import { Card } from "@repo/ui";

interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  return (
    <Card className="p-4">
      <h3 className="font-heading mb-3 text-sm font-semibold text-slate-800">실시간 이벤트 로그</h3>
      <div className="max-h-56 space-y-1 overflow-auto pr-1">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500">이벤트가 발생하면 여기에 표시됩니다.</p>
        ) : (
          logs.map((log) => (
            <p key={log} className="text-[11px] text-slate-600">
              {log}
            </p>
          ))
        )}
      </div>
    </Card>
  );
};
