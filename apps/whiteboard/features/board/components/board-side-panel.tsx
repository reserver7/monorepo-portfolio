import type { Participant } from "@repo/utils/collab";
import { Badge, Card, Typography } from "@repo/ui";
import type { WhiteboardShape } from "@/features/collaboration/model";
import type { WhiteboardTool } from "./shape-utils";

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

const toolNameByValue: Record<WhiteboardTool, string> = {
  select: "선택/이동",
  rect: "사각형",
  ellipse: "타원",
  diamond: "마름모",
  text: "텍스트",
  connector: "연결선"
};

export const BoardSidePanel = ({
  participants,
  sessionId,
  activeTool,
  selectedShape,
  connectorFromShapeId,
  historyEntries,
  eventLog
}: BoardSidePanelProps) => {
  const visibleEventLog = eventLog.slice(0, 100);
  const panelItemClass = "rounded-lg border border-default/70 bg-surface-elevated/65 px-3.5 py-3";

  return (
    <div className="space-y-4">
      <Card className="border border-default/80 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Typography as="h3" variant="title" className="text-body-md font-semibold">
            참여자
          </Typography>
          <Badge variant="info" size="sm">
            {participants.length}명
          </Badge>
        </div>
        <div className="space-y-3">
          {participants.length === 0 ? (
            <Typography variant="bodySm" color="subtle">
              아직 접속한 참여자가 없습니다.
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
                        {participant.displayName}
                        {isMe ? " (나)" : ""}
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
                      커서: {cursorX}, {cursorY}
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
          선택 정보
        </Typography>
        <div className="space-y-3">
          <div className={panelItemClass}>
            <Typography variant="caption" color="subtle">
              선택 도구
            </Typography>
            <Typography variant="bodySm" className="mt-0.5 font-medium">
              {toolNameByValue[activeTool]}
            </Typography>
          </div>
          <div className={panelItemClass}>
            <Typography variant="caption" color="subtle">
              선택 요소
            </Typography>
            <Typography variant="bodySm" className="mt-0.5 font-medium">
              {selectedShape ? `${selectedShape.type} (${selectedShape.id.slice(0, 6)})` : "없음"}
            </Typography>
          </div>
          <div className={panelItemClass}>
            <Typography variant="caption" color="subtle">
              연결 시작점
            </Typography>
            <Typography variant="bodySm" className="mt-0.5 font-medium">
              {connectorFromShapeId ? connectorFromShapeId.slice(0, 6) : "없음"}
            </Typography>
          </div>
        </div>
      </Card>

      <Card className="border border-default/80 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Typography as="h3" variant="title" className="text-body-md font-semibold">
            변경 이력
          </Typography>
          <Typography as="span" variant="caption" color="subtle">
            최근 {historyEntries.length}건
          </Typography>
        </div>
        <div className="max-h-[20rem] space-y-3 overflow-y-auto overscroll-contain">
          {historyEntries.length === 0 ? (
            <Typography variant="bodySm" color="subtle">
              표시할 변경 이력이 없습니다.
            </Typography>
          ) : (
            historyEntries.map((entry) => (
              <div key={entry.id} className={panelItemClass}>
                <div className="flex items-center justify-between gap-2">
                  <Typography as="span" variant="bodySm" className="font-medium">
                    {entry.shapeType}
                  </Typography>
                  <Typography as="span" variant="caption" color="subtle">
                    {new Date(entry.updatedAt).toLocaleString("ko-KR")}
                  </Typography>
                </div>
                <Typography variant="caption" color="subtle" className="mt-1">
                  by {entry.actor}
                </Typography>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="border border-default/80 bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Typography as="h3" variant="title" className="text-body-md font-semibold">
            실시간 이벤트
          </Typography>
          <Typography as="span" variant="caption" color="subtle">
            최근 {eventLog.length}개
          </Typography>
        </div>
        <div className="max-h-80 space-y-3 overflow-auto">
          {eventLog.length === 0 ? (
            <Typography variant="bodySm" color="subtle">
              이벤트가 발생하면 여기에 표시됩니다.
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
