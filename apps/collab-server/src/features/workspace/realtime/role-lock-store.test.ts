import { MemoryRoleLockStore, RedisRoleLockStore } from "./role-lock-store";

describe("RoleLockStore", () => {
  it("메모리 모드에서 세션 역할을 잠그고 scope 단위로 삭제한다", async () => {
    const store = new MemoryRoleLockStore();

    await store.set("document", "doc-1", "session-1", "viewer");
    expect(await store.get("document", "doc-1", "session-1")).toBe("viewer");

    await store.deleteScope("document", "doc-1");
    expect(await store.get("document", "doc-1", "session-1")).toBeUndefined();
  });

  it("Redis 모드에서 역할 hash와 TTL을 함께 갱신한다", async () => {
    const values = new Map<string, Map<string, string>>();
    const client = {
      hGet: jest.fn(async (key: string, field: string) => values.get(key)?.get(field)),
      hSet: jest.fn(async (key: string, field: string, value: string) => {
        const hash = values.get(key) ?? new Map<string, string>();
        hash.set(field, value);
        values.set(key, hash);
        return 1;
      }),
      expire: jest.fn(async () => 1),
      del: jest.fn(async (key: string) => (values.delete(key) ? 1 : 0))
    };
    const store = new RedisRoleLockStore(client, 60);

    await store.set("board", "board-1", "session-1", "editor");

    expect(await store.get("board", "board-1", "session-1")).toBe("editor");
    expect(client.expire).toHaveBeenCalledWith("collab:role-lock:board:board-1", 60);

    await store.deleteScope("board", "board-1");
    expect(await store.get("board", "board-1", "session-1")).toBeUndefined();
  });
});
