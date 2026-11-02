import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

export type FavoriteRecord = { pokemon_id: number; created_at: number };

let database: Promise<SQLiteDatabase> | undefined;
let operations: Promise<unknown> = Promise.resolve();

async function openDatabase() {
  if (!database) {
    database = (async () => {
      const db = await openDatabaseAsync('pokedex.db');
      try {
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS favorites (
            pokemon_id INTEGER PRIMARY KEY NOT NULL CHECK (pokemon_id > 0),
            created_at INTEGER NOT NULL CHECK (created_at >= 0)
          );
        `);
        return db;
      } catch (error) {
        await db.closeAsync().catch(() => undefined);
        throw error;
      }
    })().catch((error: unknown) => {
      database = undefined;
      throw error;
    });
  }
  return database;
}

// All reads and writes share this queue, so no async read can enter a write transaction.
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = operations.then(operation);
  operations = result.catch(() => undefined);
  return result;
}

async function readRecords(db: SQLiteDatabase): Promise<FavoriteRecord[]> {
  const records = await db.getAllAsync<FavoriteRecord>('SELECT pokemon_id, created_at FROM favorites ORDER BY created_at DESC, pokemon_id ASC');
  if (records.some((record) => !Number.isSafeInteger(record.pokemon_id) || record.pokemon_id <= 0 || !Number.isSafeInteger(record.created_at) || record.created_at < 0)) {
    throw new Error('The saved favorites could not be read. Please retry.');
  }
  return records;
}

export function getFavorites(): Promise<FavoriteRecord[]> {
  return enqueue(async () => {
    try {
      return await readRecords(await openDatabase());
    } catch {
      throw new Error('Favorites could not load from this phone. Please retry.');
    }
  });
}

/** Set an explicit target state so Retry cannot accidentally invert a successful write. */
export function setFavorite(id: number, saved: boolean): Promise<FavoriteRecord[]> {
  if (!Number.isSafeInteger(id) || id <= 0) return Promise.reject(new Error('This Pokemon cannot be saved.'));
  return enqueue(async () => {
    try {
      const db = await openDatabase();
      await db.execAsync('BEGIN IMMEDIATE');
      try {
        if (saved) {
          await db.runAsync('INSERT INTO favorites (pokemon_id, created_at) VALUES (?, ?) ON CONFLICT(pokemon_id) DO NOTHING', id, Date.now());
        } else {
          await db.runAsync('DELETE FROM favorites WHERE pokemon_id = ?', id);
        }
        const records = await readRecords(db);
        await db.execAsync('COMMIT');
        return records;
      } catch (error) {
        try {
          await db.execAsync('ROLLBACK');
        } catch {
          // Reopening a failed connection is safe; never delete the database to recover.
          await db.closeAsync().catch(() => undefined);
          database = undefined;
        }
        throw error;
      }
    } catch {
      throw new Error(saved ? 'This Pokemon could not be saved. Please retry.' : 'This Pokemon could not be removed from favorites. Please retry.');
    }
  });
}
