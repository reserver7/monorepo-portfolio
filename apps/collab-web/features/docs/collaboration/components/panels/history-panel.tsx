import { HistoryEntry } from "@/features/docs/collaboration/model";
import { formatExactTime } from "@/features/docs/collaboration/model";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Card, Typography } from "@repo/ui";
import { normalizeGuestDisplayName } from "@/lib/i18n/display-name";

interface HistoryPanelProps {
  entries: HistoryEntry[];
}

export const HistoryPanel = ({ entries }: HistoryPanelProps) => {
  const t = useTranslations("collab.docsPanels.history");
  const locale = useLocale();
  const actionLabel: Record<HistoryEntry["action"], string> = {
    create: t("action.create"),
    update: t("action.update"),
    save: t("action.save"),
    comment: t("action.comment")
  };
  const panelItemClass = "rounded-lg border border-default/70 bg-surface-elevated/65 px-3.5 py-3";

  return (
    <Card className="border border-default/80 bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Typography as="h3" variant="title" className="text-body-md font-semibold">
          {t("title")}
        </Typography>
        <Badge variant="outline" size="sm">
          {entries.length}
          {t("countSuffix")}
        </Badge>
      </div>

      <div className="max-h-[20rem] space-y-3 overflow-y-auto overscroll-contain">
        {entries.length === 0 ? (
          <Typography variant="bodySm" color="subtle">
            {t("empty")}
          </Typography>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className={panelItemClass}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge variant="info" size="sm">
                  {actionLabel[entry.action]}
                </Badge>
                <Typography as="span" variant="caption" color="subtle">
                  {formatExactTime(entry.at, locale)}
                </Typography>
              </div>
              <Typography variant="bodySm" color="muted" className="leading-6">
                {entry.summary}
              </Typography>
              <Typography variant="bodySm" color="subtle" className="mt-1">
                {t("by")} {normalizeGuestDisplayName(entry.actor, locale)}
              </Typography>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
