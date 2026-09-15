import type * as React from "react";

export type UploadFileStatus = "uploading" | "done" | "error" | "removed";
export type UploadFile = {
  uid: string;
  name: string;
  size?: number;
  type?: string;
  status?: UploadFileStatus;
  originFileObj?: File;
};
export interface UploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  fileList?: readonly UploadFile[];
  defaultFileList?: readonly UploadFile[];
  onChange?: (info: { file: UploadFile; fileList: UploadFile[] }) => void;
  beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<boolean>;
  accept?: string;
  multiple?: boolean;
  maxCount?: number;
  disabled?: boolean;
  loading?: boolean;
  error?: React.ReactNode;
  emptyText?: React.ReactNode;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  showUploadList?: boolean;
  listType?: "text" | "picture";
  children?: React.ReactNode;
}
