import * as SQLite from 'expo-sqlite';

const DB_NAME = 'cheche_offline.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS pending_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid TEXT NOT NULL UNIQUE,
      order_number TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      synced INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT,
      server_invoice_number TEXT,
      server_irn TEXT,
      synced_note TEXT,
      payload TEXT NOT NULL,
      payments TEXT NOT NULL,
      receipt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pending_sales_status ON pending_sales(status);
    CREATE TABLE IF NOT EXISTS offline_products (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      name TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await migratePendingSalesColumns(db);
  return db;
}

/** Add columns to pre-existing pending_sales tables (created before these columns existed). */
async function migratePendingSalesColumns(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(pending_sales)`);
  const names = new Set(columns.map((c) => c.name));

  if (!names.has('synced')) {
    await db.execAsync(`ALTER TABLE pending_sales ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`);
    await db.execAsync(`UPDATE pending_sales SET synced = 1 WHERE status = 'SYNCED'`);
  }
  if (!names.has('synced_note')) {
    await db.execAsync(`ALTER TABLE pending_sales ADD COLUMN synced_note TEXT`);
  }
}

/** Shared handle to the offline SQLite database (opened + migrated once). */
export function getOfflineDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

/** Open + migrate the database eagerly (e.g. at app start). Safe to call repeatedly. */
export async function ensureOfflineDb(): Promise<void> {
  await getOfflineDatabase();
}
