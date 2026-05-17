// src/core/execution-lock.ts

export class ExecutionLock {
  private activeExecutions = new Map<string, number>();
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = 30_000) {
    this.timeoutMs = timeoutMs;
  }

  acquire(key: string) {
    const existing = this.activeExecutions.get(key);

    if (existing) {
      // Auto-release if timed out
      if (Date.now() - existing > this.timeoutMs) {
        this.activeExecutions.delete(key);
      } else {
        throw new Error("Execution already in progress");
      }
    }

    this.activeExecutions.set(key, Date.now());
  }

  release(key: string) {
    this.activeExecutions.delete(key);
  }
}
