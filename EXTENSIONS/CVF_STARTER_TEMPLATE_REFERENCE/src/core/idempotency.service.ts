// src/core/idempotency.service.ts

import crypto from "crypto";

export class IdempotencyService {
  private store = new Map<string, number>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  generateKey(payload: unknown): string {
    const raw = JSON.stringify(payload);
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  ensureNotProcessed(key: string) {
    const timestamp = this.store.get(key);

    if (timestamp) {
      if (Date.now() - timestamp < this.ttlMs) {
        throw new Error("Duplicate request detected (idempotent)");
      }
      // Expired — allow reprocessing
      this.store.delete(key);
    }
  }

  markProcessed(key: string) {
    this.store.set(key, Date.now());
    this.cleanup();
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.store.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.store.delete(key);
      }
    }
  }
}
