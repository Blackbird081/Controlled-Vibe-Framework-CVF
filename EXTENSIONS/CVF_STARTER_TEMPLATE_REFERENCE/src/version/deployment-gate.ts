// @reference-only — This module is not wired into the main execution pipeline.
// src/version/deployment-gate.ts

import { FreezeMetadata } from "./freeze-metadata";

export class DeploymentGate {
  validate(metadata: FreezeMetadata) {
    if (!metadata.certified) {
      throw new Error("Deployment blocked: Not certified.");
    }

    if (!metadata.cvfVersion) {
      throw new Error("Deployment blocked: Missing CVF version.");
    }
  }
}
