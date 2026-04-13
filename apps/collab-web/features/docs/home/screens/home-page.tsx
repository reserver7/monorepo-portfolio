"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppForm } from "@repo/forms";
import { invalidateQueryKeys, notifyUiError, useMutation, useQuery, useQueryClient } from "@repo/react-query";
import { createDocument, deleteDocumentById, docsQueryKeys, listDocuments } from "@/features/docs/documents/api";
import { getWhiteboardPath } from "@/lib/navigation";
import { docsClientEnv } from "@/lib/config";
import {
  createGuestName,
  getStoredDisplayName,
  getStoredRole,
  setStoredEditorAccessKey,
  setStoredDisplayName,
  setStoredRole
} from "@/features/docs/collaboration/model";
import { formatExactTime, formatRelativeTime } from "@/features/docs/collaboration/model";
import { coerceAccessRole, collabFieldCopy } from "@repo/utils/collab";
import {
  MarketingCtaPair,
  MarketingGlassNav,
  MarketingSection,
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  Skeleton,
  Spinner,
  StateView,
  confirm,
  promptConfirm,
  Typography
} from "@repo/ui";

const EMPTY_TITLE = "(제목 없음)";

const resolveProtectedDeleteFieldError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "삭제 비밀번호를 확인해 주세요.";
  }

  const message = error.message.trim();
  if (message.length === 0) {
    return "삭제 비밀번호를 확인해 주세요.";
  }

  const normalized = message.toLowerCase();
  if (
    normalized.includes("비밀번호") ||
    normalized.includes("access key") ||
    normalized.includes("editor") ||
    normalized.includes("forbidden") ||
    normalized.includes("unauthorized") ||
    normalized.includes("403") ||
    normalized.includes("401")
  ) {
    return "삭제 비밀번호가 올바르지 않습니다.";
  }

  return message;
};

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
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
    retry: 1
  });

  useEffect(() => {
    const refetchDocuments = () => {
      void documentsQuery.refetch();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchDocuments();
      }
    };

    window.addEventListener("online", refetchDocuments);
    window.addEventListener("focus", refetchDocuments);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", refetchDocuments);
      window.removeEventListener("focus", refetchDocuments);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [documentsQuery.refetch]);

  const createDocumentMutation = useMutation({
    mutationFn: (input: { title: string; actor: string; editorAccessKey?: string }) => createDocument(input),
    onSuccess: async ({ document }) => {
      createForm.reset({
        displayName: createForm.getValues("displayName"),
        draftTitle: "협업 문서",
        role: docsClientEnv.defaultRole,
        editorAccessKey: ""
      });
      await invalidateQueryKeys(queryClient, [docsQueryKeys.documents()]);
      router.push(`/docs/${document.id}`);
    },
    onError: () => {
      shouldPreserveAccessKeyForRoomRef.current = false;
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (input: { documentId: string; editorAccessKey?: string; notifyOnError?: boolean }) =>
      deleteDocumentById(input),
    onSuccess: async () => {
      await invalidateQueryKeys(queryClient, [docsQueryKeys.documents()]);
    }
  });

  const documents = documentsQuery.data ?? [];
  const isActionPending = createDocumentMutation.isPending || deleteDocumentMutation.isPending;
  const protectedDocumentCount = documents.filter((document) => document.isProtected).length;
  const totalCommentCount = documents.reduce((total, document) => total + document.commentCount, 0);

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

  const openDocument = (documentId: string) => {
    keepAccessKeyForRoomEntry();
    setStoredDisplayName(createForm.getValues("displayName").trim() || createGuestName());
    createForm.setValue("editorAccessKey", "");
    router.push(`/docs/${documentId}`);
  };

  return (
    <>
      <MarketingGlassNav
        product="Collaborative Docs"
        subtitle="Real-time document workspace"
        actions={[
          {
            label: "화이트보드로 이동",
            onClick: () => {
              clearMainEditorAccessKey();
              router.push(getWhiteboardPath("/"));
            }
          }
        ]}
      />
      <main className="mx-auto min-h-screen w-full max-w-[1360px] px-4 pb-10 pt-3 md:px-8 md:pb-12 md:pt-4">
        <MarketingSection tone="light" className="mb-6 bg-surface-elevated/45">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Card className="border-default/80 bg-surface border p-6 shadow-[var(--shadow-card)] md:p-8" radius="lg">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Badge variant="info" size="lg" className="font-semibold uppercase tracking-wide">
                  Real-time Collaboration MVP
                </Badge>
              </div>
              <Typography as="h1" variant="h2" className="leading-tight">
                실시간 협업 문서 서비스
              </Typography>
              <Typography as="p" variant="bodySm" color="muted" className="mt-2 max-w-3xl">
                여러 사용자가 동시에 접속해 문서를 함께 편집하고, 변경 사항이 즉시 동기화됩니다.
              </Typography>
              <MarketingCtaPair
                className="mt-5"
                learnMoreLabel="목록으로 이동"
                primaryLabel="새 문서 만들기"
                onLearnMoreClick={() => {
                  const listSection = document.getElementById("docs-list-section");
                  listSection?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                onPrimaryClick={createForm.handleSubmit(handleCreate)}
                primaryLoading={createDocumentMutation.isPending}
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Input
                  control={createForm.control}
                  name="displayName"
                  label={collabFieldCopy.displayNameLabel}
                  onChange={(event) => {
                    setStoredDisplayName(event.target.value.trim() || createGuestName());
                  }}
                  placeholder={collabFieldCopy.displayNamePlaceholder}
                  size="md"
                />
                <Input
                  control={createForm.control}
                  name="draftTitle"
                  label="새 문서 제목"
                  placeholder="문서 제목"
                  size="md"
                />
                <div>
                  <Label size="sm" className="mb-2 block">
                    {collabFieldCopy.entryRoleLabel}
                  </Label>
                  <Select
                    control={createForm.control}
                    name="role"
                    options={[
                      { label: collabFieldCopy.roleOptionEditor, value: "editor" },
                      { label: collabFieldCopy.roleOptionViewer, value: "viewer" }
                    ]}
                    onChange={(value) => {
                      const nextRole = coerceAccessRole(String(value ?? ""), docsClientEnv.defaultRole);
                      createForm.setValue("role", nextRole, { shouldDirty: true, shouldTouch: true });
                      setStoredRole(nextRole);
                    }}
                    placeholder={collabFieldCopy.entryRolePlaceholder}
                    size="md"
                  />
                </div>
                <Input
                  control={createForm.control}
                  name="editorAccessKey"
                  data-testid="docs-home-editor-access-key-input"
                  label={collabFieldCopy.editorAccessKeyLabel}
                  type="password"
                  placeholder={collabFieldCopy.editorAccessKeyPlaceholder}
                  size="md"
                />
              </div>
            </Card>

            <Card className="border-default/80 bg-surface border p-6 shadow-[var(--shadow-card)] md:p-8" radius="lg">
              <Typography as="h2" variant="title">
                워크스페이스 개요
              </Typography>
              <Typography as="p" variant="bodySm" color="muted" className="mt-2">
                문서와 권한 상태를 확인하고, 필요한 문서로 바로 진입하세요.
              </Typography>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <Card className="border-default/70 bg-surface-elevated border p-3 text-center" radius="md">
                  <Typography as="p" variant="caption" color="subtle">
                    문서
                  </Typography>
                  <Typography as="p" variant="title" className="mt-1">
                    {documents.length}
                  </Typography>
                </Card>
                <Card className="border-default/70 bg-surface-elevated border p-3 text-center" radius="md">
                  <Typography as="p" variant="caption" color="subtle">
                    보호됨
                  </Typography>
                  <Typography as="p" variant="title" className="mt-1">
                    {protectedDocumentCount}
                  </Typography>
                </Card>
                <Card className="border-default/70 bg-surface-elevated border p-3 text-center" radius="md">
                  <Typography as="p" variant="caption" color="subtle">
                    댓글
                  </Typography>
                  <Typography as="p" variant="title" className="mt-1">
                    {totalCommentCount}
                  </Typography>
                </Card>
              </div>
              <div className="border-default/70 bg-surface-elevated mt-5 space-y-2 rounded-xl border p-3.5">
                <Typography as="p" variant="label">
                  사용 가이드
                </Typography>
                <Typography as="p" variant="bodySm" color="muted">
                  1) 이름/권한을 설정하고 문서를 생성합니다.
                </Typography>
                <Typography as="p" variant="bodySm" color="muted">
                  2) 편집 키를 입력하면 문서 진입 시 기본으로 재사용됩니다.
                </Typography>
                <Typography as="p" variant="bodySm" color="muted">
                  3) 삭제가 필요한 경우 문서 카드에서 즉시 처리합니다.
                </Typography>
              </div>
            </Card>
          </section>
        </MarketingSection>

        <MarketingSection id="docs-list-section" tone="light" className="bg-surface">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <Typography as="h2" variant="headingMd" className="font-semibold">
                문서 목록
              </Typography>
              <Typography as="span" variant="bodySm" color="subtle">
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
              <div className="grid items-stretch gap-4 md:grid-cols-2">
                {documents.map((document) => (
                  <Card
                    key={document.id}
                    className="border-default/80 hover:border-primary/35 group flex h-full cursor-pointer flex-col rounded-2xl border p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_32px_rgb(15_23_42/0.13)]"
                    interactive
                    data-testid={`document-card-${document.id}`}
                    onClick={() => openDocument(document.id)}
                  >
                    <div className="mb-3 flex min-h-[3rem] items-start justify-between gap-3">
                      <Typography
                        as="h3"
                        variant="title"
                        className="line-clamp-2 min-h-[2.5rem] break-words pr-2 text-[1.18rem] font-semibold leading-[1.32] md:text-[1.26rem]"
                      >
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

                    <div className="border-default/70 mt-2 min-h-[3.2rem] space-y-1 rounded-xl border bg-surface-elevated/60 p-3">
                      <Typography as="p" variant="bodySm" color="subtle">
                        최근 수정: {formatRelativeTime(document.updatedAt)}
                      </Typography>
                      <Typography as="p" variant="bodySm" color="subtle">
                        수정 일시: {formatExactTime(document.updatedAt)}
                      </Typography>
                    </div>

                    <div className="mt-auto flex justify-end gap-2 pt-4">
                      <Button
                        variant="danger"
                        size="sm"
                        data-testid={`document-delete-${document.id}`}
                        onClick={async (event) => {
                          event.stopPropagation();
                          if (document.isProtected) {
                            const accessKey = await promptConfirm({
                              title: "문서를 삭제할까요?",
                              description:
                                "이 문서는 편집 키로 보호되어 있습니다. 삭제 비밀번호를 입력해 주세요.",
                              inputLabel: "삭제 비밀번호",
                              inputPlaceholder: "삭제 비밀번호",
                              inputType: "password",
                              confirmText: "문서 삭제",
                              confirmVariant: "danger",
                              cancelText: "취소",
                              validator: (value) => {
                                if (value.trim().length === 0) {
                                  return "삭제 비밀번호를 입력해 주세요.";
                                }
                                return null;
                              },
                              asyncValidator: async (value) => {
                                try {
                                  await deleteDocumentMutation.mutateAsync({
                                    documentId: document.id,
                                    editorAccessKey: value.trim(),
                                    notifyOnError: false
                                  });
                                  return null;
                                } catch (error) {
                                  notifyUiError("문서 삭제에 실패했습니다.");
                                  return resolveProtectedDeleteFieldError(error);
                                }
                              }
                            });
                            if (accessKey === null) {
                              return;
                            }
                            return;
                          }

                          const shouldDelete = await confirm({
                            title: "문서를 삭제할까요?",
                            description: "삭제된 문서는 복구할 수 없습니다.",
                            confirmText: "문서 삭제",
                            confirmVariant: "danger",
                            cancelText: "취소"
                          });

                          if (!shouldDelete) {
                            return;
                          }

                          try {
                            await deleteDocumentMutation.mutateAsync({
                              documentId: document.id
                            });
                          } catch {
                            // requestJson에서 토스트를 처리하므로 여기서는 추가 알림을 띄우지 않습니다.
                          }
                        }}
                      >
                        삭제
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDocument(document.id);
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
        </MarketingSection>

        <Spinner open={isActionPending} fullscreen size="lg" color="primary" />
      </main>
    </>
  );
}
