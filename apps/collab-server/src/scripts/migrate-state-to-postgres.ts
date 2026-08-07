import path from "node:path";
import {
  FileStatePersistence,
  PostgresStatePersistence
} from "../features/workspace/persistence/state-persistence";

async function main(): Promise<void> {
  const databaseUrl = process.env.COLLAB_DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("COLLAB_DATABASE_URL is required.");

  const sourcePath = process.env.STATE_FILE_PATH?.trim() || path.resolve(process.cwd(), "data", "state.json");
  const source = new FileStatePersistence(sourcePath);
  const destination = new PostgresStatePersistence(databaseUrl);

  try {
    const state = await source.load();
    if (!state) throw new Error(`No Collab state was found at ${sourcePath}.`);
    await destination.save(state);
    console.info(
      `Migrated ${state.documents.length} documents and ${state.boards.length} boards to PostgreSQL.`
    );
  } finally {
    await destination.close();
  }
}

void main();
