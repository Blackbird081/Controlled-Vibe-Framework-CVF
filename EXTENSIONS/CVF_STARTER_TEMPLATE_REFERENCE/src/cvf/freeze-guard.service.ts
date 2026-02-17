// src/cvf/freeze-guard.service.ts

export class FreezeGuardService {
  private failureCount = 0;

  recordFailure() {
    this.failureCount++;
  }

  reset() {
    this.failureCount = 0;
  }

  check() {
    if (this.failureCount >= 3) {
      throw new Error("System frozen due to repeated failures.");
    }
  }
}
