import type { AccessRole } from "../../../../../../packages/utils/src/collab";

export type RoleScope = "document" | "board";

export interface RoleLockStore {
  get(scope: RoleScope, entityId: string, sessionId: string): Promise<AccessRole | undefined>;
  set(scope: RoleScope, entityId: string, sessionId: string, role: AccessRole): Promise<void>;
  deleteScope(scope: RoleScope, entityId: string): Promise<void>;
}

export class MemoryRoleLockStore implements RoleLockStore {
  private readonly roles = new Map<string, AccessRole>();

  async get(scope: RoleScope, entityId: string, sessionId: string): Promise<AccessRole | undefined> {
    return this.roles.get(this.key(scope, entityId, sessionId));
  }

  async set(scope: RoleScope, entityId: string, sessionId: string, role: AccessRole): Promise<void> {
    this.roles.set(this.key(scope, entityId, sessionId), role);
  }

  async deleteScope(scope: RoleScope, entityId: string): Promise<void> {
    const prefix = `${scope}:${entityId}:`;
    for (const key of this.roles.keys()) {
      if (key.startsWith(prefix)) this.roles.delete(key);
    }
  }

  private key(scope: RoleScope, entityId: string, sessionId: string): string {
    return `${scope}:${entityId}:${sessionId}`;
  }
}

type RedisRoleClient = {
  hGet(key: string, field: string): Promise<string | null | undefined>;
  hSet(key: string, field: string, value: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(key: string): Promise<number>;
};

export class RedisRoleLockStore implements RoleLockStore {
  constructor(
    private readonly client: RedisRoleClient,
    private readonly ttlSeconds = 24 * 60 * 60
  ) {}

  async get(scope: RoleScope, entityId: string, sessionId: string): Promise<AccessRole | undefined> {
    const value = await this.client.hGet(this.key(scope, entityId), sessionId);
    return value === "editor" || value === "viewer" ? value : undefined;
  }

  async set(scope: RoleScope, entityId: string, sessionId: string, role: AccessRole): Promise<void> {
    const key = this.key(scope, entityId);
    await this.client.hSet(key, sessionId, role);
    await this.client.expire(key, this.ttlSeconds);
  }

  async deleteScope(scope: RoleScope, entityId: string): Promise<void> {
    await this.client.del(this.key(scope, entityId));
  }

  private key(scope: RoleScope, entityId: string): string {
    return `collab:role-lock:${scope}:${entityId}`;
  }
}
