// @reference-only — This module is not wired into the main execution pipeline.
// src/version/freeze-metadata.ts

export interface FreezeMetadata {
  cvfVersion: string;
  buildHash: string;
  frozenAt: string;
  certified: boolean;
}

export function createFreezeMetadata(
  version: string,
  hash: string,
  certified: boolean
): FreezeMetadata {
  return {
    cvfVersion: version,
    buildHash: hash,
    frozenAt: new Date().toISOString(),
    certified
  };
}
