export const buildInvitationLoginPath = (search: string): string =>
  `/login?mode=signup&next=${encodeURIComponent(`/invite${search.startsWith("?") ? search : ""}`)}`;
