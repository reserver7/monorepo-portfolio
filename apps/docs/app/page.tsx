"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RhfField, useAppForm } from "@repo/forms";
import { useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { createDocument, deleteDocumentById, docsQueryKeys, listDocuments } from "@/lib/http";
import { navigateToWhiteboardApp } from "@/lib/navigation";
import { docsClientEnv } from "@/lib/config";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredRole,
  setStoredEditorAccessKey,
  setStoredDisplayName,
  setStoredRole
} from "@/lib/collab";
import { formatExactTime, formatRelativeTime } from "@/lib/collab";
import { coerceAccessRole, collabFieldCopy } from "@repo/utils/collab";
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
  StateView,
  Typography
} from "@repo/ui";

const EMPTY_TITLE = "(제목 없음)";

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createForm = useAppForm<{
    displayName: string;
    draftTitle: string;
    role: "viewer" | "editor";
    editorAccessKey: string;
  }>({
    defaultValues: {
      displayName: "",
      draftTitle: "협업 문서",
      role: docsClientEnv.defaultRole,
      editorAccessKey: ""
    }
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const deleteForm = useAppForm<{ deleteAccessKeyDraft: string }>({
    defaultValues: { deleteAccessKeyDraft: "" }
  });
  const deleteAccessKeyDraft = deleteForm.watch("deleteAccessKeyDraft");
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const deleteAccessKeyInputRef = useRef<HTMLInputElement | null>(null);
  const shouldPreserveAccessKeyForRoomRef = useRef(false);

  const clearMainEditorAccessKey = () => {
    shouldPreserveAccessKeyForRoomRef.current = false;
    createForm.setValue("editorAccessKey", "");
    setStoredEditorAccessKey("");
  };

  const keepAccessKeyForRoomEntry = (): string => {
    const normalizedAccessKey = (createForm.getValues("editorAccessKey") ?? "").trim();
    shouldPreserveAccessKeyForRoomRef.current = true;
    setStoredRole(createForm.getValues("role"));
    setStoredEditorAccessKey(normalizedAccessKey);
    return normalizedAccessKey;
  };

  useEffect(() => {
    const stored = getStoredDisplayName();
    const storedRole = getStoredRole();
    const nextName = stored?.trim() ? stored : createGuestName();
    createForm.setValue("displayName", nextName);
    setStoredDisplayName(nextName);
    createForm.setValue("role", storedRole ?? docsClientEnv.defaultRole);
    shouldPreserveAccessKeyForRoomRef.current = false;
    createForm.setValue("editorAccessKey", "");
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
    queryKey: docsQueryKeys.documents(),
    queryFn: listDocuments,
    staleTime: 10 * 1000,
    refetchInterval: 5000
  });

  const createDocumentMutation = useMutation({
    mutationFn: (input: { title: string; actor: string; editorAccessKey?: string }) => createDocument(input),
    onSuccess: async ({ document }) => {
      createForm.reset({
        displayName: createForm.getValues("displayName"),
        draftTitle: "협업 문서",
        role: docsClientEnv.defaultRole,
        editorAccessKey: ""
      });
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      router.push(`/doc/${document.id}`);
    },
    onError: () => {
      shouldPreserveAccessKeyForRoomRef.current = false;
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (input: { documentId: string; editorAccessKey?: string }) => deleteDocumentById(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: docsQueryKeys.documents() });
      setDeleteTargetId(null);
      deleteForm.setValue("deleteAccessKeyDraft", "");
      setDeleteErrorMessage(null);
    },
    onError: (error) => {
      setDeleteErrorMessage(error instanceof Error ? error.message : "문서 삭제에 실패했습니다.");
      deleteForm.setValue("deleteAccessKeyDraft", "");
      setTimeout(() => {
        deleteAccessKeyInputRef.current?.focus();
      }, 0);
    }
  });

  const documents = documentsQuery.data ?? [];
  const deleteTarget = documents.find((document) => document.id === deleteTargetId) ?? null;
  const isActionPending = createDocumentMutation.isPending || deleteDocumentMutation.isPending;
  const protectedDocumentCount = documents.filter((document) => document.isProtected).length;
  const totalCommentCount = documents.reduce((total, document) => total + document.commentCount, 0);

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

  const handleCreate = (values: {
    displayName: string;
    draftTitle: string;
    role: "viewer" | "editor";
    editorAccessKey: string;
  }) => {
    setStoredDisplayName(values.displayName.trim() || createGuestName());
    setStoredRole(values.role);
    const normalizedAccessKey = keepAccessKeyForRoomEntry();
    createDocumentMutation.mutate({
      title: values.draftTitle.trim() || EMPTY_TITLE,
      actor: values.displayName.trim() || createGuestName(),
      editorAccessKey: normalizedAccessKey || undefined
    });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1280px] px-4 py-8 md:px-8 md:py-10">
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Card className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Badge variant="info" size="lg" className="font-semibold uppercase tracking-[0.18em]">
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
          <Typography as="h1" variant="h1" className="leading-tight">
            실시간 협업 문서 서비스
          </Typography>
          <Typography as="p" variant="body" tone="muted" className="mt-3 max-w-3xl">
            여러 사용자가 동시에 접속해 문서를 함께 편집하고, 변경 사항이 즉시 동기화됩니다.
          </Typography>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div>
              <Label size="sm" className="mb-2 block">
                {collabFieldCopy.displayNameLabel}
              </Label>
              <RhfField
                control={createForm.control}
                name="displayName"
                render={({ field }) => (
                  <Input
                    title={collabFieldCopy.displayNameLabel}
                    value={field.value}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      setStoredDisplayName(event.target.value.trim() || createGuestName());
                    }}
                    placeholder={collabFieldCopy.displayNamePlaceholder}
                    size="md"
                  />
                )}
              />
            </div>
            <div>
              <Label size="sm" className="mb-2 block">
                새 문서 제목
              </Label>
              <RhfField
                control={createForm.control}
                name="draftTitle"
                render={({ field }) => (
                  <Input value={field.value} onChange={field.onChange} placeholder="문서 제목" size="md" />
                )}
              />
            </div>
            <div>
              <Label size="sm" className="mb-2 block">
                {collabFieldCopy.entryRoleLabel}
              </Label>
              <RhfField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      const nextRole = coerceAccessRole(value, docsClientEnv.defaultRole);
                      field.onChange(nextRole);
                      setStoredRole(nextRole);
                    }}
                  >
                    <SelectTrigger title={collabFieldCopy.entryRoleLabel} size="md">
                      <SelectValue placeholder={collabFieldCopy.entryRolePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">{collabFieldCopy.roleOptionEditor}</SelectItem>
                      <SelectItem value="viewer">{collabFieldCopy.roleOptionViewer}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label size="sm" className="mb-2 block">
                {collabFieldCopy.editorAccessKeyLabel}
              </Label>
              <RhfField
                control={createForm.control}
                name="editorAccessKey"
                render={({ field }) => (
                  <Input
                    title={collabFieldCopy.editorAccessKeyLabel}
                    type="password"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
                    size="md"
                  />
                )}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="lg"
              onClick={createForm.handleSubmit(handleCreate)}
              loading={createDocumentMutation.isPending ? true : undefined}
            >
              새 문서 만들기
            </Button>
          </div>
        </Card>

        <Card variant="elevated" className="p-6 md:p-8">
          <Typography as="h2" variant="h3">
            워크스페이스 개요
          </Typography>
          <Typography as="p" variant="bodySm" tone="muted" className="mt-2">
            문서와 권한 상태를 확인하고, 필요한 문서로 바로 진입하세요.
          </Typography>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" tone="subtle">
                문서
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {documents.length}
              </Typography>
            </Card>
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" tone="subtle">
                보호됨
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {protectedDocumentCount}
              </Typography>
            </Card>
            <Card className="p-3 text-center">
              <Typography as="p" variant="caption" tone="subtle">
                댓글
              </Typography>
              <Typography as="p" variant="h3" className="mt-1">
                {totalCommentCount}
              </Typography>
            </Card>
          </div>
          <div className="mt-5 space-y-2 rounded-xl border border-default bg-surface p-3.5">
            <Typography as="p" variant="label" tone="subtle">
              사용 가이드
            </Typography>
            <Typography as="p" variant="bodySm" tone="muted">
              1) 이름/권한을 설정하고 문서를 생성합니다.
            </Typography>
            <Typography as="p" variant="bodySm" tone="muted">
              2) 편집 키를 입력하면 문서 진입 시 기본으로 재사용됩니다.
            </Typography>
            <Typography as="p" variant="bodySm" tone="muted">
              3) 삭제가 필요한 경우 문서 카드에서 즉시 처리합니다.
            </Typography>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <Typography as="h2" variant="h2" className="text-heading-xl">
            문서 목록
          </Typography>
          <Typography as="span" variant="bodySm" tone="subtle">
            자동 새로고침: 5초
          </Typography>
        </div>

        {documentsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={`document-loading-skeleton-${index}`} className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-6 w-2/5" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <div className="space-y-2 pt-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : documentsQuery.isError ? (
          <StateView
            variant="error"
            size="lg"
            title="문서 목록 조회에 실패했습니다."
            description="서버 상태를 확인해 주세요."
          />
        ) : documents.length === 0 ? (
          <StateView
            variant="empty"
            size="lg"
            title="아직 문서가 없습니다."
            description="첫 문서를 생성해보세요."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((document) => (
              <Card key={document.id} className="p-5" interactive data-testid={`document-card-${document.id}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Typography as="h3" variant="h3" className="text-heading-lg">
                    {document.title.trim() || EMPTY_TITLE}
                  </Typography>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" size="sm">
                      v{document.version}
                    </Badge>
                    {document.isProtected ? (
                      <Badge variant="warning" size="sm">
                        키 보호
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <Typography as="p" variant="bodySm" tone="muted" className="min-h-12">
                  {document.snippet || "(내용 없음)"}
                </Typography>

                <div className="mt-4 space-y-1">
                  <Typography as="p" variant="bodySm" tone="subtle">
                    최근 수정: {formatRelativeTime(document.updatedAt)}
                  </Typography>
                  <Typography as="p" variant="bodySm" tone="subtle">
                    정확한 시각: {formatExactTime(document.updatedAt)}
                  </Typography>
                  <Typography as="p" variant="bodySm" tone="subtle">
                    댓글 수: {document.commentCount}
                  </Typography>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    data-testid={`document-delete-${document.id}`}
                    onClick={() => {
                      setDeleteTargetId(document.id);
                      deleteForm.setValue("deleteAccessKeyDraft", "");
                      setDeleteErrorMessage(null);
                    }}
                  >
                    삭제
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      keepAccessKeyForRoomEntry();
                      setStoredDisplayName(createForm.getValues("displayName").trim() || createGuestName());
                      createForm.setValue("editorAccessKey", "");
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
          deleteForm.setValue("deleteAccessKeyDraft", "");
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
            <RhfField
              control={deleteForm.control}
              name="deleteAccessKeyDraft"
              render={({ field }) => (
                <Input
                  ref={deleteAccessKeyInputRef}
                  type="password"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event);
                    setDeleteErrorMessage(null);
                  }}
                  placeholder="삭제 비밀번호"
                  size="md"
                  state={deleteErrorMessage ? "error" : "default"}
                />
              )}
            />
          ) : null}

          {deleteErrorMessage ? (
            <Typography as="p" variant="bodySm" tone="danger">
              {deleteErrorMessage}
            </Typography>
          ) : null}

          <DialogFooter
            onCancel={() => {
              setDeleteTargetId(null);
              deleteForm.setValue("deleteAccessKeyDraft", "");
              setDeleteErrorMessage(null);
            }}
            onConfirm={() => {
              if (!deleteTarget) {
                return;
              }

              deleteDocumentMutation.mutate({
                documentId: deleteTarget.id,
                editorAccessKey: deleteTarget.isProtected ? deleteAccessKeyDraft.trim() : undefined
              });
            }}
            confirmDisabled={
              deleteDocumentMutation.isPending ||
              !deleteTarget ||
              (deleteTarget.isProtected && deleteAccessKeyDraft.trim().length === 0)
            }
            confirmLoading={deleteDocumentMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Spinner open={isActionPending} fullscreen size="lg" tone="primary" />
    </main>
  );
}
