import Redis from 'ioredis';

/**
 * Redis client singleton for caching.
 *
 * Used for:
 *  - Google Places Autocomplete cache  (prefix: gp:ac:)
 *  - Google Place Details cache         (prefix: gp:pd:)
 *  - Restaurant list cache              (prefix: rest:)
 *
 * Falls back gracefully when Redis is not available.
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;
let connectionFailed = false;

function getRedis(): Redis | null {
  if (connectionFailed) return null;
  if (redis) return redis;

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 2) {
          connectionFailed = true;
          console.warn('[Redis] Connection failed — caching disabled, falling through to API');
          return null;
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      if (!connectionFailed) {
        console.warn('[Redis] Error:', err.message);
      }
    });

    redis.on('connect', () => {
      connectionFailed = false;
      console.log('[Redis] Connected');
    });

    // Attempt connection without blocking
    redis.connect().catch(() => {
      connectionFailed = true;
    });

    return redis;
  } catch {
    connectionFailed = true;
    return null;
  }
}

/* ── Cache helpers ─────────────────────────── */

const TTL = {
  GOOGLE_AUTOCOMPLETE: 60 * 60,          // 1 hour
  GOOGLE_PLACE_DETAILS: 60 * 60 * 24,    // 24 hours
  RESTAURANT_LIST: 5 * 60,               // 5 minutes
  DISH_LIST: 5 * 60,                     // 5 minutes
} as const;

/**
 * Get a cached value. Returns null on miss or if Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with TTL (seconds).
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // silently ignore
  }
}

/**
 * Delete a cached value (or pattern).
 */
export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // silently ignore
  }
}

/* ── Typed cache keys ────────────────────────── */

export function googleAutocompleteCacheKey(input: string, types: string, lat?: string, lng?: string): string {
  const locPart = lat && lng ? `:${parseFloat(lat).toFixed(2)},${parseFloat(lng).toFixed(2)}` : '';
  return `gp:ac:${types}:${input.toLowerCase().trim()}${locPart}`;
}

export function googlePlaceDetailsCacheKey(placeId: string): string {
  return `gp:pd:${placeId}`;
}

export function restaurantListCacheKey(): string {
  return 'rest:all';
}

export function dishListCacheKey(): string {
  return 'dish:all';
}

export { TTL };
