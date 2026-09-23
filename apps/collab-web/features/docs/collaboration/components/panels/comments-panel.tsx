"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppForm } from "@repo/forms";
import { useLocale, useTranslations } from "next-intl";
import { Badge, Button, Card, Textarea, confirm, Typography, Flex } from "@repo/ui";
import { formatExactTime } from "@/features/docs/collaboration/model";
import { DocumentComment, Participant } from "@/features/docs/collaboration/model";
import { normalizeGuestDisplayName } from "@/lib/i18n/display-name";

interface CommentsPanelProps {
  comments: DocumentComment[];
  participants: Participant[];
  mentionCandidates?: string[];
  mySessionId: string;
  highlightedCommentId?: string;
  onSubmitComment: (body: string, mentions: string[], parentCommentId?: string) => void;
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
  mentionCandidates: accountMentionCandidates,
  mySessionId,
  highlightedCommentId,
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
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [dismissedMentionQuery, setDismissedMentionQuery] = useState<string | null>(null);
  const editForm = useAppForm<{ editingDraft: string }>({
    defaultValues: { editingDraft: "" }
  });
  const editingDraft = editForm.watch("editingDraft");
  const replyForm = useAppForm<{ replyDraft: string }>({
    defaultValues: { replyDraft: "" }
  });
  const replyDraft = replyForm.watch("replyDraft");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

  const mentionCandidates = useMemo(() => {
    if (accountMentionCandidates && accountMentionCandidates.length > 0) {
      return accountMentionCandidates;
    }
    return participants
      .map((participant) => normalizeGuestDisplayName(participant.displayName, locale))
      .slice(0, 8);
  }, [accountMentionCandidates, locale, participants]);

  const mentionQuery = useMemo(() => {
    const match = draftComment.match(/@([0-9A-Za-z가-힣._-]*)$/);
    return match?.[1]?.toLowerCase() ?? null;
  }, [draftComment]);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null || dismissedMentionQuery === mentionQuery) return [];
    const query = mentionQuery;
    return mentionCandidates.filter((candidate) => candidate.toLowerCase().startsWith(query)).slice(0, 5);
  }, [dismissedMentionQuery, mentionCandidates, mentionQuery]);

  useEffect(() => {
    setActiveMentionIndex(0);
    setDismissedMentionQuery(null);
  }, [mentionQuery]);

  const insertMention = (candidate: string) => {
    const match = draftComment.match(/@([0-9A-Za-z가-힣._-]*)$/);
    if (!match) return;
    const prefix = draftComment.slice(0, draftComment.length - match[0].length);
    createForm.setValue("draftComment", `${prefix}@${candidate} `);
    setDismissedMentionQuery(null);
  };

  const submitReply = () => {
    const normalized = replyDraft.trim();
    if (!normalized || !replyingToCommentId) return;
    onSubmitComment(normalized, extractMentions(normalized), replyingToCommentId);
    replyForm.setValue("replyDraft", "");
    setReplyingToCommentId(null);
  };

  const handleMentionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionSuggestions.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveMentionIndex((current) => (current + 1) % mentionSuggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveMentionIndex(
        (current) => (current - 1 + mentionSuggestions.length) % mentionSuggestions.length
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      insertMention(mentionSuggestions[activeMentionIndex] ?? mentionSuggestions[0]!);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setDismissedMentionQuery(mentionQuery);
    }
  };

  const visibleComments = comments.slice(0, 40);
  const panelItemClass = "rounded-lg border border-default/70 bg-surface-elevated/65 px-3.5 py-3";
  const composerItemClass = "rounded-lg border border-default/80 bg-surface-elevated px-3.5 py-3";

  useEffect(() => {
    if (!highlightedCommentId) return;
    document.getElementById(`comment-${highlightedCommentId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, [comments, highlightedCommentId]);

  return (
    <Card className="border-default/80 bg-surface border p-5">
      <Flex className="mb-4 flex items-center justify-between gap-3">
        <Typography as="h3" variant="title" className="text-body-md font-semibold">
          {t("title")}
        </Typography>
        <Badge variant="outline" size="sm">
          {comments.length}
          {t("countSuffix")}
        </Badge>
      </Flex>

      <div className={`mb-4 ${composerItemClass}`}>
        <Textarea
          control={createForm.control}
          name="draftComment"
          onKeyDown={handleMentionKeyDown}
          className="border-default bg-surface text-body-sm text-foreground min-h-24 leading-6"
          placeholder={t("inputPlaceholder")}
        />

        {mentionSuggestions.length > 0 ? (
          <div className="border-default bg-surface mt-2 rounded-lg border p-1" role="listbox">
            {mentionSuggestions.map((candidate, index) => (
              <Button
                variant="text"
                fullWidth
                key={candidate}
                role="option"
                aria-selected={index === activeMentionIndex}
                className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${index === activeMentionIndex ? "bg-surface-elevated" : "hover:bg-surface-elevated"}`}
                onClick={() => insertMention(candidate)}
              >
                @{candidate}
              </Button>
            ))}
          </div>
        ) : null}

        <Flex className="mt-3 flex flex-wrap items-center gap-1.5">
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
        </Flex>
        <Flex className="mt-3 flex justify-end">
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
        </Flex>
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
              <div
                id={`comment-${comment.id}`}
                key={comment.id}
                className={`${panelItemClass} ${comment.parentCommentId ? "ml-4 border-l-2" : ""} ${comment.id === highlightedCommentId ? "ring-primary ring-2" : ""}`}
              >
                <Flex className="mb-2 flex items-start justify-between gap-2">
                  <Typography as="p" variant="bodySm" className="text-foreground font-semibold">
                    {normalizeGuestDisplayName(comment.authorName, locale)}
                    {isMine ? t("meSuffix") : ""}
                  </Typography>
                  <Typography as="p" variant="caption" color="subtle">
                    {formatExactTime(comment.updatedAt, locale)}
                  </Typography>
                </Flex>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      control={editForm.control}
                      name="editingDraft"
                      className="border-default bg-surface text-body-sm min-h-20 leading-6"
                    />
                    <Flex className="flex items-center justify-end gap-2">
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
                    </Flex>
                  </div>
                ) : (
                  <>
                    <Typography as="p" variant="bodySm" color="muted" className="leading-6">
                      {comment.body}
                    </Typography>

                    {comment.mentions.length > 0 ? (
                      <Flex className="mt-2 flex flex-wrap items-center gap-1.5">
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
                      </Flex>
                    ) : null}

                    {isMine ? (
                      <Flex className="mt-2 flex items-center justify-end gap-2">
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
                      </Flex>
                    ) : null}

                    {!comment.parentCommentId ? (
                      <Flex className="mt-2 flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingToCommentId(comment.id);
                            replyForm.setValue("replyDraft", "");
                          }}
                        >
                          답글
                        </Button>
                      </Flex>
                    ) : null}

                    {replyingToCommentId === comment.id ? (
                      <div className="border-default mt-3 space-y-2 border-l-2 pl-3">
                        <Textarea
                          control={replyForm.control}
                          name="replyDraft"
                          className="border-default bg-surface text-body-sm min-h-16 leading-6"
                          placeholder="답글을 입력하세요"
                        />
                        <Flex className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setReplyingToCommentId(null)}>
                            취소
                          </Button>
                          <Button size="sm" onClick={submitReply}>
                            답글 등록
                          </Button>
                        </Flex>
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
