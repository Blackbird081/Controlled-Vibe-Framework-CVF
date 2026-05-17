// @reference-only — This module is not wired into the main execution pipeline.
// src/core/audit-integrity.ts

import crypto from "crypto";

export class AuditIntegrityService {
  generateHash(record: unknown): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(record))
      .digest("hex");
  }
}
