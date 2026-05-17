// @reference-only — This module is not wired into the main execution pipeline.
// src/cvf/quarantine.service.ts

export class QuarantineService {
  isolate(contextId: string, reason: string) {
    console.error("Execution quarantined:", contextId, reason);
  }
}
