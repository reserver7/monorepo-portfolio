import { useTranslations } from "next-intl";
import { Card, Typography } from "@repo/ui";

interface ActivityLogPanelProps {
  logs: string[];
}

export const ActivityLogPanel = ({ logs }: ActivityLogPanelProps) => {
  const t = useTranslations("collab.docsPanels.activity");
  const visibleLogs = logs.slice(0, 80);
  const panelItemClass = "rounded-lg border border-default/70 bg-surface-elevated/65 px-3.5 py-3";

  return (
    <Card className="border border-default/80 bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Typography as="h3" variant="title" className="text-body-md font-semibold">
          {t("title")}
        </Typography>
        <Typography as="span" variant="caption" color="subtle">
          {t("recent")} {logs.length}
          {t("countSuffix")}
        </Typography>
      </div>
      <div className="max-h-72 space-y-3 overflow-auto">
        {logs.length === 0 ? (
          <Typography variant="bodySm" color="subtle">
            {t("empty")}
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
