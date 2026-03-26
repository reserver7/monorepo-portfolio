"use client";

import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  Textarea,
  Typography
} from "@repo/ui";
import { formatExactTime } from "@/lib/collab";
import { DocumentComment, Participant } from "@/lib/collab";

interface CommentsPanelProps {
  comments: DocumentComment[];
  participants: Participant[];
  mySessionId: string;
  onSubmitComment: (body: string, mentions: string[]) => void;
  onUpdateComment: (commentId: string, body: string, mentions: string[]) => void;
  onDeleteComment: (commentId: string) => void;
}

const mentionPattern = /@([0-9A-Za-z가-힣._-]{2,24})/g;

const extractMentions = (rawBody: string): string[] => {
  return Array.from(rawBody.matchAll(mentionPattern))
    .map((match) => match[1]?.trim() ?? "")
    .filter((value) => value.length > 0)
    .slice(0, 20);
};

export const CommentsPanel = ({
  comments,
  participants,
  mySessionId,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment
}: CommentsPanelProps) => {
  const [draftComment, setDraftComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");

  const mentionCandidates = useMemo(() => {
    return participants.map((participant) => participant.displayName).slice(0, 8);
  }, [participants]);

  return (
    <Card className="p-4">
      <Typography as="h3" variant="bodySm" className="mb-3 font-semibold">
        댓글 / 멘션
      </Typography>

      <div className="mb-3 rounded-lg border border-default bg-surface-elevated p-2.5">
        <Textarea
          value={draftComment}
          onChange={(event) => setDraftComment(event.target.value)}
          className="min-h-20 border-0 bg-transparent text-xs text-foreground"
          placeholder="댓글을 입력하세요. 예) @Luke 확인 부탁드립니다"
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <Typography variant="caption" tone="subtle" className="text-[11px]">
            멘션:{" "}
            {mentionCandidates.length > 0 ? mentionCandidates.map((name) => `@${name}`).join(", ") : "없음"}
          </Typography>
          <Button
            size="sm"
            onClick={() => {
              const normalized = draftComment.trim();
              if (!normalized) {
                return;
              }

              onSubmitComment(normalized, extractMentions(normalized));
              setDraftComment("");
            }}
          >
            댓글 등록
          </Button>
        </div>
      </div>

      <div className="max-h-72 space-y-2 overflow-auto pr-1">
        {comments.length === 0 ? (
          <Typography variant="caption" tone="subtle">
            아직 등록된 댓글이 없습니다.
          </Typography>
        ) : (
          comments.slice(0, 40).map((comment) => {
            const isMine = comment.authorSessionId === mySessionId;
            const isEditing = editingCommentId === comment.id;

            return (
              <div key={comment.id} className="rounded-lg border border-default bg-surface p-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Typography as="p" variant="caption" className="font-medium text-foreground">
                    {comment.authorName}
                    {isMine ? " (나)" : ""}
                  </Typography>
                  <Typography as="p" variant="caption" tone="subtle" className="text-[11px]">
                    {formatExactTime(comment.updatedAt)}
                  </Typography>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingDraft}
                      onChange={(event) => setEditingDraft(event.target.value)}
                      className="min-h-16 text-xs"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingDraft("");
                        }}
                      >
                        취소
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const normalized = editingDraft.trim();
                          if (!normalized) {
                            return;
                          }

                          onUpdateComment(comment.id, normalized, extractMentions(normalized));
                          setEditingCommentId(null);
                          setEditingDraft("");
                        }}
                      >
                        저장
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Typography as="p" variant="caption" tone="muted" className="leading-5">
                      {comment.body}
                    </Typography>

                    {comment.mentions.length > 0 ? (
                      <Typography as="p" variant="caption" className="mt-1 text-[11px] text-primary">
                        멘션: {comment.mentions.map((mention) => `@${mention}`).join(", ")}
                      </Typography>
                    ) : null}

                    {isMine ? (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingDraft(comment.body);
                          }}
                        >
                          수정
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              삭제
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>댓글을 삭제할까요?</AlertDialogTitle>
                              <AlertDialogDescription>
                                삭제된 댓글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => {
                                  onDeleteComment(comment.id);
                                }}
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
