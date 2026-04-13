"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { useQuery } from "@repo/react-query";
import {
  MarketingGlassNav,
  MarketingSection,
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  SplitWorkspaceLayout,
  StateView,
  Textarea,
  Typography
} from "@repo/ui";
import { useCollaboration } from "@/features/docs/collaboration/hooks/use-collaboration";
import { docsQueryKeys, getDocument, getDocumentHistory } from "@/features/docs/documents/api";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredEditorAccessKey,
  getStoredRole,
  setStoredDisplayName,
  setStoredEditorAccessKey,
  setStoredRole
} from "@/features/docs/collaboration/model";
import { formatExactTime, formatRelativeTime } from "@/features/docs/collaboration/model";
import { useCollabStore } from "@/features/docs/collaboration/stores/use-collab-store";
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
  () => import("@/features/docs/collaboration/components/panels/presence-panel").then((mod) => mod.PresencePanel),
  {
    ssr: false,
    loading: renderPanelLoading
  }
);
const CommentsPanel = dynamic(
  () => import("@/features/docs/collaboration/components/panels/comments-panel").then((mod) => mod.CommentsPanel),
  {
    ssr: false,
    loading: renderPanelLoading
  }
);
const HistoryPanel = dynamic(
  () => import("@/features/docs/collaboration/components/panels/history-panel").then((mod) => mod.HistoryPanel),
  {
    ssr: false,
    loading: renderPanelLoading
  }
);
const ActivityLogPanel = dynamic(
  () =>
    import("@/features/docs/collaboration/components/panels/activity-log-panel").then(
      (mod) => mod.ActivityLogPanel
    ),
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

  const handleEditorRequestDenied = useCallback(
    (resolvedRole: "viewer" | "editor") => {
      sessionForm.setValue("requestedRole", resolvedRole);
      setStoredRole(resolvedRole);
      sessionForm.setValue("editorAccessKey", "");
      setStoredEditorAccessKey("");
    },
    [sessionForm]
  );

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

  const syncCursorFromTextarea = useCallback(
    (target: HTMLTextAreaElement | null) => {
      if (!target) {
        return;
      }
      const cursorIndex =
        typeof target.selectionStart === "number" && Number.isFinite(target.selectionStart)
          ? target.selectionStart
          : 0;
      sendCursor(cursorIndex);
    },
    [sendCursor]
  );

  if (!documentId) {
    return null;
  }

  const goHome = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.assign("/docs");
  };

  return (
    <>
    <MarketingGlassNav
      product="Document Room"
      subtitle={`ID: ${documentId.slice(0, 8)}...`}
      actions={[{ label: "문서 목록으로", href: "/docs" }]}
    />
    <main className="mx-auto min-h-screen w-full max-w-[1360px] px-4 pb-10 pt-3 md:px-8 md:pb-12 md:pt-4">
      <MarketingSection tone="light" className="mb-5 bg-surface">
      <header className="border-default bg-surface mb-0 rounded-2xl border p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={goHome}>
              문서 목록으로
            </Button>
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
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <Input
            label={collabFieldCopy.displayNameLabel}
            control={sessionForm.control}
            name="displayName"
            onChange={(event) => {
              setStoredDisplayName(event.target.value.trim() || createGuestName());
            }}
            placeholder={collabFieldCopy.displayNamePlaceholder}
            size="md"
          />
          <div className="grid gap-1" data-testid="document-requested-role-select">
            <Label size="sm">{collabFieldCopy.requestRolePlaceholder}</Label>
            <Select
              options={[
                { label: collabFieldCopy.requestOptionEditor, value: "editor" },
                { label: collabFieldCopy.requestOptionViewer, value: "viewer" }
              ]}
              control={sessionForm.control}
              name="requestedRole"
              onChange={(value) => {
                const nextRole = String(value) === "viewer" ? "viewer" : "editor";
                setStoredRole(nextRole);
              }}
              placeholder={collabFieldCopy.requestRolePlaceholder}
              size="md"
              className="w-full"
            />
          </div>
          <Input
            label={collabFieldCopy.editorAccessKeyLabel}
            type="password"
            control={sessionForm.control}
            name="editorAccessKey"
            data-testid="document-editor-access-key-input"
            onChange={(event) => {
              setStoredEditorAccessKey(event.target.value);
            }}
            placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
            size="md"
          />
        </div>
      </header>
      </MarketingSection>

      <MarketingSection tone="light" className="bg-surface">
      <SplitWorkspaceLayout
        sidebarWidthClassName="lg:grid-cols-[minmax(0,1fr)_392px]"
        main={
          <Card className="border border-default/80 p-5 shadow-[var(--shadow-card)] md:p-6">
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <Input
                value={title}
                onChange={(event) => updateTitle(event.target.value)}
                readOnly={isReadOnly}
                size="md"
                className="text-[1.05rem] font-semibold"
                placeholder="문서 제목"
              />
              <div className="flex items-center justify-end gap-2">
                <Badge variant="outline" size="md" className="rounded-xl px-3 py-2">
                  버전 {version}
                </Badge>
              </div>
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
              onClick={(event) => syncCursorFromTextarea(event.currentTarget)}
              onKeyUp={(event) => syncCursorFromTextarea(event.currentTarget)}
              onSelect={(event) => syncCursorFromTextarea(event.currentTarget)}
              readOnly={isReadOnly}
              className="border-default bg-surface text-body-sm text-foreground h-[62vh] w-full resize-none rounded-xl border p-4 leading-7"
              placeholder="여기서부터 실시간 협업이 시작됩니다..."
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <Typography as="span" variant="bodySm" color="subtle">
                최근 수정:{" "}
                {updatedAt ? `${formatRelativeTime(updatedAt)} (${formatExactTime(updatedAt)})` : "-"}
              </Typography>
              <Typography as="span" variant="bodySm" color="subtle">
                동시 접속: {participants.length}명
              </Typography>
            </div>
          </Card>
        }
        sidebar={
          <>
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
          </>
        }
        />

      {documentQuery.isError ? (
        <StateView
          variant="error"
          size="md"
          title="문서를 불러오지 못했습니다."
          description="존재하지 않는 문서이거나 서버가 실행 중이 아닐 수 있습니다."
          className="mt-5"
        />
      ) : null}
      </MarketingSection>
    </main>
    </>
  );
}
