"use client";

import { FeedbackState } from "@/features/common/components/feedback-state";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
  Textarea,
  Typography
} from "@repo/ui";
import { CollabLocaleFilter } from "@/features/common/components/collab-locale-filter";
import { useCollaboration } from "@/features/docs/collaboration/hooks/use-collaboration";
import { docsQueryKeys, getDocument, getDocumentHistory } from "@/features/docs/documents/api";
import {
  getStoredDisplayName,
  getStoredEditorAccessKey,
  getStoredRole,
  setStoredDisplayName,
  setStoredEditorAccessKey,
  setStoredRole
} from "@/features/docs/collaboration/model";
import { formatExactTime, formatRelativeTime } from "@/features/docs/collaboration/model";
import { useCollabStore } from "@/features/docs/collaboration/stores/use-collab-store";
import { createLocaleGuestName, normalizeGuestDisplayName } from "@/lib/i18n/display-name";

export default function DocumentRoomPage() {
  const t = useTranslations("collab.docsRoom");
  const tFields = useTranslations("collab.fields");
  const locale = useLocale();
  const resolveGuestName = useCallback(() => createLocaleGuestName(locale), [locale]);
  const panelLoadingState = useCallback(
    () => (
      <Card className="p-5">
        <FeedbackState variant="loading" title={t("panel.loadingTitle")} description={t("panel.loadingDescription")} />
      </Card>
    ),
    [t]
  );
  const PresencePanel = useMemo(
    () =>
      dynamic(
        () =>
          import("@/features/docs/collaboration/components/panels/presence-panel").then(
            (mod) => mod.PresencePanel
          ),
        {
          ssr: false,
          loading: panelLoadingState
        }
      ),
    [panelLoadingState]
  );
  const CommentsPanel = useMemo(
    () =>
      dynamic(
        () =>
          import("@/features/docs/collaboration/components/panels/comments-panel").then(
            (mod) => mod.CommentsPanel
          ),
        {
          ssr: false,
          loading: panelLoadingState
        }
      ),
    [panelLoadingState]
  );
  const HistoryPanel = useMemo(
    () =>
      dynamic(
        () =>
          import("@/features/docs/collaboration/components/panels/history-panel").then(
            (mod) => mod.HistoryPanel
          ),
        {
          ssr: false,
          loading: panelLoadingState
        }
      ),
    [panelLoadingState]
  );
  const ActivityLogPanel = useMemo(
    () =>
      dynamic(
        () =>
          import("@/features/docs/collaboration/components/panels/activity-log-panel").then(
            (mod) => mod.ActivityLogPanel
          ),
        {
          ssr: false,
          loading: panelLoadingState
        }
      ),
    [panelLoadingState]
  );
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const sessionForm = useAppForm<{
    displayName: string;
    requestedRole: "viewer" | "editor";
    editorAccessKey: string;
  }>({
    defaultValues: {
      displayName: resolveGuestName(),
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
    const nextValue = stored?.trim() ? normalizeGuestDisplayName(stored, locale) : resolveGuestName();
    sessionForm.setValue("displayName", nextValue);
    setStoredDisplayName(nextValue);
    sessionForm.setValue("requestedRole", storedRole ?? "editor");
    sessionForm.setValue("editorAccessKey", storedEditorAccessKey ?? "");
  }, [locale, resolveGuestName, sessionForm]);

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

  const connectionLabel = {
    connecting: t("status.connection.connecting"),
    online: t("status.connection.online"),
    offline: t("status.connection.offline")
  } as const;

  const saveLabel = {
    idle: t("status.save.idle"),
    saving: t("status.save.saving"),
    saved: t("status.save.saved"),
    offline: t("status.save.offline")
  } as const;

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
    router.push("/docs");
  };

  return (
    <>
      <MarketingGlassNav
        product="Document Room"
        subtitle={`ID: ${documentId.slice(0, 8)}...`}
        rightSlot={<CollabLocaleFilter />}
        actions={[{ label: t("actions.backToList"), href: "/docs" }]}
      />
      <main className="mx-auto min-h-screen w-full max-w-[1360px] px-4 pb-10 pt-3 md:px-8 md:pb-12 md:pt-4">
        <MarketingSection tone="light" className="bg-surface mb-5">
          <header className="border-default bg-surface mb-0 rounded-2xl border p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={goHome}>
                  {t("actions.backToList")}
                </Button>
                <Badge variant="outline" size="md">
                  {t("status.documentId")}: {documentId.slice(0, 8)}...
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" size="md">
                  {t("status.connection.label")}: {connectionLabel[connection]}
                </Badge>
                <Badge variant="outline" size="md">
                  {t("status.save.label")}: {saveLabel[saveState]}
                </Badge>
                <Badge
                  data-testid="document-current-role"
                  variant={currentRole === "editor" ? "success" : "outline"}
                  size="md"
                >
                  {t("status.role")}: {currentRole}
                </Badge>
              </div>
            </div>

            {conflictMessage ? (
              <FeedbackState variant="warning" size="sm" align="left" title={conflictMessage} className="mb-4" />
            ) : null}

            {isReadOnly ? (
              <FeedbackState
                variant="info"
                size="sm"
                align="left"
                title={t("content.readOnly.title")}
                description={t("content.readOnly.description")}
                className="mb-4"
              />
            </div>
          </header>
        </MarketingSection>

      {documentQuery.isError ? (
        <FeedbackState
          variant="error"
          size="md"
          title={t("content.errorTitle")}
          description={t("content.errorDescription")}
          className="mt-5"
        />
      ) : null}
      </MarketingSection>
    </main>
    </>
  );
}
