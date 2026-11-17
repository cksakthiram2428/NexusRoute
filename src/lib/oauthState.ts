/**
 * Short-lived OAuth state tokens for CSRF protection on the Google
 * authorization-code flow. In-memory only — valid for a few minutes,
 * single-process. Cleared on restart.
 */
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_STATES = 1000;
const states = new Map<string, number>(); // state -> expiresAt

function prune(): void {
  const now = Date.now();
  for (const [key, expiresAt] of states) {
    if (expiresAt <= now) states.delete(key);
  }
  if (states.size > MAX_STATES) {
    const sorted = [...states.entries()].sort((a, b) => a[1] - b[1]);
    for (const [key] of sorted.slice(0, states.size - MAX_STATES)) {
      states.delete(key);
    }
  }
}

export function issueState(state: string): void {
  prune();
  states.set(state, Date.now() + STATE_TTL_MS);
}

export function consumeState(state: string | undefined): boolean {
  prune();
  if (!state) return false;
  const expiresAt = states.get(state);
  if (!expiresAt) return false;
  states.delete(state);
  return expiresAt > Date.now();
}
