export const API_ROUTES = {
  health: "/health",
  documents: "/api/documents",
  documentById: "/api/documents/:id",
  documentHistory: "/api/documents/:id/history",
  documentComments: "/api/documents/:id/comments",
  boards: "/api/boards",
  boardById: "/api/boards/:id"
} as const;
