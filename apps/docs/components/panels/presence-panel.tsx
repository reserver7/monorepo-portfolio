import { Participant } from "@/lib/collab";
import { Card, Typography } from "@repo/ui";

interface PresencePanelProps {
  participants: Participant[];
  mySessionId: string;
}

export const PresencePanel = ({ participants, mySessionId }: PresencePanelProps) => {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <Typography as="h3" variant="bodySm" className="font-semibold">
          참여자
        </Typography>
        <Typography as="span" variant="caption" tone="default" className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
          {participants.length}명
        </Typography>
      </div>

      <div className="space-y-2">
        {participants.length === 0 ? (
          <Typography variant="caption" tone="subtle">
            아직 접속한 참여자가 없습니다.
          </Typography>
        ) : (
          participants.map((participant) => {
            const isMe = participant.sessionId === mySessionId;

            return (
              <div
                key={`${participant.socketId}-${participant.sessionId}`}
                className="flex items-center justify-between rounded-lg border border-default bg-surface px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: participant.color }}
                    aria-hidden
                  />
                  <Typography as="span" variant="caption" tone="muted" className="text-xs">
                    {participant.displayName}
                    {isMe ? " (나)" : ""}
                  </Typography>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      participant.role === "editor"
                        ? "bg-success/10 text-success"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    {participant.role}
                  </span>
                  <Typography as="span" variant="caption" tone="subtle" className="text-[11px]">
                    cursor {participant.cursorIndex}
                  </Typography>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
