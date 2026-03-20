import { Participant } from "@/lib/types";
import { Card } from "@repo/ui";

interface PresencePanelProps {
  participants: Participant[];
  mySessionId: string;
}

export const PresencePanel = ({ participants, mySessionId }: PresencePanelProps) => {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold text-slate-800">참여자</h3>
        <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs text-cyan-700">
          {participants.length}명
        </span>
      </div>

      <div className="space-y-2">
        {participants.length === 0 ? (
          <p className="text-xs text-slate-500">아직 접속한 참여자가 없습니다.</p>
        ) : (
          participants.map((participant) => {
            const isMe = participant.sessionId === mySessionId;

            return (
              <div
                key={`${participant.socketId}-${participant.sessionId}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: participant.color }}
                    aria-hidden
                  />
                  <span className="text-xs text-slate-700">
                    {participant.displayName}
                    {isMe ? " (나)" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      participant.role === "editor"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {participant.role}
                  </span>
                  <span className="text-[11px] text-slate-500">cursor {participant.cursorIndex}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
