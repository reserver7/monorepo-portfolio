"use client";

import { useMemo, useState } from "react";
import { useAppForm } from "@repo/forms";
import {
  Badge,
  Button,
  Card,
  Textarea,
  confirm,
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
  const createForm = useAppForm<{ draftComment: string }>({
    defaultValues: { draftComment: "" }
  });
  const draftComment = createForm.watch("draftComment");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const editForm = useAppForm<{ editingDraft: string }>({
    defaultValues: { editingDraft: "" }
  });
  const editingDraft = editForm.watch("editingDraft");

  const mentionCandidates = useMemo(() => {
    return participants.map((participant) => participant.displayName).slice(0, 8);
  }, [participants]);

  const visibleComments = comments.slice(0, 40);
  const panelItemClass = "rounded-xl border border-default bg-surface px-4 py-3";
  const composerItemClass = "rounded-xl border border-default bg-surface-elevated px-4 py-3";

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Typography as="h3" variant="body" className="font-semibold">
          댓글 / 멘션
        </Typography>
        <Badge variant="outline" size="sm">
          {comments.length}개
        </Badge>
      </div>

      <div className={`mb-4 ${composerItemClass}`}>
        <Textarea
          control={createForm.control}
          name="draftComment"
          className="min-h-24 border-default bg-surface text-body-sm leading-6 text-foreground"
          placeholder="댓글을 입력하세요. 예) @Luke 확인 부탁드립니다"
        />

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Typography variant="caption" tone="subtle" className="mr-1">
            멘션:
          </Typography>
          {mentionCandidates.length > 0 ? (
            mentionCandidates.map((name) => (
              <Badge key={name} variant="outline" size="sm">
                @{name}
              </Badge>
            ))
          ) : (
            <Typography variant="caption" tone="subtle">
              없음
            </Typography>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              const normalized = draftComment.trim();
              if (!normalized) {
                return;
              }

              onSubmitComment(normalized, extractMentions(normalized));
              createForm.setValue("draftComment", "");
            }}
          >
            댓글 등록
          </Button>
        </div>
      </div>

      <div className="max-h-[32rem] space-y-3 overflow-auto pr-1">
        {comments.length === 0 ? (
          <Typography variant="bodySm" tone="subtle">
            아직 등록된 댓글이 없습니다.
          </Typography>
        ) : (
          visibleComments.map((comment) => {
            const isMine = comment.authorSessionId === mySessionId;
            const isEditing = editingCommentId === comment.id;

            return (
              <div key={comment.id} className={panelItemClass}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Typography as="p" variant="bodySm" className="font-semibold text-foreground">
                    {comment.authorName}
                    {isMine ? " (나)" : ""}
                  </Typography>
                  <Typography as="p" variant="caption" tone="subtle">
                    {formatExactTime(comment.updatedAt)}
                  </Typography>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      control={editForm.control}
                      name="editingDraft"
                      className="min-h-20 border-default bg-surface text-body-sm leading-6"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCommentId(null);
                          editForm.setValue("editingDraft", "");
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
                          editForm.setValue("editingDraft", "");
                        }}
                      >
                        저장
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Typography as="p" variant="bodySm" tone="muted" className="leading-6">
                      {comment.body}
                    </Typography>

                    {comment.mentions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {comment.mentions.map((mention) => (
                          <Badge key={`${comment.id}-${mention}`} variant="outline" size="sm" className="border-primary/30">
                            @{mention}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {isMine ? (
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            editForm.setValue("editingDraft", comment.body);
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            const shouldDelete = await confirm({
                              title: "댓글을 삭제할까요?",
                              description: "삭제된 댓글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?",
                              confirmText: "삭제",
                              confirmVariant: "danger",
                              cancelText: "취소"
                            });

                            if (!shouldDelete) {
                              return;
                            }

                            onDeleteComment(comment.id);
                          }}
                        >
                          삭제
                        </Button>
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
