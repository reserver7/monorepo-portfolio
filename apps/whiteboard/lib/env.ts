import { createClientEnv } from "@repo/shared-client";

export const whiteboardClientEnv = createClientEnv(
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_DEFAULT_BOARD_ROLE
);
