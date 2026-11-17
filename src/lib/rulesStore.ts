/**
 * SQLite-backed persistence for the governance routing rules engine.
 * Source of truth at runtime is the in-memory array; SQLite mirrors it so
 * rules survive restarts and deploys.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RoutingRule } from '../types/router';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AUTH_DB_PATH || path.join(__dirname, '..', '..', 'nexusroute.db');

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS routing_rules (
      id TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  return db;
}

/** Load all rules from SQLite, or seed the built-in defaults if the table is empty. */
export function loadOrSeedRoutingRules(defaults: RoutingRule[]): RoutingRule[] {
  try {
    const database = getDb();
    const rows = database.prepare('SELECT json FROM routing_rules ORDER BY json').all() as { json: string }[];
    if (rows.length > 0) {
      return rows
        .map((r) => {
          try {
            return JSON.parse(r.json) as RoutingRule;
          } catch {
            return null;
          }
        })
        .filter((r): r is RoutingRule => r !== null)
        .sort((a, b) => a.priority - b.priority);
    }
    // First boot: persist the defaults
    const now = new Date().toISOString();
    const insert = database.prepare('INSERT OR REPLACE INTO routing_rules (id, json, updatedAt) VALUES (?, ?, ?)');
    for (const rule of defaults) {
      insert.run(rule.id, JSON.stringify(rule), rule.updatedAt || now);
    }
    return defaults;
  } catch (err) {
    console.error('Failed to load routing rules from SQLite — using in-memory defaults:', err);
    return defaults;
  }
}

export function saveRuleToDb(rule: RoutingRule): void {
  try {
    getDb().prepare('INSERT OR REPLACE INTO routing_rules (id, json, updatedAt) VALUES (?, ?, ?)').run(
      rule.id,
      JSON.stringify(rule),
      rule.updatedAt
    );
  } catch (err) {
    console.error('Failed to persist routing rule:', err);
  }
}

export function deleteRuleFromDb(id: string): void {
  try {
    getDb().prepare('DELETE FROM routing_rules WHERE id = ?').run(id);
  } catch (err) {
    console.error('Failed to delete routing rule from SQLite:', err);
  }
}
