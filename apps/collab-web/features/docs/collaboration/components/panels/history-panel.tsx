import { useState } from "react";
import { HistoryEntry } from "@/features/docs/collaboration/model";
import { formatExactTime } from "@/features/docs/collaboration/model";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, Typography, confirm, Flex, Grid } from "@repo/ui";
import { normalizeGuestDisplayName } from "@/lib/i18n/display-name";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  currentTitle: string;
  currentContent: string;
  canRestore?: boolean;
  restoringId?: string;
  onRestore?: (entry: HistoryEntry) => void;
}

export const HistoryPanel = ({
  entries,
  currentTitle,
  currentContent,
  canRestore = false,
  restoringId,
  onRestore
}: HistoryPanelProps) => {
  const t = useTranslations("collab.docsPanels.history");
  const locale = useLocale();
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);
  const actionLabel: Record<HistoryEntry["action"], string> = {
    create: t("action.create"),
    update: t("action.update"),
    save: t("action.save"),
    comment: t("action.comment")
  };
  const panelItemClass = "rounded-lg border border-default/70 bg-surface-elevated/65 px-3.5 py-3";
  const currentLines = currentContent.split("\n");
  const previewLines = previewEntry?.content?.split("\n") ?? [];
  const diffRows = previewEntry
    ? Array.from(
        {
          length: Math.max(currentLines.length, previewLines.length)
        },
        (_, index) => {
          const currentLine = currentLines[index] ?? "";
          const previewLine = previewLines[index] ?? "";
          return { currentLine, previewLine, changed: currentLine !== previewLine };
        }
      )
    : [];
  const changedLineCount = diffRows.filter((row) => row.changed).length;

  return (
    <Card className="border-default/80 bg-surface border p-5">
      <Flex className="mb-4 flex items-center justify-between gap-3">
        <Typography as="h3" variant="title" className="text-body-md font-semibold">
          {t("title")}
        </Typography>
        <Badge variant="outline" size="sm">
          {entries.length}
          {t("countSuffix")}
        </Badge>
      </Flex>

      {previewEntry ? (
        <div className="border-default/80 bg-surface mb-4 rounded-lg border p-3">
          <Flex className="mb-3 flex items-center justify-between gap-2">
            <Typography variant="bodySm" className="font-semibold">
              {t("preview")}
            </Typography>
            <Button type="button" variant="text" size="sm" onClick={() => setPreviewEntry(null)}>
              {t("closePreview")}
            </Button>
          </Flex>
          <Grid className="mb-3 grid gap-2 text-xs md:grid-cols-2">
            <Typography variant="caption" color="muted">
              {t("currentVersion")}: {currentTitle || "-"}
            </Typography>
            <Typography variant="caption" color="muted">
              {t("selectedVersion")}: {previewEntry.title || "-"}
            </Typography>
          </Grid>
          <div className="border-default/70 max-h-72 overflow-auto rounded-md border font-mono text-xs leading-5">
            <Grid className="bg-surface-elevated border-default/70 grid grid-cols-2 border-b px-2 py-1 font-sans font-semibold">
              <span>{t("currentVersion")}</span>
              <span>{t("selectedVersion")}</span>
            </Grid>
            {diffRows.map((row, index) => (
              <Grid key={index} className="grid grid-cols-2">
                <div className={row.changed ? "bg-danger/10 px-2" : "px-2"}>{row.currentLine || " "}</div>
                <div className={row.changed ? "bg-success/10 px-2" : "px-2"}>{row.previewLine || " "}</div>
              </Grid>
            ))}
          </div>
          <Typography variant="caption" color="subtle" className="mt-2 block">
            {t("changedLines", { count: changedLineCount })}
          </Typography>
          {canRestore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              loading={restoringId === previewEntry.id}
              disabled={Boolean(restoringId)}
              onClick={async () => {
                if (await confirm(t("restoreConfirm"))) {
                  onRestore?.(previewEntry);
                  setPreviewEntry(null);
                }
              }}
            >
              {t("restore")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[20rem] space-y-3 overflow-y-auto overscroll-contain">
        {entries.length === 0 ? (
          <Typography variant="bodySm" color="subtle">
            {t("empty")}
          </Typography>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className={panelItemClass}>
              <Flex className="mb-2 flex items-center justify-between gap-2">
                <Badge variant="info" size="sm">
                  {actionLabel[entry.action]}
                </Badge>
                <Typography as="span" variant="caption" color="subtle">
                  {formatExactTime(entry.at, locale)}
                </Typography>
              </Flex>
              <Typography variant="bodySm" color="muted" className="leading-6">
                {entry.summary}
              </Typography>
              <Typography variant="bodySm" color="subtle" className="mt-1">
                {t("by")} {normalizeGuestDisplayName(entry.actor, locale)}
              </Typography>
              {entry.content !== undefined ? (
                <Button
                  type="button"
                  variant="text"
                  size="sm"
                  className="mt-2 px-0 text-xs"
                  onClick={() => setPreviewEntry(entry)}
                >
                  {t("preview")}
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
