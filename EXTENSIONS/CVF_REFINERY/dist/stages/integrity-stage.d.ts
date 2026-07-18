import type { RefineryStage } from "../pipeline/stage.js";
/** Deterministic content hash: SHA-256 over stably key-sorted JSON. No randomness or wall-clock input. */
export declare function computeContentHash(records: Array<Record<string, unknown>>): string;
export declare const integrityStage: RefineryStage;
