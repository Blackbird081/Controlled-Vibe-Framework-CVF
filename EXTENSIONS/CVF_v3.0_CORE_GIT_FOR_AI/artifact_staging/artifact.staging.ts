/**
 * Artifact Staging (CVF v3.0 — Layer 0)
 *
 * Implements the Artifact Staging model — equivalent to Git's staging area (index).
 *
 * Mapping to Git:
 *   git add <file>       → stageArtifact()     (moves to CANDIDATE)
 *   git commit           → acceptArtifact()    (moves to ACCEPTED after governance)
 *   git reset HEAD <file>→ unstageArtifact()   (reverts to CANDIDATE or removes)
 *
 * State machine (INV-C compliant — deterministic transitions):
 *
 *   CANDIDATE ──→ IN_GOVERNANCE ──→ ACCEPTED
 *       ↑               │               │
 *       └───────── REJECTED ←───────────┘
 *                       │
 *                   (can retry → CANDIDATE)
 *
 * Design (De_xuat_06 / docs/CVF vs Git — Artifact Staging):
 *   - An artifact starts as CANDIDATE when an AI agent produces it.
 *   - The governance pipeline moves it to IN_GOVERNANCE.
 *   - After governance approval, it becomes ACCEPTED (immutable in ledger).
 *   - Rejection returns it to CANDIDATE for revision or discards it.
 */

import * as crypto from "crypto";

export type StagingStatus =
    | "CANDIDATE"      // Produced by agent, awaiting governance
    | "IN_GOVERNANCE"  // Currently being evaluated by governance pipeline
    | "ACCEPTED"       // Passed governance — will be committed to ledger
    | "REJECTED";      // Failed governance — must be revised or discarded

export interface StagedArtifact {
    /** Stable artifact identifier — path-independent */
    artifact_id: string;
    /** Artifact type (e.g. "feature.spec") */
    type: string;
    /** Filesystem path */
    path: string;
    /** SHA-256 content hash */
    contentHash: string;
    /** Current staging status */
    status: StagingStatus;
    /** ISO 8601 timestamp of when artifact was staged */
    staged_at: string;
    /** ISO 8601 timestamp of last status change */
    updated_at: string;
    /** If REJECTED, describes why */
    rejection_reason?: string;
    /** Governance run ID that last evaluated this artifact */
    governance_run_id?: string;
}

// ─── ArtifactStagingArea ──────────────────────────────────────────────────────

export class ArtifactStagingArea {
    private staged = new Map<string, StagedArtifact>();

    /**
     * stageArtifact()
     * Adds an artifact to the staging area as CANDIDATE.
     * artifact_id is computed as SHA-256 of (type + path) — path-stable identity.
     */
    public stageArtifact(type: string, path: string, content: string): StagedArtifact {
        const contentHash = crypto.createHash("sha256").update(content, "utf8").digest("hex");
        const artifact_id = crypto
            .createHash("sha256")
            .update(`${type}:${path}`, "utf8")
            .digest("hex");

        const now = new Date().toISOString();

        const staged: StagedArtifact = {
            artifact_id,
            type,
            path,
            contentHash,
            status: "CANDIDATE",
            staged_at: now,
            updated_at: now,
        };

        this.staged.set(artifact_id, staged);
        return staged;
    }

    /**
     * submitToGovernance()
     * Moves artifact from CANDIDATE to IN_GOVERNANCE.
     * Called when the governance pipeline starts evaluating.
     */
    public submitToGovernance(artifact_id: string, governance_run_id: string): void {
        const artifact = this.getOrThrow(artifact_id);
        if (artifact.status !== "CANDIDATE") {
            throw new Error(
                `Artifact "${artifact_id}" is ${artifact.status} — only CANDIDATE can be submitted to governance`
            );
        }
        artifact.status = "IN_GOVERNANCE";
        artifact.governance_run_id = governance_run_id;
        artifact.updated_at = new Date().toISOString();
    }

    /**
     * acceptArtifact()
     * Moves artifact from IN_GOVERNANCE to ACCEPTED.
     * Signals it is ready to be committed to the Artifact Ledger.
     */
    public acceptArtifact(artifact_id: string): void {
        const artifact = this.getOrThrow(artifact_id);
        if (artifact.status !== "IN_GOVERNANCE") {
            throw new Error(
                `Artifact "${artifact_id}" is ${artifact.status} — only IN_GOVERNANCE can be accepted`
            );
        }
        artifact.status = "ACCEPTED";
        artifact.updated_at = new Date().toISOString();
    }

    /**
     * rejectArtifact()
     * Moves artifact from IN_GOVERNANCE to REJECTED with a reason.
     */
    public rejectArtifact(artifact_id: string, reason: string): void {
        const artifact = this.getOrThrow(artifact_id);
        if (artifact.status !== "IN_GOVERNANCE") {
            throw new Error(
                `Artifact "${artifact_id}" is ${artifact.status} — only IN_GOVERNANCE can be rejected`
            );
        }
        artifact.status = "REJECTED";
        artifact.rejection_reason = reason;
        artifact.updated_at = new Date().toISOString();
    }

    /**
     * unstageArtifact()
     * Removes a CANDIDATE artifact from the staging area.
     * Like `git reset HEAD <file>`.
     */
    public unstageArtifact(artifact_id: string): void {
        const artifact = this.getOrThrow(artifact_id);
        if (artifact.status !== "CANDIDATE") {
            throw new Error(
                `Can only unstage CANDIDATE artifacts — "${artifact_id}" is ${artifact.status}`
            );
        }
        this.staged.delete(artifact_id);
    }

    public getArtifact(artifact_id: string): StagedArtifact | undefined {
        return this.staged.get(artifact_id);
    }

    public getAllByStatus(status: StagingStatus): StagedArtifact[] {
        return [...this.staged.values()].filter((a) => a.status === status);
    }

    public getAll(): StagedArtifact[] {
        return [...this.staged.values()];
    }

    private getOrThrow(artifact_id: string): StagedArtifact {
        const artifact = this.staged.get(artifact_id);
        if (!artifact) {
            throw new Error(`Artifact "${artifact_id}" not found in staging area`);
        }
        return artifact;
    }
}
