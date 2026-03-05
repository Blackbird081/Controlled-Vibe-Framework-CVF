// CVF v1.9 — Deterministic Hash
// Produces the same commitHash from the same inputs — always.
// Verified by replay validator: if inputs differ, hash differs → drift detected.

import { createHash } from 'crypto'

/**
 * Compute a deterministic commit hash.
 * Identical to v1.8 computeCommitHash — v1.9 formalizes this as the canonical formula.
 *
 * Formula: SHA-256(executionId:riskHash:mutationFingerprint:snapshotId)
 * Truncated to 32 hex chars.
 */
export function computeDeterministicHash(
    executionId: string,
    riskHash: string,
    mutationFingerprint: string,
    snapshotId: string
): string {
    const payload = `${executionId}:${riskHash}:${mutationFingerprint}:${snapshotId}`
    return createHash('sha256').update(payload).digest('hex').slice(0, 32)
}

/**
 * Verify that a recorded hash matches re-computation from stored components.
 */
export function verifyHash(
    recordedHash: string,
    executionId: string,
    riskHash: string,
    mutationFingerprint: string,
    snapshotId: string
): boolean {
    const recomputed = computeDeterministicHash(
        executionId,
        riskHash,
        mutationFingerprint,
        snapshotId
    )
    return recomputed === recordedHash
}
