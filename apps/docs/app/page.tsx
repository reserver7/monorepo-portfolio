"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDocument, deleteDocumentById, listDocuments } from "@/lib/api";
import { navigateToWhiteboardApp } from "@/lib/cross-app";
import { docsClientEnv } from "@/lib/env";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredRole,
  setStoredEditorAccessKey,
  setStoredDisplayName,
  setStoredRole
} from "@/lib/session";
import { formatExactTime, formatRelativeTime } from "@/lib/time";
import { coerceAccessRole, collabFieldCopy } from "@repo/shared-client";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui";

const EMPTY_TITLE = "(제목 없음)";

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState<string>("");
  const [draftTitle, setDraftTitle] = useState<string>("협업 문서");
  const [role, setRole] = useState<"viewer" | "editor">(docsClientEnv.defaultRole);
  const [editorAccessKey, setEditorAccessKey] = useState<string>("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteAccessKeyDraft, setDeleteAccessKeyDraft] = useState<string>("");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const deleteAccessKeyInputRef = useRef<HTMLInputElement | null>(null);
  const shouldPreserveAccessKeyForRoomRef = useRef(false);

  const clearMainEditorAccessKey = () => {
    shouldPreserveAccessKeyForRoomRef.current = false;
    setEditorAccessKey("");
    setStoredEditorAccessKey("");
  };

  const keepAccessKeyForRoomEntry = (): string => {
    const normalizedAccessKey = editorAccessKey.trim();
    shouldPreserveAccessKeyForRoomRef.current = true;
    setStoredRole(role);
    setStoredEditorAccessKey(normalizedAccessKey);
    return normalizedAccessKey;
  };

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const nextName = stored?.trim() ? stored : createGuestName();
    setDisplayName(nextName);
    setStoredDisplayName(nextName);
    setRole(storedRole ?? docsClientEnv.defaultRole);
    shouldPreserveAccessKeyForRoomRef.current = false;
    setEditorAccessKey("");
    setStoredEditorAccessKey("");
  }, []);

  useEffect(() => {
    const handlePageHide = () => {
      if (shouldPreserveAccessKeyForRoomRef.current) {
        return;
      }

      setStoredEditorAccessKey("");
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      if (!shouldPreserveAccessKeyForRoomRef.current) {
        setStoredEditorAccessKey("");
      }
    };
  }, []);

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
    staleTime: 5000,
    refetchInterval: 5000
  });

  const createDocumentMutation = useMutation({
    mutationFn: (input: { title: string; actor: string; editorAccessKey?: string }) => createDocument(input),
    onSuccess: async ({ document }) => {
      setDraftTitle("협업 문서");
      setRole(docsClientEnv.defaultRole);
      setEditorAccessKey("");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      router.push(`/doc/${document.id}`);
    },
    onError: () => {
      shouldPreserveAccessKeyForRoomRef.current = false;
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (input: { documentId: string; editorAccessKey?: string }) => deleteDocumentById(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDeleteTargetId(null);
      setDeleteAccessKeyDraft("");
      setDeleteErrorMessage(null);
    },
    onError: (error) => {
      setDeleteErrorMessage(error instanceof Error ? error.message : "문서 삭제에 실패했습니다.");
      setDeleteAccessKeyDraft("");
      setTimeout(() => {
        deleteAccessKeyInputRef.current?.focus();
      }, 0);
    }
  });

  const documents = documentsQuery.data ?? [];
  const deleteTarget = documents.find((document) => document.id === deleteTargetId) ?? null;

  useEffect(() => {
    if (!deleteTargetId || !deleteTarget?.isProtected) {
      return;
    }

    const timer = setTimeout(() => {
      deleteAccessKeyInputRef.current?.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [deleteTargetId, deleteTarget?.isProtected]);

  const handleNameChange = (nextValue: string) => {
    setDisplayName(nextValue);
    setStoredDisplayName(nextValue.trim() || createGuestName());
  };

  const handleCreate = () => {
    const normalizedAccessKey = keepAccessKeyForRoomEntry();
    createDocumentMutation.mutate({
      title: draftTitle.trim() || EMPTY_TITLE,
      actor: displayName.trim() || createGuestName(),
      editorAccessKey: normalizedAccessKey || undefined
    });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 md:px-8">
      <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white/95 to-slate-50/85 p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-10 dark:border-slate-800 dark:from-slate-900/95 dark:to-slate-900/75 dark:shadow-[0_20px_45px_rgba(2,6,23,0.42)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:border-sky-400/55 dark:bg-sky-500/20 dark:text-sky-200"
          >
            Real-time Collaboration MVP
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearMainEditorAccessKey();
              navigateToWhiteboardApp("/");
            }}
          >
            화이트보드로 이동
          </Button>
        </div>
        <h1 className="font-heading text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
          실시간 협업 문서 서비스
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          여러 사용자가 동시에 접속해 문서를 함께 편집하고, 변경 사항이 즉시 동기화됩니다. 접속 상태, 자동
          저장, Yjs 기반 CRDT 충돌 처리까지 포함한 포트폴리오형 아키텍처를 확인할 수 있습니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_220px_220px_auto]">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">{collabFieldCopy.displayNameLabel}</p>
            <Input
              title={collabFieldCopy.displayNameLabel}
              value={displayName}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder={collabFieldCopy.displayNamePlaceholder}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">새 문서 제목</p>
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="문서 제목"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">{collabFieldCopy.entryRoleLabel}</p>
            <Select
              value={role}
              onValueChange={(value) => {
                const nextRole = coerceAccessRole(value, docsClientEnv.defaultRole);
                setRole(nextRole);
                setStoredRole(nextRole);
              }}
            >
              <SelectTrigger title={collabFieldCopy.entryRoleLabel}>
                <SelectValue placeholder={collabFieldCopy.entryRolePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">{collabFieldCopy.roleOptionEditor}</SelectItem>
                <SelectItem value="viewer">{collabFieldCopy.roleOptionViewer}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">
              {collabFieldCopy.editorAccessKeyLabel} (문서별 설정/입장 기본값)
            </p>
            <Input
              title={collabFieldCopy.editorAccessKeyLabel}
              type="password"
              value={editorAccessKey}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEditorAccessKey(nextValue);
              }}
              placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
            />
          </div>
          <div className="flex items-end">
            <Button
              size="lg"
              className="w-full md:w-auto"
              onClick={handleCreate}
              disabled={createDocumentMutation.isPending}
            >
              {createDocumentMutation.isPending ? "생성 중..." : "새 문서 만들기"}
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-slate-900 md:text-2xl">문서 목록</h2>
          <span className="text-sm text-slate-500">자동 새로고침: 5초</span>
        </div>

        {documentsQuery.isLoading ? (
          <Card className="p-6 text-sm text-slate-600">문서 목록을 불러오는 중입니다...</Card>
        ) : documentsQuery.isError ? (
          <Card className="p-6 text-sm text-rose-600">
            문서 목록 조회에 실패했습니다. 서버 상태를 확인해 주세요.
          </Card>
        ) : documents.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600">아직 문서가 없습니다. 첫 문서를 생성해보세요.</Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((document) => (
              <Card key={document.id} className="p-5" data-testid={`document-card-${document.id}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="font-heading text-lg font-semibold text-slate-900">
                    {document.title.trim() || EMPTY_TITLE}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                      v{document.version}
                    </span>
                    {document.isProtected ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        키 보호
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="min-h-12 text-sm text-slate-600">{document.snippet || "(내용 없음)"}</p>

                <div className="mt-4 space-y-1 text-xs text-slate-500">
                  <p>최근 수정: {formatRelativeTime(document.updatedAt)}</p>
                  <p>정확한 시각: {formatExactTime(document.updatedAt)}</p>
                  <p>댓글 수: {document.commentCount}</p>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    data-testid={`document-delete-${document.id}`}
                    onClick={() => {
                      setDeleteTargetId(document.id);
                      setDeleteAccessKeyDraft("");
                      setDeleteErrorMessage(null);
                    }}
                  >
                    삭제
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      keepAccessKeyForRoomEntry();
                      setStoredDisplayName(displayName.trim() || createGuestName());
                      setEditorAccessKey("");
                      router.push(`/doc/${document.id}`);
                    }}
                  >
                    문서 입장
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => {
          if (open) {
            return;
          }

          setDeleteTargetId(null);
          setDeleteAccessKeyDraft("");
          setDeleteErrorMessage(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문서를 삭제할까요?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.isProtected
                ? "이 문서는 편집 키로 보호되어 있습니다. 삭제 비밀번호를 입력해 주세요."
                : "삭제된 문서는 복구할 수 없습니다."}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget?.isProtected ? (
            <Input
              ref={deleteAccessKeyInputRef}
              type="password"
              value={deleteAccessKeyDraft}
              onChange={(event) => {
                setDeleteAccessKeyDraft(event.target.value);
                setDeleteErrorMessage(null);
              }}
              placeholder="삭제 비밀번호"
            />
          ) : null}

          {deleteErrorMessage ? <p className="text-sm text-rose-600">{deleteErrorMessage}</p> : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTargetId(null);
                setDeleteAccessKeyDraft("");
                setDeleteErrorMessage(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={
                deleteDocumentMutation.isPending ||
                !deleteTarget ||
                (deleteTarget.isProtected && deleteAccessKeyDraft.trim().length === 0)
              }
              onClick={() => {
                if (!deleteTarget) {
                  return;
                }

                deleteDocumentMutation.mutate({
                  documentId: deleteTarget.id,
                  editorAccessKey: deleteTarget.isProtected ? deleteAccessKeyDraft.trim() : undefined
                });
              }}
            >
              {deleteDocumentMutation.isPending ? "삭제 중..." : "문서 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
