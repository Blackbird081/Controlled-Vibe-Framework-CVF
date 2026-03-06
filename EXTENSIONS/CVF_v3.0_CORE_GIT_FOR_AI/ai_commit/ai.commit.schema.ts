/**
 * AI Commit — Core Schema (CVF v3.0 — Layer 0 Foundation)
 *
 * The AI Commit is the fundamental primitive of CVF Core ("Git for AI Development").
 * Every change produced by an AI agent MUST be expressed as an AICommit.
 *
 * Mapping to Git:
 *   Git commit   → AICommit
 *   commit hash  → commit_id (SHA-256 of deterministic payload)
 *   author       → agent_id
 *   tree hash    → artifact_snapshot (hash ledger of all artifacts)
 *   parent       → parent_commit_id
 *   message      → rationale
 *   diff         → artifacts[] (list of changed/added artifacts)
 *
 * Design principles (De_xuat_10 — AI-COMMIT SPEC):
 *   1. Every AI action producing output must create exactly one AICommit.
 *   2. commit_id is deterministic — same inputs → same hash.
 *   3. Commits are immutable once created (append-only ledger).
 *   4. Lineage is preserved via parent_commit_id chain.
 *   5. Commits are typed to distinguish planning from implementation.
 */

export type CommitType =
    | "SPEC"          // AI produced a specification artifact
    | "DESIGN"        // AI produced an architecture/design artifact
    | "IMPLEMENT"     // AI produced implementation code
    | "TEST"          // AI produced test artifacts
    | "REVIEW"        // AI performed a review and produced findings
    | "REFACTOR"      // AI refactored existing code
    | "FIX"           // AI fixed a defect
    | "GOVERNANCE"    // AI performed a governance/audit action
    | "ROLLBACK";     // AI rolled back to a previous state

export type CommitStatus =
    | "PENDING"       // Produced but not yet governance-validated
    | "VALIDATED"     // Passed governance gate
    | "REJECTED"      // Failed governance gate
    | "SUPERSEDED";   // A newer commit replaces this one

export interface ArtifactRef {
    /** Artifact type (e.g. "feature.spec", "state.machine") */
    type: string;
    /** Path relative to project root */
    path: string;
    /** SHA-256 content hash — ensures artifact identity stability */
    contentHash: string;
    /** Operation: what the AI did to this artifact */
    operation: "CREATE" | "MODIFY" | "DELETE" | "READ";
}

export interface AICommit {
    /** Deterministic commit identifier: SHA-256 of (agent_id + timestamp + artifacts) */
    commit_id: string;

    /** Unique identifier of the AI agent that produced this commit */
    agent_id: string;

    /** Skill or capability the agent was exercising when producing this commit */
    skill: string;

    /** Type of commit — what kind of AI action was taken */
    type: CommitType;

    /** Human-readable description of WHY the AI made this decision */
    rationale: string;

    /** Phase of the CVF pipeline in which this commit was produced */
    phase: string;

    /** SHA-256 snapshot of all artifacts at time of commit (like Git tree hash) */
    artifact_snapshot: string;

    /** All artifacts involved in this commit */
    artifacts: ArtifactRef[];

    /** Parent commit ID for lineage tracking (null = root commit) */
    parent_commit_id: string | null;

    /** ISO 8601 timestamp of commit creation */
    timestamp: string;

    /** Governance validation status */
    status: CommitStatus;

    /** If status is REJECTED, this contains the governance findings */
    rejection_reason?: string;

    /** Optional: commit tags for filtering and search */
    tags?: string[];
}

/**
 * Minimal AICommit for creation (before commit_id is computed)
 */
export type AICommitInput = Omit<AICommit, "commit_id" | "status" | "timestamp" | "artifact_snapshot">;
