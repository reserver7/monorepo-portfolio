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

  const publisher = createClient({ url: redisUrl });
  const subscriber = publisher.duplicate();
  await Promise.all([publisher.connect(), subscriber.connect()]);
  io.adapter(createAdapter(publisher, subscriber));

  return {
    roleLocks: new RedisRoleLockStore(publisher),
    async close() {
      await Promise.allSettled([publisher.quit(), subscriber.quit()]);
    }
  };
}
