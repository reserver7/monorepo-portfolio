import type { useAppForm } from "@repo/forms";
import { Box, Button, Input, StateView, Textarea } from "@repo/ui";
import { formatDateTime } from "@repo/utils";
import type { Issue } from "@repo/opslens";

type CommentFormValues = {
  author: string;
  body: string;
};

type CommentFormInstance = ReturnType<typeof useAppForm<CommentFormValues>>;

type IssueCommentsPanelProps = {
  comments: Issue["comments"];
  form: CommentFormInstance;
  isSubmitting: boolean;
  onSubmit: (values: CommentFormValues) => void;
};

export function IssueCommentsPanel({ comments, form, isSubmitting, onSubmit }: IssueCommentsPanelProps) {
  const commentBody = form.watch("body");

  return (
    <>
      <form className="mt-[var(--space-3)] grid gap-[var(--space-2)]" onSubmit={form.handleSubmit(onSubmit)}>
        <Input id="comment-author" placeholder="작성자" size="md" control={form.control} name="author" />
        <Textarea id="comment-body" rows={4} placeholder="운영 메모/분석 결과를 입력하세요" control={form.control} name="body" />
        <Button
          type="submit"
          disabled={isSubmitting || commentBody.trim().length === 0}
          variant="secondary"
          className="w-fit"
          loading={isSubmitting ? true : undefined}
        >
          댓글 등록
        </Button>
      </form>

      <Box className="mt-[var(--space-4)] space-y-[var(--space-2)]">
        {comments.length === 0 ? (
          <StateView variant="empty" size="sm" title="등록된 댓글이 없습니다." />
        ) : (
          comments.map((comment) => (
            <Box key={comment.id} className="border-default rounded-lg border p-[var(--space-3)] text-sm">
              <Box as="p" className="text-foreground font-semibold">{comment.author}</Box>
              <Box as="p" className="text-muted mt-[var(--space-1)] whitespace-pre-wrap">{comment.body}</Box>
              <Box as="p" className="text-muted-foreground mt-[var(--space-1)] text-caption">{formatDateTime(comment.createdAt)}</Box>
            </Box>
          ))
        )}
      </Box>
    </>
  );
}
