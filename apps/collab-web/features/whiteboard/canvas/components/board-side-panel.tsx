import type { Participant } from "@repo/utils/collab";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Card, Typography } from "@repo/ui";
import type { WhiteboardShape } from "@/features/whiteboard/collaboration/model";
import type { WhiteboardTool } from "./shape-utils";
import { normalizeGuestDisplayName } from "@/lib/i18n/display-name";

interface BoardSidePanelProps {
  participants: Participant[];
  sessionId: string;
  activeTool: WhiteboardTool;
  selectedShape: WhiteboardShape | null;
  connectorFromShapeId: string | null;
  historyEntries: Array<{
    id: string;
    shapeType: WhiteboardShape["type"];
    updatedAt: string;
    actor: string;
  }>;
  eventLog: string[];
}

export const BoardSidePanel = ({
  participants,
  sessionId,
  activeTool,
  selectedShape,
  connectorFromShapeId,
  historyEntries,
  eventLog
}: BoardSidePanelProps) => {
  const t = useTranslations("collab.whiteboardPanel");
  const locale = useLocale();
  const visibleEventLog = eventLog.slice(0, 100);
  const panelItemClass = "rounded-lg border border-default/70 bg-surface-elevated/65 px-3.5 py-3";
  const toolNameByValue: Record<WhiteboardTool, string> = {
    select: t("tool.select"),
    rect: t("tool.rect"),
    ellipse: t("tool.ellipse"),
    diamond: t("tool.diamond"),
    text: t("tool.text"),
    connector: t("tool.connector")
  };

  return (
    <div className="space-y-4">
      <Card className="border border-default/80 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Typography as="h3" variant="title" className="text-body-md font-semibold">
            {t("participants.title")}
          </Typography>
          <Badge variant="info" size="sm">
            {t("participants.count", { count: participants.length })}
          </Badge>
        </div>
        <div className="space-y-3">
          {participants.length === 0 ? (
            <Typography variant="bodySm" color="subtle">
              {t("participants.empty")}
            </Typography>
          ) : (
            participants.map((participant) => {
              const isMe = participant.sessionId === sessionId;
              const cursorX = Math.round(participant.cursorX ?? 0);
              const cursorY = Math.round(participant.cursorY ?? 0);

              return (
                <div key={`${participant.socketId}-${participant.sessionId}`} className={panelItemClass}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: participant.color }}
                      />
                      <Typography as="span" variant="bodySm" className="truncate font-medium">
                        {normalizeGuestDisplayName(participant.displayName, locale)}
                        {isMe ? t("participants.meSuffix") : ""}
                      </Typography>
                    </div>
                    <Badge
                      variant={participant.role === "editor" ? "success" : "outline"}
                      size="sm"
                      className="shrink-0 text-caption"
                    >
                      {participant.role}
                    </Badge>
                  </div>

                  <div className="mt-1.5 flex items-center justify-end">
                    <Typography as="span" variant="caption" color="subtle" className="tabular-nums">
                      {t("participants.cursor", { x: cursorX, y: cursorY })}
                    </Typography>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="border border-default/80 bg-surface p-5">
        <Typography as="h3" variant="title" className="mb-3 text-body-md font-semibold">
          {t("selection.title")}
        </Typography>
        <div className="space-y-3">
          <div className={panelItemClass}>
            <Typography variant="caption" color="subtle">
              {t("selection.toolLabel")}
            </Typography>
            <Typography variant="bodySm" className="mt-0.5 font-medium">
              {toolNameByValue[activeTool]}
            </Typography>
          </div>
          <div className={panelItemClass}>
            <Typography variant="caption" color="subtle">
              {t("selection.elementLabel")}
            </Typography>
            <Typography variant="bodySm" className="mt-0.5 font-medium">
              {selectedShape ? `${selectedShape.type} (${selectedShape.id.slice(0, 6)})` : t("common.none")}
            </Typography>
          </div>
          <div className={panelItemClass}>
            <Typography variant="caption" color="subtle">
              {t("selection.connectorStartLabel")}
            </Typography>
            <Typography variant="bodySm" className="mt-0.5 font-medium">
              {connectorFromShapeId ? connectorFromShapeId.slice(0, 6) : t("common.none")}
            </Typography>
          </div>
        </div>
      </Card>

      <Card className="border border-default/80 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Typography as="h3" variant="title" className="text-body-md font-semibold">
            {t("history.title")}
          </Typography>
          <Typography as="span" variant="caption" color="subtle">
            {t("history.recentCount", { count: historyEntries.length })}
          </Typography>
        </div>
        <div className="max-h-[20rem] space-y-3 overflow-y-auto overscroll-contain">
          {historyEntries.length === 0 ? (
            <Typography variant="bodySm" color="subtle">
              {t("history.empty")}
            </Typography>
          ) : (
            historyEntries.map((entry) => (
              <div key={entry.id} className={panelItemClass}>
                <div className="flex items-center justify-between gap-2">
                  <Typography as="span" variant="bodySm" className="font-medium">
                    {entry.shapeType}
                  </Typography>
                  <Typography as="span" variant="caption" color="subtle">
                    {new Date(entry.updatedAt).toLocaleString(locale)}
                  </Typography>
                </div>
                <Typography variant="caption" color="subtle" className="mt-1">
                  {t("history.by")} {normalizeGuestDisplayName(entry.actor, locale)}
                </Typography>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="border border-default/80 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Typography as="h3" variant="title" className="text-body-md font-semibold">
            {t("events.title")}
          </Typography>
          <Typography as="span" variant="caption" color="subtle">
            {t("events.recentCount", { count: eventLog.length })}
          </Typography>
        </div>
        <div className="max-h-80 space-y-3 overflow-auto">
          {eventLog.length === 0 ? (
            <Typography variant="bodySm" color="subtle">
              {t("events.empty")}
            </Typography>
          ) : (
            visibleEventLog.map((log, index) => (
              <div key={`${index}-${log}`} className={panelItemClass}>
                <Typography variant="bodySm" color="muted" className="font-mono leading-6">
                  {log}
                </Typography>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
