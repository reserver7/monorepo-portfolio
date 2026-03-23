"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@repo/ui";
import { useCollaboration } from "@/hooks/use-collaboration";
import { getDocument, getDocumentHistory } from "@/lib/api";
import { docsClientEnv } from "@/lib/env";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredEditorAccessKey,
  getStoredRole,
  setStoredDisplayName,
  setStoredEditorAccessKey,
  setStoredRole
} from "@/lib/session";
import { formatExactTime, formatRelativeTime } from "@/lib/time";
import { useCollabStore } from "@/stores/use-collab-store";
import { collabFieldCopy } from "@repo/shared-client";

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

const PresencePanel = dynamic(() => import("@/components/presence-panel").then((mod) => mod.PresencePanel), {
  ssr: false
});
const CommentsPanel = dynamic(() => import("@/components/comments-panel").then((mod) => mod.CommentsPanel), {
  ssr: false
});
const HistoryPanel = dynamic(() => import("@/components/history-panel").then((mod) => mod.HistoryPanel), {
  ssr: false
});
const ActivityLogPanel = dynamic(
  () => import("@/components/activity-log-panel").then((mod) => mod.ActivityLogPanel),
  {
    ssr: false
  }
);

export default function DocumentRoomPage() {
  const params = useParams<{ id: string }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [displayName, setDisplayName] = useState<string>("게스트");
  const [requestedRole, setRequestedRole] = useState<"viewer" | "editor">("editor");
  const [editorAccessKey, setEditorAccessKey] = useState<string>("");

  const handleEditorRequestDenied = useCallback((resolvedRole: "viewer" | "editor") => {
    setRequestedRole(resolvedRole);
    setStoredRole(resolvedRole);
    setEditorAccessKey("");
    setStoredEditorAccessKey("");
  }, []);

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const storedEditorAccessKey = getStoredEditorAccessKey();
    const nextValue = stored?.trim() ? stored : createGuestName();
    setDisplayName(nextValue);
    setStoredDisplayName(nextValue);
    setRequestedRole(storedRole ?? "editor");
    setEditorAccessKey(storedEditorAccessKey ?? docsClientEnv.editorAccessKey ?? "");
  }, []);

  const documentQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId)
  });

  const historyQuery = useQuery({
    queryKey: ["history", documentId],
    queryFn: () => getDocumentHistory(documentId),
    enabled: Boolean(documentId),
    staleTime: 6000,
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

  const title = useCollabStore((state) => state.title);
  const content = useCollabStore((state) => state.content);
  const participants = useCollabStore((state) => state.participants);
  const comments = useCollabStore((state) => state.comments);
  const connection = useCollabStore((state) => state.connection);
  const saveState = useCollabStore((state) => state.saveState);
  const updatedAt = useCollabStore((state) => state.updatedAt);
  const version = useCollabStore((state) => state.version);
  const conflictMessage = useCollabStore((state) => state.conflictMessage);
  const eventLog = useCollabStore((state) => state.eventLog);

  const historyEntries = historyQuery.data?.history ?? [];

  if (!documentId) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-4 py-6 md:px-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
          >
            문서 목록으로
          </Link>
          <span className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs text-slate-600">
            문서 ID: {documentId.slice(0, 8)}...
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs text-slate-600">
            연결: {connectionLabel[connection]}
          </span>
          <span className="rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs text-slate-600">
            저장: {saveLabel[saveState]}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs ${
              currentRole === "editor"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-slate-100 text-slate-600"
            }`}
          >
            권한: {currentRole}
          </span>
          <Input
            title={collabFieldCopy.displayNameLabel}
            value={displayName}
            onChange={(event) => {
              const nextValue = event.target.value;
              setDisplayName(nextValue);
              setStoredDisplayName(nextValue.trim() || createGuestName());
            }}
            placeholder={collabFieldCopy.displayNamePlaceholder}
            className="w-36"
          />
          <Select
            value={requestedRole}
            onValueChange={(value) => {
              const nextRole = value === "viewer" ? "viewer" : "editor";
              setRequestedRole(nextRole);
              setStoredRole(nextRole);
            }}
          >
            <SelectTrigger className="w-44" title={collabFieldCopy.requestRolePlaceholder}>
              <SelectValue placeholder={collabFieldCopy.requestRolePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">{collabFieldCopy.requestOptionEditor}</SelectItem>
              <SelectItem value="viewer">{collabFieldCopy.requestOptionViewer}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            title={collabFieldCopy.editorAccessKeyLabel}
            type="password"
            value={editorAccessKey}
            onChange={(event) => {
              const nextValue = event.target.value;
              setEditorAccessKey(nextValue);
              setStoredEditorAccessKey(nextValue);
            }}
            placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
            className="w-40"
          />
          <Button variant="outline" size="sm" onClick={forceSave} disabled={isReadOnly}>
            지금 저장
          </Button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 md:p-6">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <Input
              value={title}
              onChange={(event) => updateTitle(event.target.value)}
              readOnly={isReadOnly}
              className="h-12 text-base font-semibold"
              placeholder="문서 제목"
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              버전 {version}
            </div>
          </div>

          {conflictMessage ? (
            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {conflictMessage}
            </div>
          ) : null}

          {isReadOnly ? (
            <div className="mb-4 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700">
              보기 전용(`viewer`) 세션입니다. 상단에서 `editor 요청`으로 바꾸고 편집 키를 입력하면
              재요청됩니다. 문서 편집은 비활성화되어 있으며 댓글 작성은 가능합니다.
            </div>
          ) : null}

          <Textarea
            value={content}
            onChange={(event) => updateContent(event.target.value)}
            onClick={(event) => sendCursor(event.currentTarget.selectionStart ?? 0)}
            onKeyUp={(event) => sendCursor(event.currentTarget.selectionStart ?? 0)}
            onSelect={(event) => sendCursor(event.currentTarget.selectionStart ?? 0)}
            readOnly={isReadOnly}
            className="h-[56vh] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-900"
            placeholder="여기서부터 실시간 협업이 시작됩니다..."
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              최근 수정:{" "}
              {updatedAt ? `${formatRelativeTime(updatedAt)} (${formatExactTime(updatedAt)})` : "-"}
            </span>
            <span>동시 접속: {participants.length}명</span>
          </div>
        </Card>

        <div className="space-y-4">
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
        <Card className="mt-5 border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          문서를 불러오지 못했습니다. 존재하지 않는 문서이거나 서버가 실행 중이 아닐 수 있습니다.
        </Card>
      ) : null}
    </main>
  );
}
