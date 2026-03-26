import { createClientEnv } from "@repo/collab-client";

export const whiteboardClientEnv = {
  ...createClientEnv(process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_DEFAULT_BOARD_ROLE)
};
