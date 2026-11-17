/**
 * Load manager — protects the single Node process from overload.
 *
 * Layers:
 *  1. Admission control (503 + Retry-After when the HTTP active count is full)
 *  2. LLM concurrency gate (bounds concurrent model calls; overflow -> LLM_BUSY)
 *  3. Circuit breakers (fail fast when a provider is unhealthy)
 *  4. Short-TTL LRU cache for repeated analysis work
 *  5. Status endpoint telemetry for the control plane
 */
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Admission control
// ---------------------------------------------------------------------------
const MAX_CONCURRENT = Math.max(1, Number(process.env.LOAD_MAX_CONCURRENT || 40));
let active = 0;
let peakActive = 0;
let shedCount = 0;

export function loadShedder(req: Request, res: Response, next: NextFunction) {
  if (active >= MAX_CONCURRENT) {
    shedCount++;
    res.set('Retry-After', '5');
    return res.status(503).json({
      error: 'Service temporarily busy. Please retry shortly.',
      code: 'OVERLOADED',
    });
  }

  active++;
  peakActive = Math.max(peakActive, active);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    active--;
  };
  res.on('finish', release);
  res.on('close', release);
  next();
}

// ---------------------------------------------------------------------------
// LLM concurrency gate
// ---------------------------------------------------------------------------
export class GateFullError extends Error {
  code = 'LLM_BUSY';
  constructor(message = 'Model fleet saturated') {
    super(message);
    this.name = 'GateFullError';
  }
}

interface GateWaiter {
  release: () => void;
  timer: ReturnType<typeof setTimeout>;
}

class ConcurrencyGate {
  private active = 0;
  private waiting: GateWaiter[] = [];
  private _shedCount = 0;

  constructor(
    private readonly max: number,
    private readonly maxQueue: number,
    private readonly acquireTimeoutMs: number
  ) {}

  get activeCount(): number {
    return this.active;
  }

  get queueLength(): number {
    return this.waiting.length;
  }

  get shedCount(): number {
    return this._shedCount;
  }

  async tryRun<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active < this.max) {
      this.active++;
      try {
        return await fn();
      } finally {
        this.active--;
        this.pump();
      }
    }

    if (this.waiting.length >= this.maxQueue) {
      this._shedCount++;
      throw new GateFullError('Model fleet is saturated. Retry in a few seconds.');
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.waiting.findIndex((w) => w.timer === timer);
        if (index >= 0) {
          this.waiting.splice(index, 1);
          this._shedCount++;
          reject(new GateFullError('Timed out waiting for a model slot. Retry shortly.'));
        } else {
          reject(new GateFullError('Model fleet is saturated. Retry in a few seconds.'));
        }
      }, this.acquireTimeoutMs);

      this.waiting.push({ release: resolve, timer });
    });

    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      this.pump();
    }
  }

  private pump(): void {
    const next = this.waiting.shift();
    if (next) {
      clearTimeout(next.timer);
      next.release();
    }
  }
}

const LLM_MAX_CONCURRENT = Math.max(1, Number(process.env.LOAD_LLM_CONCURRENT || 8));
const LLM_MAX_QUEUE = Math.max(1, Number(process.env.LOAD_LLM_QUEUE || 20));
const LLM_ACQUIRE_TIMEOUT_MS = Math.max(100, Number(process.env.LOAD_LLM_ACQUIRE_TIMEOUT_MS || 5000));

export const llmGate = new ConcurrencyGate(LLM_MAX_CONCURRENT, LLM_MAX_QUEUE, LLM_ACQUIRE_TIMEOUT_MS);

// ---------------------------------------------------------------------------
// Circuit breakers (fail fast on unhealthy providers)
// ---------------------------------------------------------------------------
export class CircuitBreaker {
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(
    public readonly name: string,
    private readonly threshold: number,
    private readonly cooldownMs: number
  ) {}

  isOpen(): boolean {
    if (this.openedAt === 0) return false;
    if (Date.now() - this.openedAt < this.cooldownMs) return true;
    // cooldown elapsed — half-open: reset and allow one attempt through
    this.openedAt = 0;
    this.consecutiveFailures = 0;
    return false;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = 0;
  }

  recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.threshold) {
      this.openedAt = Date.now();
    }
  }

  stats() {
    return {
      name: this.name,
      consecutiveFailures: this.consecutiveFailures,
      open: this.isOpen(),
      cooldownMs: this.cooldownMs,
    };
  }
}

const CB_THRESHOLD = Math.max(1, Number(process.env.CIRCUIT_BREAKER_THRESHOLD || 5));
const CB_COOLDOWN_MS = Math.max(1000, Number(process.env.CIRCUIT_BREAKER_COOLDOWN_MS || 30_000));

export const geminiBreaker = new CircuitBreaker('gemini-cloud', CB_THRESHOLD, CB_COOLDOWN_MS);
export const groqBreaker = new CircuitBreaker('groq-lpu', CB_THRESHOLD, CB_COOLDOWN_MS);

// ---------------------------------------------------------------------------
// Short-TTL LRU cache for repeated routing analysis
// ---------------------------------------------------------------------------
class LruCache<V> {
  private map = new Map<string, { value: V; expiresAt: number }>();

  constructor(private readonly maxEntries: number, private readonly ttlMs: number) {}

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  stats() {
    return { entries: this.map.size, maxEntries: this.maxEntries, ttlMs: this.ttlMs };
  }
}

const CACHE_MAX_ENTRIES = Math.max(10, Number(process.env.LOAD_CACHE_MAX_ENTRIES || 200));
const CACHE_TTL_MS = Math.max(1000, Number(process.env.LOAD_CACHE_TTL_MS || 60_000));

export const analysisCache = new LruCache<any>(CACHE_MAX_ENTRIES, CACHE_TTL_MS);

// ---------------------------------------------------------------------------
// Status telemetry
// ---------------------------------------------------------------------------
export function getLoadStatus() {
  const memory = process.memoryUsage();
  return {
    status: active >= MAX_CONCURRENT ? 'saturated' : 'healthy',
    activeRequests: active,
    peakConcurrent: peakActive,
    shedRequestsTotal: shedCount,
    maxConcurrent: MAX_CONCURRENT,
    llmGate: {
      active: llmGate.activeCount,
      queued: llmGate.queueLength,
      shedCount: llmGate.shedCount,
      max: LLM_MAX_CONCURRENT,
      queueCapacity: LLM_MAX_QUEUE,
    },
    breakers: [geminiBreaker.stats(), groqBreaker.stats()],
    cache: analysisCache.stats(),
    memory: {
      heapUsedMB: Math.round(memory.heapUsed / 1_048_576),
      heapTotalMB: Math.round(memory.heapTotal / 1_048_576),
      rssMB: Math.round(memory.rss / 1_048_576),
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
