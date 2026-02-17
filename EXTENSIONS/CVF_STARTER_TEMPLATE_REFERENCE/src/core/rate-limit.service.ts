// @reference-only — This module is not wired into the main execution pipeline.
// src/core/rate-limit.service.ts

export class RateLimitService {
  private requests = new Map<string, { count: number; windowStart: number }>();
  private readonly windowMs: number;

  constructor(windowMs: number = 60_000) {
    this.windowMs = windowMs;
  }

  check(ip: string, limit = 50) {
    const now = Date.now();
    const entry = this.requests.get(ip);

    if (!entry || now - entry.windowStart > this.windowMs) {
      // Start new window
      this.requests.set(ip, { count: 1, windowStart: now });
      return;
    }

    if (entry.count >= limit) {
      throw new Error("Rate limit exceeded");
    }

    entry.count++;
  }

  reset() {
    this.requests.clear();
  }
}
