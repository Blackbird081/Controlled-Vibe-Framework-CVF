/**
 * AI Commit Validator (CVF v3.0 — Layer 0)
 *
 * Validates AICommit objects against CVF governance rules.
 *
 * Validation rules (De_xuat_10 — AI-COMMIT SPEC):
 *   RULE-01: commit_id must match re-computed hash (integrity)
 *   RULE-02: agent_id must be non-empty
 *   RULE-03: artifacts must not be empty (at least 1 artifact per commit)
 *   RULE-04: all artifact contentHashes must be valid SHA-256 (64 hex chars)
 *   RULE-05: timestamp must be valid ISO 8601
 *   RULE-06: if parent_commit_id is present, it must be valid SHA-256
 *   RULE-07: PENDING commits cannot have rejection_reason
 *   RULE-08: REJECTED commits must have rejection_reason
 */

import { AICommit } from "./ai.commit.schema.js";
import { verifyCommitIntegrity } from "./ai.commit.parser.js";

export interface CommitValidationResult {
    valid: boolean;
    violations: CommitViolation[];
}

export interface CommitViolation {
    rule: string;
    field: string;
    message: string;
}

const SHA256_RE = /^[a-f0-9]{64}$/;
const ISO8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export function validateCommit(commit: AICommit): CommitValidationResult {
    const violations: CommitViolation[] = [];

    // RULE-01: integrity
    if (!verifyCommitIntegrity(commit)) {
        violations.push({
            rule: "RULE-01",
            field: "commit_id",
            message: "commit_id does not match re-computed hash — commit may have been tampered with",
        });
    }

    // RULE-02: agent_id non-empty
    if (!commit.agent_id || commit.agent_id.trim() === "") {
        violations.push({
            rule: "RULE-02",
            field: "agent_id",
            message: "agent_id must be a non-empty string",
        });
    }

    // RULE-03: artifacts non-empty
    if (!commit.artifacts || commit.artifacts.length === 0) {
        violations.push({
            rule: "RULE-03",
            field: "artifacts",
            message: "commit must reference at least one artifact",
        });
    }

    // RULE-04: all contentHashes valid SHA-256
    for (const artifact of commit.artifacts ?? []) {
        if (!SHA256_RE.test(artifact.contentHash)) {
            violations.push({
                rule: "RULE-04",
                field: `artifacts[${artifact.path}].contentHash`,
                message: `contentHash for "${artifact.path}" is not a valid SHA-256 hex string (64 chars)`,
            });
        }
    }

    // RULE-05: timestamp valid ISO 8601
    if (!ISO8601_RE.test(commit.timestamp)) {
        violations.push({
            rule: "RULE-05",
            field: "timestamp",
            message: "timestamp must be a valid ISO 8601 date-time string",
        });
    }

    // RULE-06: parent_commit_id must be valid SHA-256 if present
    if (
        commit.parent_commit_id !== null &&
        commit.parent_commit_id !== undefined &&
        !SHA256_RE.test(commit.parent_commit_id)
    ) {
        violations.push({
            rule: "RULE-06",
            field: "parent_commit_id",
            message: "parent_commit_id must be a valid SHA-256 hex string or null",
        });
    }

    // RULE-07: PENDING must not have rejection_reason
    if (commit.status === "PENDING" && commit.rejection_reason) {
        violations.push({
            rule: "RULE-07",
            field: "rejection_reason",
            message: "PENDING commits must not have a rejection_reason",
        });
    }

    // RULE-08: REJECTED must have rejection_reason
    if (
        commit.status === "REJECTED" &&
        (!commit.rejection_reason || commit.rejection_reason.trim() === "")
    ) {
        violations.push({
            rule: "RULE-08",
            field: "rejection_reason",
            message: "REJECTED commits must include a rejection_reason",
        });
    }

    return {
        valid: violations.length === 0,
        violations,
    };
}
