export const buildInvitationLoginPath = (search: string): string =>
  `/login?next=${encodeURIComponent(`/invite${search.startsWith("?") ? search : ""}`)}`;
