"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { RhfField, useAppForm } from "@repo/forms";
import { useQuery } from "@repo/react-query";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StateView,
  Textarea,
  Typography
} from "@repo/ui";
import { useCollaboration } from "@/features/collaboration/hooks/use-collaboration";
import { docsQueryKeys, getDocument, getDocumentHistory } from "@/lib/http";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredEditorAccessKey,
  getStoredRole,
  setStoredDisplayName,
  setStoredEditorAccessKey,
  setStoredRole
} from "@/lib/collab";
import { formatExactTime, formatRelativeTime } from "@/lib/collab";
import { useCollabStore } from "@/features/collaboration/stores/use-collab-store";
import { collabFieldCopy } from "@repo/utils/collab";

const connectionLabel = {
  connecting: "연결 중",
  online: "온라인",
  offline: "오프라인"
} as const;

const saveLabel = {
  idle: "대기",
  saving: "동기화 중",
  saved: "저장됨",
  offline: "오프라인 보류"
} as const;

const renderPanelLoading = () => (
  <Card className="p-5">
    <StateView variant="loading" title="패널 불러오는 중" description="잠시만 기다려 주세요." />
  </Card>
);

const PresencePanel = dynamic(
  () => import("@/features/collaboration/components/panels/presence-panel").then((mod) => mod.PresencePanel),
  {
    ssr: false,
    loading: renderPanelLoading
  }
);
const CommentsPanel = dynamic(
  () => import("@/features/collaboration/components/panels/comments-panel").then((mod) => mod.CommentsPanel),
  {
    ssr: false,
    loading: renderPanelLoading
  }
);
const HistoryPanel = dynamic(
  () => import("@/features/collaboration/components/panels/history-panel").then((mod) => mod.HistoryPanel),
  {
    ssr: false,
    loading: renderPanelLoading
  }
);
const ActivityLogPanel = dynamic(
  () => import("@/features/collaboration/components/panels/activity-log-panel").then((mod) => mod.ActivityLogPanel),
  {
    ssr: false,
    loading: renderPanelLoading
  }
);

export default function DocumentRoomPage() {
  const params = useParams<{ id: string }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const sessionForm = useAppForm<{
    displayName: string;
    requestedRole: "viewer" | "editor";
    editorAccessKey: string;
  }>({
    defaultValues: {
      displayName: "게스트",
      requestedRole: "editor",
      editorAccessKey: ""
    }
  });
  const displayName = sessionForm.watch("displayName");
  const requestedRole = sessionForm.watch("requestedRole");
  const editorAccessKey = sessionForm.watch("editorAccessKey");

  const handleEditorRequestDenied = useCallback((resolvedRole: "viewer" | "editor") => {
    sessionForm.setValue("requestedRole", resolvedRole);
    setStoredRole(resolvedRole);
    sessionForm.setValue("editorAccessKey", "");
    setStoredEditorAccessKey("");
  }, [sessionForm]);

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const storedEditorAccessKey = getStoredEditorAccessKey();
    const nextValue = stored?.trim() ? stored : createGuestName();
    sessionForm.setValue("displayName", nextValue);
    setStoredDisplayName(nextValue);
    sessionForm.setValue("requestedRole", storedRole ?? "editor");
    sessionForm.setValue("editorAccessKey", storedEditorAccessKey ?? "");
  }, [sessionForm]);

  const documentQuery = useQuery({
    queryKey: docsQueryKeys.document(documentId),
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId),
    staleTime: 10 * 1000
  });

  const historyQuery = useQuery({
    queryKey: docsQueryKeys.history(documentId),
    queryFn: () => getDocumentHistory(documentId),
    enabled: Boolean(documentId),
    staleTime: 10 * 1000,
    refetchInterval: 6000
  });

  const {
    sessionId,
    currentRole,
    isReadOnly,
    updateTitle,
    updateContent,
    sendCursor,
    forceSave,
    addComment,
    updateComment,
    deleteComment
  } = useCollaboration({
    documentId,
    displayName,
    role: requestedRole,
    editorAccessKey,
    initialDocument: documentQuery.data?.document,
    onEditorRequestDenied: handleEditorRequestDenied
  });

  const title = useCollabStore.use.title();
  const content = useCollabStore.use.content();
  const participants = useCollabStore.use.participants();
  const comments = useCollabStore.use.comments();
  const connection = useCollabStore.use.connection();
  const saveState = useCollabStore.use.saveState();
  const updatedAt = useCollabStore.use.updatedAt();
  const version = useCollabStore.use.version();
  const conflictMessage = useCollabStore.use.conflictMessage();
  const eventLog = useCollabStore.use.eventLog();

  const historyEntries = historyQuery.data?.history ?? [];

  if (!documentId) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-10">
      <header className="mb-6 rounded-2xl border border-default bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-default bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:border-primary/40 hover:text-primary"
            >
              문서 목록으로
            </Link>
            <Badge variant="outline" size="md">
              문서 ID: {documentId.slice(0, 8)}...
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" size="md">
              연결: {connectionLabel[connection]}
            </Badge>
            <Badge variant="outline" size="md">
              저장: {saveLabel[saveState]}
            </Badge>
            <Badge
              data-testid="document-current-role"
              variant={currentRole === "editor" ? "success" : "outline"}
              size="md"
            >
              권한: {currentRole}
            </Badge>
            <Button variant="outline" size="md" onClick={forceSave} disabled={isReadOnly}>
              지금 저장
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <RhfField
            control={sessionForm.control}
            name="displayName"
            render={({ field }) => (
              <Input
                title={collabFieldCopy.displayNameLabel}
                value={field.value}
                onChange={(event) => {
                  field.onChange(event);
                  setStoredDisplayName(event.target.value.trim() || createGuestName());
                }}
                placeholder={collabFieldCopy.displayNamePlaceholder}
                size="md"
              />
            )}
          />
          <RhfField
            control={sessionForm.control}
            name="requestedRole"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const nextRole = value === "viewer" ? "viewer" : "editor";
                  field.onChange(nextRole);
                  setStoredRole(nextRole);
                }}
              >
                <SelectTrigger size="md" title={collabFieldCopy.requestRolePlaceholder}>
                  <SelectValue placeholder={collabFieldCopy.requestRolePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">{collabFieldCopy.requestOptionEditor}</SelectItem>
                  <SelectItem value="viewer">{collabFieldCopy.requestOptionViewer}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <RhfField
            control={sessionForm.control}
            name="editorAccessKey"
            render={({ field }) => (
              <Input
                title={collabFieldCopy.editorAccessKeyLabel}
                type="password"
                value={field.value}
                onChange={(event) => {
                  field.onChange(event);
                  setStoredEditorAccessKey(event.target.value);
                }}
                placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
                size="md"
              />
            )}
          />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_392px]">
        <Card className="p-5 md:p-6">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <Input
              value={title}
              onChange={(event) => updateTitle(event.target.value)}
              readOnly={isReadOnly}
              size="md"
              className="text-base font-semibold"
              placeholder="문서 제목"
            />
            <Badge variant="outline" size="md" className="rounded-xl px-3 py-2">
              버전 {version}
            </Badge>
          </div>

          {conflictMessage ? (
            <StateView variant="warning" size="sm" align="left" title={conflictMessage} className="mb-4" />
          ) : null}

          {isReadOnly ? (
            <StateView
              variant="info"
              size="sm"
              align="left"
              title="보기 전용(`viewer`) 세션입니다."
              description="상단에서 `editor 요청`으로 바꾸고 편집 키를 입력하면 재요청됩니다. 문서 편집은 비활성화되어 있으며 댓글 작성은 가능합니다."
              className="mb-4"
            />
          ) : null}

          <Textarea
            value={content}
            onChange={(event) => updateContent(event.target.value)}
            onClick={(event) => sendCursor(event.currentTarget.selectionStart ?? 0)}
            onKeyUp={(event) => sendCursor(event.currentTarget.selectionStart ?? 0)}
            onSelect={(event) => sendCursor(event.currentTarget.selectionStart ?? 0)}
            readOnly={isReadOnly}
            className="h-[62vh] w-full resize-none rounded-2xl border border-default bg-surface p-4 text-body-sm leading-7 text-foreground"
            placeholder="여기서부터 실시간 협업이 시작됩니다..."
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Typography as="span" variant="bodySm" tone="subtle">
              최근 수정:{" "}
              {updatedAt ? `${formatRelativeTime(updatedAt)} (${formatExactTime(updatedAt)})` : "-"}
            </Typography>
            <Typography as="span" variant="bodySm" tone="subtle">
              동시 접속: {participants.length}명
            </Typography>
          </div>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <PresencePanel participants={participants} mySessionId={sessionId} />
          <CommentsPanel
            comments={comments}
            participants={participants}
            mySessionId={sessionId}
            onSubmitComment={(body, mentions) => addComment(body, mentions)}
            onUpdateComment={(commentId, body, mentions) => updateComment(commentId, body, mentions)}
            onDeleteComment={(commentId) => deleteComment(commentId)}
          />
          <HistoryPanel entries={historyEntries} />
          <ActivityLogPanel logs={eventLog} />
        </div>
      </div>

      {documentQuery.isError ? (
        <StateView
          variant="error"
          size="md"
          title="문서를 불러오지 못했습니다."
          description="존재하지 않는 문서이거나 서버가 실행 중이 아닐 수 있습니다."
          className="mt-5"
        />
      ) : null}
    </main>
  );
}
