/**
 * AI Commit Parser (CVF v3.0 — Layer 0)
 *
 * Parses and creates AICommit objects.
 * Computes deterministic commit_id from commit payload.
 * Maintains immutability guarantees.
 */

import * as crypto from "crypto";
import {
    AICommit,
    AICommitInput,
    ArtifactRef,
    CommitStatus,
} from "./ai.commit.schema.js";

// ─── Deterministic ID computation ────────────────────────────────────────────

/**
 * computeCommitId()
 *
 * Produces a deterministic SHA-256 commit ID from stable fields.
 * Same agent + same artifacts + same rationale + same phase → same ID.
 * Timestamp is NOT included in the hash (it's metadata, not identity).
 */
function computeCommitId(input: AICommitInput): string {
    const payload = JSON.stringify({
        agent_id: input.agent_id,
        skill: input.skill,
        type: input.type,
        phase: input.phase,
        rationale: input.rationale,
        parent_commit_id: input.parent_commit_id ?? null,
        artifacts: input.artifacts
            .map((a) => `${a.type}:${a.path}:${a.contentHash}:${a.operation}`)
            .sort(), // sort ensures order-independence
    });

    return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * computeArtifactSnapshot()
 *
 * Produces a SHA-256 hash of all artifact hashes — equivalent to Git's tree hash.
 * Stable across commits if artifact set is unchanged.
 */
function computeArtifactSnapshot(artifacts: ArtifactRef[]): string {
    const sorted = [...artifacts]
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((a) => `${a.path}:${a.contentHash}`)
        .join("|");

    return crypto.createHash("sha256").update(sorted, "utf8").digest("hex");
}

// ─── createCommit ─────────────────────────────────────────────────────────────

/**
 * createCommit()
 *
 * Creates a new AICommit from an AICommitInput.
 * Computes commit_id, artifact_snapshot, and sets initial status to PENDING.
 *
 * The commit is IMMUTABLE after creation — to update, create a new commit
 * with the previous commit's ID as parent_commit_id.
 */
export function createCommit(input: AICommitInput): AICommit {
    const commit_id = computeCommitId(input);
    const artifact_snapshot = computeArtifactSnapshot(input.artifacts);
    const timestamp = new Date().toISOString();

    return {
        ...input,
        commit_id,
        artifact_snapshot,
        timestamp,
        status: "PENDING" as CommitStatus,
    };
}

// ─── parseCommit ──────────────────────────────────────────────────────────────

/**
 * parseCommit()
 *
 * Parses and validates a raw object as an AICommit.
 * Verifies structural integrity — does NOT re-compute commit_id.
 * Use verifyCommitIntegrity() to validate the commit_id.
 *
 * @throws Error if required fields are missing or invalid
 */
export function parseCommit(raw: unknown): AICommit {
    if (!raw || typeof raw !== "object") {
        throw new Error("AICommit: input must be an object");
    }

    const obj = raw as Record<string, unknown>;

    const required: (keyof AICommit)[] = [
        "commit_id",
        "agent_id",
        "skill",
        "type",
        "rationale",
        "phase",
        "artifact_snapshot",
        "artifacts",
        "parent_commit_id",
        "timestamp",
        "status",
    ];

    for (const field of required) {
        if (!(field in obj)) {
            throw new Error(`AICommit: missing required field "${field}"`);
        }
    }

    if (!Array.isArray(obj.artifacts)) {
        throw new Error("AICommit: artifacts must be an array");
    }

    for (const artifact of obj.artifacts as unknown[]) {
        if (typeof artifact !== "object" || !artifact) {
            throw new Error("AICommit: each artifact must be an object");
        }
        const a = artifact as Record<string, unknown>;
        for (const f of ["type", "path", "contentHash", "operation"]) {
            if (typeof a[f] !== "string") {
                throw new Error(`AICommit: artifact.${f} must be a string`);
            }
        }
    }

    return obj as unknown as AICommit;
}

// ─── verifyCommitIntegrity ────────────────────────────────────────────────────

/**
 * verifyCommitIntegrity()
 *
 * Re-computes the expected commit_id and compares against stored value.
 * Returns true if commit has not been tampered with.
 *
 * Note: timestamp is NOT part of the hash — integrity check ignores it.
 */
export function verifyCommitIntegrity(commit: AICommit): boolean {
    const input: AICommitInput = {
        agent_id: commit.agent_id,
        skill: commit.skill,
        type: commit.type,
        rationale: commit.rationale,
        phase: commit.phase,
        artifacts: commit.artifacts,
        parent_commit_id: commit.parent_commit_id,
        tags: commit.tags,
    };

    const expected = computeCommitId(input);
    return commit.commit_id === expected;
}
