"use client";

import { useMemo, useState } from "react";
import { useAppForm } from "@repo/forms";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, Textarea, confirm, Typography } from "@repo/ui";
import { formatExactTime } from "@/features/docs/collaboration/model";
import { DocumentComment, Participant } from "@/features/docs/collaboration/model";
import { normalizeGuestDisplayName } from "@/lib/i18n/display-name";

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
  const t = useTranslations("collab.docsPanels.comments");
  const locale = useLocale();
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
    return participants.map((participant) => normalizeGuestDisplayName(participant.displayName, locale)).slice(0, 8);
  }, [locale, participants]);

  const visibleComments = comments.slice(0, 40);
  const panelItemClass = "rounded-lg border border-default/70 bg-surface-elevated/65 px-3.5 py-3";
  const composerItemClass = "rounded-lg border border-default/80 bg-surface-elevated px-3.5 py-3";

  return (
    <Card className="border border-default/80 bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Typography as="h3" variant="title" className="text-body-md font-semibold">
          {t("title")}
        </Typography>
        <Badge variant="outline" size="sm">
          {comments.length}
          {t("countSuffix")}
        </Badge>
      </div>

      <div className={`mb-4 ${composerItemClass}`}>
        <Textarea
          control={createForm.control}
          name="draftComment"
          className="border-default bg-surface text-body-sm text-foreground min-h-24 leading-6"
          placeholder={t("inputPlaceholder")}
        />

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Typography variant="caption" color="subtle" className="mr-1">
            {t("mentionLabel")}
          </Typography>
          {mentionCandidates.length > 0 ? (
            mentionCandidates.map((name) => (
              <Badge key={name} variant="outline" size="sm">
                @{name}
              </Badge>
            ))
          ) : (
            <Typography variant="caption" color="subtle">
              {t("none")}
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
            {t("submit")}
          </Button>
        </div>
      </div>

      <div className="max-h-[32rem] space-y-3 overflow-auto">
        {comments.length === 0 ? (
          <Typography variant="bodySm" color="subtle">
            {t("empty")}
          </Typography>
        ) : (
          visibleComments.map((comment) => {
            const isMine = comment.authorSessionId === mySessionId;
            const isEditing = editingCommentId === comment.id;

            return (
              <div key={comment.id} className={panelItemClass}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Typography as="p" variant="bodySm" className="text-foreground font-semibold">
                    {normalizeGuestDisplayName(comment.authorName, locale)}
                    {isMine ? t("meSuffix") : ""}
                  </Typography>
                  <Typography as="p" variant="caption" color="subtle">
                    {formatExactTime(comment.updatedAt, locale)}
                  </Typography>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      control={editForm.control}
                      name="editingDraft"
                      className="border-default bg-surface text-body-sm min-h-20 leading-6"
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
                        {t("commonCancel")}
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
                        {t("commonSave")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Typography as="p" variant="bodySm" color="muted" className="leading-6">
                      {comment.body}
                    </Typography>

                    {comment.mentions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {comment.mentions.map((mention) => (
                          <Badge
                            key={`${comment.id}-${mention}`}
                            variant="outline"
                            size="sm"
                            className="border-primary/30"
                          >
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
                          {t("edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            const shouldDelete = await confirm({
                              title: t("deleteDialog.title"),
                              description: t("deleteDialog.description"),
                              confirmText: t("deleteDialog.confirm"),
                              confirmVariant: "danger",
                              cancelText: t("commonCancel")
                            });

                            if (!shouldDelete) {
                              return;
                            }

                            onDeleteComment(comment.id);
                          }}
                        >
                          {t("delete")}
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
