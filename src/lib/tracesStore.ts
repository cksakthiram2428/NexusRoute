/**
 * SQLite-backed persistence for the request audit ledger.
 * Mirrors the in-memory trace history; traces survive restarts and deploys.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExecutionTrace } from '../types/router';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AUTH_DB_PATH || path.join(__dirname, '..', '..', 'nexusroute.db');
const MAX_TRACES = 1000;

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS traces (
      id TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_traces_created ON traces(createdAt);
  `);
  return db;
}

export function loadOrSeedTraces(seedTraces: ExecutionTrace[]): ExecutionTrace[] {
  try {
    const database = getDb();
    const rows = database
      .prepare('SELECT json FROM traces ORDER BY createdAt DESC LIMIT ?')
      .all(MAX_TRACES) as { json: string }[];

    if (rows.length > 0) {
      return rows
        .map((r) => {
          try {
            return JSON.parse(r.json) as ExecutionTrace;
          } catch {
            return null;
          }
        })
        .filter((t): t is ExecutionTrace => t !== null);
    }

    // First boot: persist seeds
    const insert = database.prepare(
      'INSERT OR REPLACE INTO traces (id, json, createdAt) VALUES (?, ?, ?)'
    );
    for (const trace of seedTraces) {
      insert.run(trace.id, JSON.stringify(trace), trace.timestamp);
    }
    return seedTraces.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (err) {
    console.error('Failed to load traces from SQLite — using in-memory seeds:', err);
    return seedTraces.slice();
  }
}

export function insertTrace(trace: ExecutionTrace): void {
  try {
    const database = getDb();
    database
      .prepare('INSERT OR REPLACE INTO traces (id, json, createdAt) VALUES (?, ?, ?)')
      .run(trace.id, JSON.stringify(trace), trace.timestamp);

    // Keep the table bounded
    const count = database.prepare('SELECT COUNT(*) as c FROM traces').get() as { c: number };
    if (count && count.c > MAX_TRACES) {
      database
        .prepare(
          `DELETE FROM traces WHERE id IN (
            SELECT id FROM traces ORDER BY createdAt ASC LIMIT ?
          )`
        )
        .run(count.c - MAX_TRACES);
    }
  } catch (err) {
    console.error('Failed to persist trace:', err);
  }
}

/** Persist the manual override applied to a trace. */
export function updateTrace(trace: ExecutionTrace): void {
  try {
    getDb()
      .prepare('INSERT OR REPLACE INTO traces (id, json, createdAt) VALUES (?, ?, ?)')
      .run(trace.id, JSON.stringify(trace), trace.timestamp);
  } catch (err) {
    console.error('Failed to update persisted trace:', err);
  }
}
