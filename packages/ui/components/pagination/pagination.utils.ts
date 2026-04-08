const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const range = (from: number, to: number) => {
  const result: number[] = [];
  for (let index = from; index <= to; index += 1) result.push(index);
  return result;
};

export const toSafeTotalPages = (totalPages: number) => Math.max(1, Math.floor(totalPages || 1));

export const toSafePage = (page: number, totalPages: number) => clamp(Math.floor(page || 1), 1, toSafeTotalPages(totalPages));

export const toSafePageSize = (pageSize: number) => Math.max(1, Math.floor(pageSize || 1));

export const resolveTotalPages = (params: { totalPages?: number; totalItems?: number; pageSize: number }) => {
  const { totalPages, totalItems, pageSize } = params;
  if (typeof totalItems === "number" && totalItems >= 0) {
    return Math.max(1, Math.ceil(totalItems / toSafePageSize(pageSize)));
  }
  return toSafeTotalPages(totalPages ?? 1);
};

export const createPaginationItems = (params: {
  page: number;
  totalPages: number;
  siblingCount: number;
  boundaryCount: number;
}) => {
  const totalPages = toSafeTotalPages(params.totalPages);
  const page = toSafePage(params.page, totalPages);
  const siblingCount = Math.max(0, Math.floor(params.siblingCount || 0));
  const boundaryCount = Math.max(1, Math.floor(params.boundaryCount || 1));

  if (totalPages <= boundaryCount * 2 + siblingCount * 2 + 3) {
    return range(1, totalPages).map((value) => ({ type: "page" as const, value }));
  }

  const leftBoundaryEnd = boundaryCount;
  const rightBoundaryStart = totalPages - boundaryCount + 1;
  const siblingStart = Math.max(
    Math.min(page - siblingCount, totalPages - boundaryCount - siblingCount * 2 - 1),
    leftBoundaryEnd + 2
  );
  const siblingEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    rightBoundaryStart - 2
  );

  const items: Array<{ type: "page"; value: number } | { type: "ellipsis"; key: string }> = [];

  for (const value of range(1, leftBoundaryEnd)) items.push({ type: "page", value });

  if (siblingStart > leftBoundaryEnd + 2) items.push({ type: "ellipsis", key: "left-ellipsis" });
  else if (siblingStart === leftBoundaryEnd + 2) items.push({ type: "page", value: leftBoundaryEnd + 1 });

  for (const value of range(siblingStart, siblingEnd)) items.push({ type: "page", value });

  if (siblingEnd < rightBoundaryStart - 2) items.push({ type: "ellipsis", key: "right-ellipsis" });
  else if (siblingEnd === rightBoundaryStart - 2) items.push({ type: "page", value: rightBoundaryStart - 1 });

  for (const value of range(rightBoundaryStart, totalPages)) items.push({ type: "page", value });

  return items;
};
