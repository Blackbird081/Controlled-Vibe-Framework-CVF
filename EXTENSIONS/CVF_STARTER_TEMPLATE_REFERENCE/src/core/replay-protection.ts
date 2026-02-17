// src/core/replay-protection.ts

export class ReplayProtectionService {
  private usedNonces = new Set<string>();

  validateTimestamp(timestamp: number, maxAgeMs = 5 * 60 * 1000) {
    const now = Date.now();

    if (now - timestamp > maxAgeMs) {
      throw new Error("Request expired (replay detected)");
    }
  }

  validateNonce(nonce: string) {
    if (this.usedNonces.has(nonce)) {
      throw new Error("Nonce already used (replay detected)");
    }
    this.usedNonces.add(nonce);
  }

  validate(timestamp: number, nonce?: string, maxAgeMs = 5 * 60 * 1000) {
    this.validateTimestamp(timestamp, maxAgeMs);

    if (nonce) {
      this.validateNonce(nonce);
    }
  }
}
