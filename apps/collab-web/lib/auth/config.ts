export const COLLAB_AUTH_COOKIE = "collab.auth";

export function requiredAuthEnv(name: "OPSLENS_WEB_URL" | "OPSLENS_AUTH_BRIDGE_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.replace(/\/$/, "");
}

export function isProtectedPath(pathname: string): boolean {
  return pathname === "/docs" || pathname.startsWith("/docs/") || pathname === "/whiteboard" || pathname.startsWith("/whiteboard/");
}
