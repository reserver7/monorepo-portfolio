"use client";

import * as React from "react";
import { cn } from "../cn";
import { FieldSupportText } from "../field/field-utils";
import { Label } from "../label";
import type { UploadFile, UploadProps } from "./upload.types";

const toFile = (file: File): UploadFile => ({
  uid: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
  name: file.name,
  size: file.size,
  type: file.type,
  status: "done",
  originFileObj: file
});
export function Upload({
  fileList,
  defaultFileList = [],
  onChange,
  beforeUpload,
  accept,
  multiple,
  maxCount,
  disabled,
  loading = false,
  error,
  emptyText = "No files selected",
  label,
  helperText,
  showUploadList = true,
  listType = "text",
  children = "Choose file",
  className,
  ...props
}: UploadProps) {
  const [uncontrolled, setUncontrolled] = React.useState<readonly UploadFile[]>(defaultFileList);
  const current = fileList ?? uncontrolled;
  const update = (next: UploadFile[], file: UploadFile) => {
    if (fileList === undefined) setUncontrolled(next);
    onChange?.({ file, fileList: next });
  };
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = React.useState(false);
  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled || loading || processing) return;
    const selected = Array.from(files);
    setProcessing(true);
    try {
      const accepted: UploadFile[] = [];
      for (const file of selected) {
        if (beforeUpload && !(await beforeUpload(file, selected))) continue;
        accepted.push(toFile(file));
      }
      const next = [...current, ...accepted].slice(maxCount ? -maxCount : undefined);
      const last = next.at(-1);
      if (last) update(next, last);
    } finally {
      setProcessing(false);
    }
  };
  const remove = (file: UploadFile) =>
    update(
      current.filter((item) => item.uid !== file.uid).map((item) => item),
      { ...file, status: "removed" }
    );
  const busy = disabled || loading || processing;
  return (
    <div className={cn("grid gap-2", className)} aria-busy={busy || undefined} {...props}>
      {label ? <Label size="sm">{label}</Label> : null}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        disabled={busy}
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="border-border bg-surface text-foreground hover:bg-surface-elevated focus-visible:ring-primary inline-flex w-fit items-center rounded-[var(--radius-md)] border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
      >
        {loading || processing ? "Uploading…" : children}
      </button>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : (
        <FieldSupportText message={helperText} />
      )}
      {showUploadList ? (
        <ul aria-label="Uploaded files" className="grid gap-1">
          {current.length ? (
            current.map((file) => (
              <li
                key={file.uid}
                className={cn(
                  "border-border flex min-w-0 items-center justify-between gap-3 rounded border px-3 py-2 text-sm",
                  listType === "picture" && "min-h-16"
                )}
              >
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  disabled={busy}
                  onClick={() => remove(file)}
                  className="text-muted hover:text-danger focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2"
                >
                  ×
                </button>
              </li>
            ))
          ) : (
            <li className="text-text-secondary text-sm">{emptyText}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
