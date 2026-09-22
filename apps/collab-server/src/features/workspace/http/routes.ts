export const API_ROUTES = {
  health: "/health",
  realtimeToken: "/api/session/realtime-token",
  documents: "/api/documents",
  documentById: "/api/documents/:id",
  documentHistory: "/api/documents/:id/history",
  documentComments: "/api/documents/:id/comments",
  documentMembers: "/api/documents/:id/members",
  boards: "/api/boards",
  boardById: "/api/boards/:id",
  boardMembers: "/api/boards/:id/members"
} as const;
