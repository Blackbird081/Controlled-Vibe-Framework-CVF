// @reference-only — This module is not wired into the main execution pipeline.
// src/utils/api-key-rotation.ts

export class ApiKeyRotation {
  private keys: string[];
  private index = 0;

  constructor(keys: string[]) {
    if (!keys || keys.length === 0) {
      throw new Error("At least one API key is required");
    }

    // Filter out empty/undefined keys
    this.keys = keys.filter((k) => k && k.trim().length > 0);

    if (this.keys.length === 0) {
      throw new Error("No valid API keys provided");
    }
  }

  next(): string {
    const key = this.keys[this.index];
    this.index = (this.index + 1) % this.keys.length;
    return key;
  }

  count(): number {
    return this.keys.length;
  }
}
