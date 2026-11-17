/**
 * Persistent rate-limit + cache store.
 *
 * Uses SQLite (node:sqlite) so the counters and cached analyses survive
 * restarts and are shared by every instance running against the same DB file.
 * Set DISTRIBUTED_STORE=redis and install redis to scale to multiple hosts.
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AUTH_DB_PATH || path.join(__dirname, '..', '..', 'nexusroute.db');
const MAX_KEYS = 10_000;

let db: DatabaseSync | null = null;
let checkedRedis = false;
let redisClient: any = null;

function getDb(): DatabaseSync {
  if (db) return db;
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT NOT NULL,
      bucket TEXT NOT NULL,
      resetAt INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (key, bucket)
    );
    CREATE TABLE IF NOT EXISTS analysis_cache (
      key TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      expiresAt INTEGER NOT NULL
    );
  `);
  return db;
}

// ---------------------------------------------------------------------------
// Redis optional backend (same API surface)
// ---------------------------------------------------------------------------
async function tryRedis(): Promise<boolean> {
  if (checkedRedis) return !!redisClient;
  checkedRedis = true;
  if (!process.env.REDIS_URL) return false;
  try {
    // @ts-ignore — only present when user installs redis
    const mod = await import('redis');
    const client = (mod as any).createClient({ url: process.env.REDIS_URL });
    client.on('error', (err: any) => console.error('[distributedStore] redis error:', err.message));
    await client.connect();
    redisClient = client;
    return true;
  } catch (err) {
    console.error('[distributedStore] Redis unavailable, falling back to SQLite:', (err as any)?.message);
    redisClient = null;
    return false;
  }
}

export async function initDistributedStore(): Promise<'sqlite' | 'redis'> {
  if (await tryRedis()) return 'redis';
  getDb();
  return 'sqlite';
}

// ---------------------------------------------------------------------------
// Rate limiting — fixed-window, persistent
// ---------------------------------------------------------------------------
interface HitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function hitRateLimit(key: string, bucket: string, max: number, windowMs: number): Promise<HitResult> {
  if (redisClient) {
    const rKey = `ratelimit:${bucket}:${key}`;
    const ttlSeconds = Math.ceil(windowMs / 1000);
    const count = await redisClient.incr(rKey);
    if (count === 1) await redisClient.expire(rKey, ttlSeconds);
    if (count > max) {
      const pttl = await redisClient.pTTL(rKey);
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(pttl / 1000)) };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const database = getDb();
  const now = Date.now();
  const ttlEnd = now + windowMs;

  const row = database.prepare(
    'SELECT count, resetAt FROM rate_limits WHERE key = ? AND bucket = ?'
  ).get(key, bucket) as { count: number; resetAt: number } | undefined;

  if (!row || row.resetAt <= now) {
    database.prepare(
      'INSERT OR REPLACE INTO rate_limits (key, bucket, resetAt, count) VALUES (?, ?, ?, 1)'
    ).run(key, bucket, ttlEnd);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const newCount = row.count + 1;
  if (newCount > max) {
    database.prepare('UPDATE rate_limits SET count = ? WHERE key = ? AND bucket = ?').run(newCount, key, bucket);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt - now) / 1000)) };
  }

  database.prepare('UPDATE rate_limits SET count = ? WHERE key = ? AND bucket = ?').run(newCount, key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function sweepExpiredRateLimits(): void {
  try {
    getDb().prepare('DELETE FROM rate_limits WHERE resetAt <= ?').run(Date.now());
    getDb().prepare('DELETE FROM analysis_cache WHERE expiresAt <= ?').run(Date.now());
  } catch (err) {
    console.error('[distributedStore] sweep failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Analysis cache — persistent LRU-ish by TTL
// ---------------------------------------------------------------------------
export async function cacheGetAnalysis(key: string): Promise<any | undefined> {
  if (redisClient) {
    const raw = await redisClient.get(`analysis:${key}`);
    if (!raw) return undefined;
    try { return JSON.parse(raw); } catch { return undefined; }
  }
  const database = getDb();
  const row = database.prepare('SELECT json FROM analysis_cache WHERE key = ? AND expiresAt > ?').get(key, Date.now()) as
    | { json: string }
    | undefined;
  if (!row) return undefined;
  try {
    return JSON.parse(row.json);
  } catch {
    return undefined;
  }
}

export async function cachePutAnalysis(key: string, value: any, ttlMs: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (redisClient) {
    await redisClient.set(`analysis:${key}`, serialized, { PX: ttlMs });
    return;
  }
  const database = getDb();
  database
    .prepare('INSERT OR REPLACE INTO analysis_cache (key, json, expiresAt) VALUES (?, ?, ?)')
    .run(key, serialized, Date.now() + ttlMs);
  // bound the table
  const count = (database.prepare('SELECT COUNT(*) as c FROM analysis_cache').get() as { c: number }).c;
  if (count > MAX_KEYS) {
    database
      .prepare('DELETE FROM analysis_cache WHERE expiresAt IN (SELECT expiresAt FROM analysis_cache ORDER BY expiresAt ASC LIMIT ?)')
      .run(count - MAX_KEYS);
  }
}

// ---------------------------------------------------------------------------
// Metrics helpers
// ---------------------------------------------------------------------------
export function distributedStoreStats() {
  if (redisClient) {
    return { backend: 'redis' as const, url: process.env.REDIS_URL };
  }
  try {
    const database = getDb();
    const rateRows = (database.prepare('SELECT COUNT(*) as c FROM rate_limits').get() as { c: number }).c;
    const cacheRows = (database.prepare('SELECT COUNT(*) as c FROM analysis_cache').get() as { c: number }).c;
    return { backend: 'sqlite' as const, rateLimitBuckets: rateRows, analysisCacheEntries: cacheRows };
  } catch {
    return { backend: 'sqlite' as const, error: 'stats unavailable' };
  }
}
