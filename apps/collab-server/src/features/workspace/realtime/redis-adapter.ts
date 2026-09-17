import type { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { MemoryRoleLockStore, RedisRoleLockStore, type RoleLockStore } from "./role-lock-store";

export type RealtimeAdapterHandle = {
  roleLocks: RoleLockStore;
  close(): Promise<void>;
};

export async function configureRedisRealtimeAdapter(
  io: Server,
  redisUrl?: string
): Promise<RealtimeAdapterHandle> {
  if (!redisUrl) return { roleLocks: new MemoryRoleLockStore(), close: async () => undefined };

  const publisher = createClient({ url: redisUrl, socket: { reconnectStrategy: false } });
  const subscriber = publisher.duplicate();
  publisher.on("error", () => undefined);
  subscriber.on("error", () => undefined);
  try {
    await Promise.all([publisher.connect(), subscriber.connect()]);
  } catch {
    try {
      publisher.destroy();
    } catch {
      // The client may already be closed after a failed connection attempt.
    }
    try {
      subscriber.destroy();
    } catch {
      // The client may already be closed after a failed connection attempt.
    }
    return { roleLocks: new MemoryRoleLockStore(), close: async () => undefined };
  }
  io.adapter(createAdapter(publisher, subscriber));

  return {
    roleLocks: new RedisRoleLockStore(publisher),
    async close() {
      await Promise.allSettled([publisher.quit(), subscriber.quit()]);
    }
  };
}
