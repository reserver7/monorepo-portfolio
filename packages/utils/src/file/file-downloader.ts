export const fileDownloader = (data: BlobPart, filename: string, ext?: string, type?: string) => {
  const blob = new Blob([data], {
    type: type || "application/octet-stream"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.download = ext === "xlsx" || ext === "xls" ? `${filename}.${ext}` : `${filename}`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
};
