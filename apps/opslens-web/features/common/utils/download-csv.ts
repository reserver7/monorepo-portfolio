const escapeCsv = (value: unknown): string => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>): void {
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
