/**
 * Simple in-memory cache for HubSpot contact data.
 *
 * Prevents repeated API calls for the same contact data and helps
 * stay within HubSpot API rate limits.
 *
 * TTL defaults to 60 seconds for contacts, 5 minutes for contact lists.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class HubSpotCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxEntries = 500;

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Invalidate a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching a prefix
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Cache key builders
export const cacheKeys = {
  contact: (id: string) => `contact:${id}`,
  contactList: (limit: number, after?: string) =>
    `contacts:list:${limit}:${after || 'start'}`,
};

// TTL constants (seconds)
export const CACHE_TTL = {
  CONTACT: 60, // 1 minute for individual contacts
  CONTACT_LIST: 300, // 5 minutes for contact lists
};

export const hubspotCache = new HubSpotCache();
