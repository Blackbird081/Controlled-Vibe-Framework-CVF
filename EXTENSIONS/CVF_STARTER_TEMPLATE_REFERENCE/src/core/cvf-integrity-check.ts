// @reference-only — This module is not wired into the main execution pipeline.
// src/core/cvf-integrity-check.ts

import fs from "fs";
import crypto from "crypto";

export class CVFIntegrityCheck {
  calculateChecksum(path: string): string {
    const content = fs.readFileSync(path, "utf8");
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  validate(expected: string, actual: string) {
    if (expected !== actual) {
      throw new Error("CVF core modified — integrity violation");
    }
  }
}
