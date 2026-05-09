/**
 * Rate Limiter — In-memory sliding window rate limiting.
 *
 * Prevents abuse by limiting requests per time window.
 * Supports per-IP and per-user rate limiting.
 */

interface RateLimitEntry {
  timestamps: number[]
  blocked: boolean
  blockedUntil: number
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  blockDurationMs: number // How long to block after exceeding
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  blockDurationMs: 5 * 60 * 1000, // 5 minute block
}

const API_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
  blockDurationMs: 10 * 60 * 1000,
}

const AI_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 10,
  blockDurationMs: 15 * 60 * 1000,
}

export const RATE_LIMIT_PRESETS = {
  default: DEFAULT_CONFIG,
  api: API_CONFIG,
  ai: AI_CONFIG,
} as const

// ─── Rate Limiter Class ─────────────────────────────────────

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = DEFAULT_CONFIG) {
    this.config = config
  }

  /**
   * Check if a request is allowed for the given key.
   * Returns { allowed, remaining, retryAfterMs }
   */
  check(key: string): {
    allowed: boolean
    remaining: number
    retryAfterMs?: number
  } {
    const now = Date.now()
    let entry = this.store.get(key)

    // Create new entry if doesn't exist
    if (!entry) {
      entry = { timestamps: [], blocked: false, blockedUntil: 0 }
      this.store.set(key, entry)
    }

    // Check if currently blocked
    if (entry.blocked && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.blockedUntil - now,
      }
    }

    // Unblock if block period has passed
    if (entry.blocked && now >= entry.blockedUntil) {
      entry.blocked = false
      entry.timestamps = []
    }

    // Clean old timestamps outside window
    const windowStart = now - this.config.windowMs
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

    // Check if over limit
    if (entry.timestamps.length >= this.config.maxRequests) {
      entry.blocked = true
      entry.blockedUntil = now + this.config.blockDurationMs
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: this.config.blockDurationMs,
      }
    }

    // Record this request
    entry.timestamps.push(now)

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.timestamps.length,
    }
  }

  /** Reset rate limit for a specific key */
  reset(key: string): void {
    this.store.delete(key)
  }

  /** Clean up expired entries to prevent memory leaks */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      const windowStart = now - this.config.windowMs
      const hasRecentActivity = entry.timestamps.some((t) => t > windowStart)
      const isBlocked = entry.blocked && now < entry.blockedUntil

      if (!hasRecentActivity && !isBlocked) {
        this.store.delete(key)
      }
    }
  }
}

// ─── Singleton Instances ────────────────────────────────────

export const apiLimiter = new RateLimiter(API_CONFIG)
export const aiLimiter = new RateLimiter(AI_CONFIG)
export const defaultLimiter = new RateLimiter(DEFAULT_CONFIG)
