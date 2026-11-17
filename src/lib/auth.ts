/**
 * Server-side authentication & credential store.
 *
 * Backed by a local SQLite database (node:sqlite, Node >= 22).
 * Credentials are stored ONLY in hashed form:
 *   - Passwords: scrypt with a per-user random salt (timing-safe verification)
 *   - Sessions:  opaque random token; only its SHA-256 is persisted
 *
 * The database lives at <projectRoot>/nexusroute.db and is git-ignored.
 */
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AUTH_DB_PATH || path.join(__dirname, '..', '..', 'nexusroute.db');

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
  tier: 'Enterprise Scale' | 'Growth' | 'Developer';
  monthlyBudgetUsd: number;
  apiKey: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  organization: string;
  role: string;
  tier: 'Enterprise Scale' | 'Growth' | 'Developer';
  monthlyBudgetUsd: number;
  passwordHash: string;
  apiKey: string;
  createdAt: string;
}

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

let db: DatabaseSync | null = null;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }).toString('hex');
  return `scrypt$N=${SCRYPT_N}$r=${SCRYPT_R}$p=${SCRYPT_P}$${salt}$${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split('$');
    if (parts.length < 3) return false;
    if (parts[0] !== 'scrypt') return false;
    // Format: scrypt$N=...$r=...$p=...$salt$hash → salt is second-to-last, hash is last
    const salt = parts[parts.length - 2];
    const expectedHash = parts[parts.length - 1];
    if (!salt || !expectedHash) return false;
    const candidate = scryptSync(password, salt, 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
    const expected = Buffer.from(expectedHash, 'hex');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function toPublicUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    organization: row.organization,
    role: row.role,
    tier: row.tier,
    monthlyBudgetUsd: row.monthlyBudgetUsd,
    apiKey: row.apiKey,
  };
}

export interface SessionResult {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

function generateApiKey(): string {
  return `nx_live_${randomBytes(12).toString('hex')}`;
}

function insertUser(fields: {
  email: string;
  password: string;
  name?: string;
  organization?: string;
  role?: string;
  tier?: 'Enterprise Scale' | 'Growth' | 'Developer';
  monthlyBudgetUsd?: number;
}): AuthUser & { createdAt: string } {
  if (!db) throw new Error('Auth store not initialized');

  const cleanEmail = fields.email.trim().toLowerCase();
  const derivedName =
    fields.name?.trim() ||
    cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const row: UserRow = {
    id: `user-${randomBytes(8).toString('hex')}`,
    email: cleanEmail,
    name: derivedName,
    organization: fields.organization?.trim() || 'Acme Global Infrastructure',
    role: fields.role?.trim() || 'Staff AI Systems Architect',
    tier: fields.tier ?? 'Enterprise Scale',
    monthlyBudgetUsd: fields.monthlyBudgetUsd ?? 15000,
    passwordHash: hashPassword(fields.password),
    apiKey: generateApiKey(),
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO users (id, email, name, organization, role, tier, monthlyBudgetUsd, passwordHash, apiKey, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    row.id,
    row.email,
    row.name,
    row.organization,
    row.role,
    row.tier,
    row.monthlyBudgetUsd,
    row.passwordHash,
    row.apiKey,
    row.createdAt
  );

  return { ...toPublicUser(row), createdAt: row.createdAt };
}

export function initAuthStore(): void {
  if (db) return;
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      organization TEXT NOT NULL,
      role TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'Enterprise Scale',
      monthlyBudgetUsd REAL NOT NULL DEFAULT 15000,
      passwordHash TEXT NOT NULL,
      apiKey TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      tokenHash TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expiresAt);
  `);

  // Seed the two demo workspace accounts (documented in README/report)
  const seedDemoUser = (email: string, name: string, organization: string, role: string) => {
    const exists = db?.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!exists) {
      insertUser({
        email,
        password: 'demo1234',
        name,
        organization,
        role,
        tier: 'Enterprise Scale',
        monthlyBudgetUsd: 25000,
      });
    }
  };
  seedDemoUser('lead.engineer@acme-enterprise.io', 'Lead Engineer', 'Acme Global Infrastructure', 'Staff AI Systems Architect');
  seedDemoUser('alex.vance@cloud-vertex.ai', 'Alex Vance', 'Vertex AI Infrastructure Lab', 'Director of AI FinOps');
}

export function createUser(input: {
  email: string;
  password: string;
  name?: string;
  organization?: string;
  role?: string;
}): { user: AuthUser } | { error: string } {
  if (!db) return { error: 'Authentication store is unavailable.' };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const email = input.email.trim().toLowerCase();
  if (!emailPattern.test(email)) {
    return { error: 'A valid email address is required.' };
  }
  if (!input.password || input.password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }
  if (input.password.length > 128) {
    return { error: 'Password must be at most 128 characters long.' };
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) {
    return { error: 'An account with this email already exists.' };
  }

  const user = insertUser({
    email,
    password: input.password,
    name: input.name,
    organization: input.organization,
    role: input.role,
  });

  return { user };
}

export function authenticateUser(
  email: string,
  password: string
): { user: AuthUser } | null {
  if (!db) return null;
  const cleanEmail = email.trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as unknown as UserRow | undefined;
  if (!row) {
    // Constant-work path so timing does not reveal whether the account exists
    scryptSync(password || 'dummy', randomBytes(16).toString('hex'), 64, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
    return null;
  }
  if (!verifyPassword(password, row.passwordHash)) {
    return null;
  }
  return { user: toPublicUser(row) };
}

export function createSession(userId: string): SessionResult | null {
  if (!db) return null;
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as UserRow | undefined;
  if (!row) return null;

  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Purge expired sessions opportunistically
  db.prepare('DELETE FROM sessions WHERE expiresAt < ?').run(new Date(now).toISOString());

  db.prepare('INSERT INTO sessions (tokenHash, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)').run(
    sha256(token),
    userId,
    new Date(now).toISOString(),
    expiresAt
  );

  return { token, expiresAt, user: toPublicUser(row) };
}

export function getUserForToken(token: string): { user: AuthUser } | null {
  if (!db || !token) return null;
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.userId
       WHERE s.tokenHash = ? AND s.expiresAt > ?`
    )
    .get(sha256(token), new Date().toISOString()) as unknown as UserRow | undefined;
  if (!row) return null;
  return { user: toPublicUser(row) };
}

export function destroySession(token: string): void {
  if (!db || !token) return;
  db.prepare('DELETE FROM sessions WHERE tokenHash = ?').run(sha256(token));
}

export function getPasswordHashForDebug(email: string): string | null {
  if (!db) return null;
  const row = db.prepare('SELECT passwordHash FROM users WHERE email = ?').get(email.trim().toLowerCase()) as unknown as
    | { passwordHash: string }
    | undefined;
  return row?.passwordHash ?? null;
}
