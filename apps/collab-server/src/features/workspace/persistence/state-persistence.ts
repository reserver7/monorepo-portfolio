import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import type { DocumentRecord, WhiteboardRecord } from "../../../../../../packages/utils/src/collab/server";

export interface PersistedWorkspaceState {
  documents: DocumentRecord[];
  boards: WhiteboardRecord[];
  documentAccessKeys?: Record<string, string>;
  boardAccessKeys?: Record<string, string>;
}

export interface StatePersistence {
  load(): Promise<PersistedWorkspaceState | null>;
  save(state: PersistedWorkspaceState): Promise<void>;
  close?(): Promise<void>;
}

export class FileStatePersistence implements StatePersistence {
  constructor(private readonly dataFilePath: string) {}

  async load(): Promise<PersistedWorkspaceState | null> {
    await mkdir(path.dirname(this.dataFilePath), { recursive: true });
    try {
      return JSON.parse(await readFile(this.dataFilePath, "utf8")) as PersistedWorkspaceState;
    } catch {
      return null;
    }
  }

  async save(state: PersistedWorkspaceState): Promise<void> {
    await mkdir(path.dirname(this.dataFilePath), { recursive: true });
    const tempPath = `${this.dataFilePath}.tmp-${process.pid}-${Date.now()}`;
    await writeFile(tempPath, JSON.stringify(state, null, 2), "utf8");
    try {
      await rename(tempPath, this.dataFilePath);
    } catch (error) {
      await unlink(tempPath).catch(() => undefined);
      throw error;
    }
  }
}

export class PostgresStatePersistence implements StatePersistence {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 5 });
  }

  async load(): Promise<PersistedWorkspaceState | null> {
    await this.ensureSchema();
    const result = await this.pool.query<{ payload: PersistedWorkspaceState }>(
      "SELECT payload FROM collab_workspace_state WHERE id = 1"
    );
    return result.rows[0]?.payload ?? null;
  }

  async save(state: PersistedWorkspaceState): Promise<void> {
    await this.ensureSchema();
    await this.pool.query(
      `INSERT INTO collab_workspace_state (id, payload, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
      [JSON.stringify(state)]
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async ensureSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS collab_workspace_state (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }
}

export const createFileStatePersistence = (dataFilePath?: string): FileStatePersistence =>
  new FileStatePersistence(dataFilePath ?? path.resolve(process.cwd(), "data", "state.json"));
