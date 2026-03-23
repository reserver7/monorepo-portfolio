import type { Participant } from "@repo/shared-types";
import { Card } from "@repo/ui";
import type { WhiteboardShape } from "@/lib/types";
import type { WhiteboardTool } from "./shape-utils";

interface BoardSidePanelProps {
  participants: Participant[];
  sessionId: string;
  activeTool: WhiteboardTool;
  selectedShape: WhiteboardShape | null;
  connectorFromShapeId: string | null;
  eventLog: string[];
}

export const BoardSidePanel = ({
  participants,
  sessionId,
  activeTool,
  selectedShape,
  connectorFromShapeId,
  eventLog
}: BoardSidePanelProps) => {
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">참여자</h3>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={`${participant.socketId}-${participant.sessionId}`}
              className="flex items-center justify-between rounded border border-slate-200 bg-white p-2"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: participant.color }} />
                <span>
                  {participant.displayName}
                  {participant.sessionId === sessionId ? " (나)" : ""}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    participant.role === "editor"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {participant.role}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {Math.round(participant.cursorX ?? 0)}, {Math.round(participant.cursorY ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">선택 정보</h3>
        <div className="space-y-1 text-xs text-slate-600">
          <p>선택 도구: {activeTool}</p>
          <p>선택 요소: {selectedShape ? `${selectedShape.type} (${selectedShape.id.slice(0, 6)})` : "없음"}</p>
          <p>연결 시작점: {connectorFromShapeId ? connectorFromShapeId.slice(0, 6) : "없음"}</p>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold">실시간 이벤트</h3>
        <div className="max-h-80 space-y-1 overflow-auto">
          {eventLog.map((log, index) => (
            <p key={`${index}-${log}`} className="text-[11px] text-slate-600">
              {log}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
};
