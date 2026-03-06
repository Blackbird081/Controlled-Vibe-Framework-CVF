/**
 * CVF Core — Index (v3.0 Layer 0 Foundation Primitives)
 *
 * CVF Core = "Git for AI Development"
 *
 * 3+1 Primitives:
 *   1. Commit   — AI Commit (ai_commit/)
 *   2. Artifact — Staging + Ledger (artifact_staging/ + artifact_ledger/)
 *   3. Process  — Phase-driven development workflow (process_model/)
 *   +1 Staging  — Git index equivalent (part of Artifact primitive)
 *
 * Design invariants (De_xuat_12 — INV-A to INV-E):
 *   INV-A: AI must produce commits (no direct repo changes)
 *   INV-B: Artifact identity must be stable (path-independent artifact_id)
 *   INV-C: Process transitions must be deterministic (gate-required advances)
 *   INV-D: Governance must be deterministic (GOVERNANCE_PIPELINE order)
 *   INV-E: Verification must be pluggable (not hardcoded in core)
 *
 * CVF Core target audience: AI development teams
 * CVF Full target audience: Enterprise, AI safety, regulated industries
 *   CVF Full = CVF Core + Verification Plugins + Observability (v1.1.x + v1.2.x + ...)
 */

// ── Primitive 1: Commit ───────────────────────────────────────────────────────
export type {
    AICommit,
    AICommitInput,
    ArtifactRef,
    CommitType,
    CommitStatus,
} from "./ai_commit/ai.commit.schema.js";

export {
    createCommit,
    parseCommit,
    verifyCommitIntegrity,
} from "./ai_commit/ai.commit.parser.js";

export type {
    CommitValidationResult,
    CommitViolation,
} from "./ai_commit/ai.commit.validator.js";

export { validateCommit } from "./ai_commit/ai.commit.validator.js";

// ── Primitive 2+1: Artifact + Staging ────────────────────────────────────────
export type {
    StagedArtifact,
    StagingStatus,
} from "./artifact_staging/artifact.staging.js";

export { ArtifactStagingArea } from "./artifact_staging/artifact.staging.js";

export type { LedgerEntry } from "./artifact_ledger/artifact.ledger.js";

export { ArtifactLedger } from "./artifact_ledger/artifact.ledger.js";

// ── Primitive 3: Process ──────────────────────────────────────────────────────
export type {
    CVFProcess,
    ProcessStatus,
    ProcessTransition,
} from "./process_model/process.model.js";

export { ProcessModel } from "./process_model/process.model.js";
