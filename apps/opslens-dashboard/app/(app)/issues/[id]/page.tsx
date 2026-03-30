"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Typography
} from "@repo/ui";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import {
  addIssueComment,
  assignIssue,
  getIssueDetail,
  type IssueStatus,
  updateIssueStatus
} from "@/lib/api";
import { OpsInfoItem, OpsSectionCard } from "@/components/opslens";
import { formatDateTime, formatNumber } from "@/lib/utils";

const statusOptions: Array<{ label: string; value: IssueStatus }> = [
  { label: "신규", value: "new" },
  { label: "분석중", value: "analyzing" },
  { label: "대응중", value: "in_progress" },
  { label: "해결", value: "resolved" }
];

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const issueId = params.id;
  const queryClient = useQueryClient();

  const [assignee, setAssignee] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("운영담당자");
  const [commentBody, setCommentBody] = useState("");

  const issueQuery = useQuery({
    queryKey: ["opslens", "issue-detail", issueId],
    queryFn: () => getIssueDetail(issueId),
    enabled: Boolean(issueId)
  });

  const issue = issueQuery.data;

  const statusMutation = useMutation({
    mutationFn: (status: IssueStatus) => updateIssueStatus(issueId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["opslens", "issue-detail", issueId] }),
        queryClient.invalidateQueries({ queryKey: ["opslens", "issues"] })
      ]);
    }
  });

  const assigneeMutation = useMutation({
    mutationFn: () => assignIssue(issueId, assignee.trim()),
    onSuccess: async () => {
      setAssignee("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["opslens", "issue-detail", issueId] }),
        queryClient.invalidateQueries({ queryKey: ["opslens", "issues"] })
      ]);
    }
  });

  const commentMutation = useMutation({
    mutationFn: () => addIssueComment(issueId, commentAuthor.trim() || "익명", commentBody.trim()),
    onSuccess: async () => {
      setCommentBody("");
      await queryClient.invalidateQueries({ queryKey: ["opslens", "issue-detail", issueId] });
    }
  });

  const statusLabel = useMemo(() => {
    if (!issue) return "-";
    if (issue.status === "new") return "신규";
    if (issue.status === "analyzing") return "분석중";
    if (issue.status === "in_progress") return "대응중";
    return "해결";
  }, [issue]);

  if (issueQuery.isLoading) {
    return <div className="rounded-xl border border-default bg-surface p-5">이슈 상세를 불러오는 중...</div>;
  }

  if (issueQuery.isError || !issue) {
    return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">이슈 상세 조회에 실패했습니다.</div>;
  }

  return (
    <div className="space-y-5">
      <OpsSectionCard title="Issue Detail">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Typography as="h2" variant="h2" className="text-heading-xl">
              {issue.title}
            </Typography>
            <Typography as="p" variant="bodySm" tone="muted" className="mt-2">
              {issue.summary}
            </Typography>
          </div>
          <Link href="/issues" className="text-sm font-semibold text-primary hover:text-primary">
            목록으로 이동
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <OpsInfoItem label="심각도" value={issue.severity} />
          <OpsInfoItem label="상태" value={statusLabel} />
          <OpsInfoItem label="발생 횟수" value={`${formatNumber(issue.occurrenceCount)}회`} />
          <OpsInfoItem label="담당자" value={issue.assignee || "미지정"} />
          <OpsInfoItem label="서비스" value={issue.serviceName} />
          <OpsInfoItem label="환경" value={issue.environment} />
          <OpsInfoItem label="최초 발생" value={formatDateTime(issue.firstOccurredAt)} />
          <OpsInfoItem label="최근 발생" value={formatDateTime(issue.lastOccurredAt)} />
        </div>
      </OpsSectionCard>

      <section className="grid gap-5 xl:grid-cols-2">
        <OpsSectionCard title="상태/담당자 관리">
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="grid gap-1">
              <Label htmlFor="issue-status">상태 변경</Label>
              <Select
                value={issue.status}
                onValueChange={(value) => statusMutation.mutate(value as IssueStatus)}
                disabled={statusMutation.isPending}
              >
                <SelectTrigger id="issue-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1 text-sm">
              <Label htmlFor="issue-assignee">담당자 지정</Label>
              <div className="flex gap-2">
                <Input
                  id="issue-assignee"
                  value={assignee}
                  onChange={(event) => setAssignee(event.target.value)}
                  placeholder="예: reserver7"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => assigneeMutation.mutate()}
                  disabled={assigneeMutation.isPending || assignee.trim().length === 0}
                  className="bg-primary hover:opacity-90"
                >
                  저장
                </Button>
              </div>
            </div>
          </div>
        </OpsSectionCard>

        <OpsSectionCard title="AI 원인 후보 / 대응 액션">
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="mb-1 font-semibold text-foreground">원인 후보</p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {issue.probableCauses.map((cause) => (
                  <li key={cause}>{cause}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-semibold text-foreground">권장 액션</p>
              <ul className="list-disc space-y-1 pl-5 text-muted">
                {issue.suggestedActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-semibold text-foreground">재현 가이드</p>
              <p className="text-muted">{issue.reproductionGuide}</p>
            </div>
          </div>
        </OpsSectionCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <OpsSectionCard title="관련 로그 (최근 30개)">
          {issue.logs.length === 0 ? (
            <p className="mt-3 text-sm text-muted">로그 데이터가 없습니다.</p>
          ) : (
            <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
              {issue.logs.map((log) => (
                <div key={log.id} className="rounded-lg border border-default p-3">
                  <p className="text-xs text-muted-foreground">{formatDateTime(log.occurredAt)} · {log.source} · {log.level}</p>
                  <p className="mt-1 whitespace-pre-wrap break-all font-mono text-xs text-foreground">{log.rawMessage}</p>
                </div>
              ))}
            </div>
          )}
        </OpsSectionCard>

        <OpsSectionCard title="메모 / 댓글">
          <div className="mt-3 grid gap-2">
            <Input
              id="comment-author"
              value={commentAuthor}
              onChange={(event) => setCommentAuthor(event.target.value)}
              placeholder="작성자"
            />
            <Textarea
              id="comment-body"
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              rows={4}
              placeholder="운영 메모/분석 결과를 입력하세요"
            />
            <Button
              type="button"
              onClick={() => commentMutation.mutate()}
              disabled={commentMutation.isPending || commentBody.trim().length === 0}
              className="w-fit bg-foreground hover:opacity-90"
            >
              댓글 등록
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {issue.comments.length === 0 ? (
              <p className="text-sm text-muted">등록된 댓글이 없습니다.</p>
            ) : (
              issue.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-default p-3 text-sm">
                  <p className="font-semibold text-foreground">{comment.author}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted">{comment.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </OpsSectionCard>
      </section>
    </div>
  );
}
