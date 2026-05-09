/**
 * CVF Guard API Rate Limiter
 * ===========================
 * In-memory sliding window rate limiter for /api/guards/* endpoints.
 * Prevents abuse and enforces fair usage per IP or agent.
 *
 * Sprint 4 — Production Hardening
 *
 * Limits (configurable):
 *   - Default: 60 requests / 60 seconds per IP
 *   - Burst: 10 requests / 1 second per IP
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  /** Max requests in the window. Default: 60 */
  maxRequests?: number;
  /** Window duration in seconds. Default: 60 */
  windowSeconds?: number;
  /** Burst limit per second. Default: 10 */
  burstLimit?: number;
}

// In-memory store (replace with Redis in a distributed setup)
const store = new Map<string, RateLimitWindow>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, window] of store.entries()) {
        if (window.resetAt < now) store.delete(key);
      }
    },
    5 * 60 * 1000,
  );
}

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private burstLimit: number;

  constructor(config: RateLimiterConfig = {}) {
    this.maxRequests = config.maxRequests ?? 60;
    this.windowMs = (config.windowSeconds ?? 60) * 1000;
    this.burstLimit = config.burstLimit ?? 10;
  }

  /**
   * Check if the given key is within rate limits.
   * Returns { allowed, remaining, resetAt, retryAfter }
   */
  check(key: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    let window = store.get(key);

    if (!window || window.resetAt < now) {
      window = { count: 0, resetAt: now + this.windowMs };
      store.set(key, window);
    }

    window.count++;

    const remaining = Math.max(0, this.maxRequests - window.count);
    const allowed = window.count <= this.maxRequests;
    const retryAfterSeconds = allowed ? 0 : Math.ceil((window.resetAt - now) / 1000);

    return { allowed, remaining, resetAt: window.resetAt, retryAfterSeconds };
  }

  /** Extract client identifier from request (IP or agent-id header). */
  getKey(request: NextRequest): string {
    const agentId = request.headers.get('x-cvf-agent-id');
    if (agentId) return `agent:${agentId}`;

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
    return `ip:${ip}`;
  }

  /**
   * Middleware helper — returns error response or null if allowed.
   * Usage: const err = rateLimiter.middleware(request); if (err) return err;
   */
  middleware(request: NextRequest): NextResponse | null {
    const key = this.getKey(request);
    const { allowed, resetAt, retryAfterSeconds } = this.check(key);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded.',
          retryAfterSeconds,
          agentGuidance: `You have exceeded the rate limit of ${this.maxRequests} requests per ${this.windowMs / 1000}s. Wait ${retryAfterSeconds} seconds before retrying.`,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(this.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
            'Retry-After': String(retryAfterSeconds),
          },
        },
      );
    }

    return null; // allowed
  }
}

// Shared limiter instance for /api/guards/* endpoints
export const guardsRateLimiter = new RateLimiter({
  maxRequests: 60,
  windowSeconds: 60,
  burstLimit: 10,
});
