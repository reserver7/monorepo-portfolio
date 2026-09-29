export type SaveRecoveryRole = "viewer" | "editor";
export type SaveRecoveryConnection = "connecting" | "online" | "offline";

export const shouldOfferSaveRetry = (role: SaveRecoveryRole, connection: SaveRecoveryConnection): boolean =>
  role === "editor" && connection === "offline";
