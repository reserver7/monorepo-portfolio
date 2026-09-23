import { requestJson } from "@repo/react-query";

export const workspaceFavoritesQueryKey = ["workspace", "favorites"] as const;

export const getWorkspaceFavorites = (): Promise<{ favoriteKeys: string[] }> =>
  requestJson("", "/api/workspace/favorites", { method: "GET" });

export const setWorkspaceFavorites = (favoriteKeys: string[]): Promise<{ favoriteKeys: string[] }> =>
  requestJson("", "/api/workspace/favorites", {
    method: "PATCH",
    body: JSON.stringify({ favoriteKeys })
  });
