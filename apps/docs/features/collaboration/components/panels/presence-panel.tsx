import { Participant } from "@/lib/collab";
import { Badge, Card, Typography } from "@repo/ui";

interface PresencePanelProps {
  participants: Participant[];
  mySessionId: string;
}

export const PresencePanel = ({ participants, mySessionId }: PresencePanelProps) => {
  const panelItemClass = "rounded-xl border border-default bg-surface px-4 py-3";

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <Typography as="h3" variant="body" className="font-semibold">
          참여자
        </Typography>
        <Badge variant="info" size="sm">
          {participants.length}명
        </Badge>
      </div>

      <div className="space-y-3">
        {participants.length === 0 ? (
          <Typography variant="bodySm" tone="subtle">
            아직 접속한 참여자가 없습니다.
          </Typography>
        ) : (
          participants.map((participant) => {
            const isMe = participant.sessionId === mySessionId;

            return (
              <div key={`${participant.socketId}-${participant.sessionId}`} className={panelItemClass}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: participant.color }}
                      aria-hidden
                    />
                    <Typography as="span" variant="bodySm" className="truncate font-medium">
                      {participant.displayName}
                      {isMe ? " (나)" : ""}
                    </Typography>
                  </div>
                  <Badge
                    variant={participant.role === "editor" ? "success" : "outline"}
                    size="sm"
                    className="shrink-0 text-[11px]"
                  >
                    {participant.role}
                  </Badge>
                </div>

                <div className="mt-1.5 flex items-center justify-end">
                  <Typography as="span" variant="caption" tone="subtle" className="tabular-nums">
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
