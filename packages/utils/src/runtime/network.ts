export const isLocalHost = (hostname: string): boolean => {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
};
