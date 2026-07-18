// CVF MAO-T4 - Reviewer Isolation Contract
//
// Implements the isolated reviewer source packet, excluded-context manifest,
// evidence recomputation contract, and self-approval guard defined by
// docs/reference/multi_agent_orchestration/CVF_MAO_RUNTIME_FOUNDATION_CONTRACT.md
// ("Task / Role / State Lifecycle" steps 7-8, "Threat And Failure Model"
// "Self-approval" row) and the reviewReceipt shape in
// CVF_MAO_RUNTIME_FOUNDATION_SCHEMA.json. The reviewer must derive authority
// from an isolated source packet and recomputed evidence, never from worker
// conclusions. Self-approval fails closed: the reviewer identity must not
// equal the worker identity, and reviewer evidence must not depend on worker
// output files. Local execution-plane module only; no provider, queue, UI, or
// runtime caller.

import { computeDeterministicHash } from "../../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

/**
 * An immutable packet of source paths the reviewer uses to independently
 * verify the work. Worker output files are explicitly excluded from this
 * manifest so the reviewer cannot treat worker conclusions as authority.
 */
export interface MaoIsolatedSourcePacket {
  readonly packetHash: string;
  readonly sourceManifest: readonly string[];
  readonly excludedContext: readonly MaoExcludedContextEntry[];
  readonly builtAt: string;
}

/**
 * A single excluded source path and the reason it was removed from the
 * reviewer's source manifest.
 */
export interface MaoExcludedContextEntry {
  readonly path: string;
  readonly reason: string;
}

/**
 * The full contract a reviewer receives: an isolated source packet, plus
 * identifiers of the worker output and invocation receipts under review
 * (but not their content).
 */
export interface MaoReviewerSourceContract {
  readonly packet: MaoIsolatedSourcePacket;
  readonly workerOutputReceiptId: string;
  readonly invocationReceiptId: string;
}

/**
 * Result of a self-approval guard check. `ok: false` means the review
 * cannot proceed because the reviewer would be approving their own work
 * or relying on worker output as evidence.
 */
export interface MaoSelfApprovalCheck {
  readonly ok: boolean;
  readonly reason?: string;
}

/**
 * Reviewer-produced evidence, bound to a specific isolated source packet
 * hash so it cannot be surreptitiously reused against a different packet.
 */
export interface MaoRecomputedEvidence {
  readonly packetHash: string;
  readonly evidenceItems: readonly string[];
  readonly recomputedAt: string;
}

// --- Isolated source packet builder ---

/**
 * Build a deterministic isolated source packet for a reviewer. Worker
 * output paths are stripped from the source manifest and listed as excluded
 * context entries instead. The packet hash depends only on the effective
 * (non-excluded) sources and the build timestamp, so two packets built from
 * the same sources at the same time produce identical hashes.
 */
export function buildIsolatedSourcePacket(
  sourceManifest: readonly string[],
  workerOutputPaths: readonly string[],
  builtAt: string,
): MaoIsolatedSourcePacket {
  const excludedContext: MaoExcludedContextEntry[] = [];
  const effectiveSources: string[] = [];

  for (const path of sourceManifest) {
    if (workerOutputPaths.includes(path)) {
      excludedContext.push({ path, reason: "excluded: worker output must not become reviewer evidence" });
    } else {
      effectiveSources.push(path);
    }
  }

  const packetHash = computeDeterministicHash(
    "mao-t4-isolated-packet",
    ...[...effectiveSources].sort(),
    ...excludedContext.map((entry) => `${entry.path}:${entry.reason}`).sort(),
    builtAt,
  );

  return Object.freeze({
    packetHash,
    sourceManifest: Object.freeze([...effectiveSources]),
    excludedContext: Object.freeze(excludedContext.map((e) => Object.freeze(e))),
    builtAt,
  }) as MaoIsolatedSourcePacket;
}

/**
 * Verify that an isolated source packet's stored hash matches a re-derived
 * hash from the same source manifest and build timestamp. Returns false
 * when the packet has been tampered with after construction.
 */
export function verifyIsolatedSourcePacket(packet: MaoIsolatedSourcePacket): boolean {
  const recomputed = computeDeterministicHash(
    "mao-t4-isolated-packet",
    ...[...packet.sourceManifest].sort(),
    ...packet.excludedContext.map((entry) => `${entry.path}:${entry.reason}`).sort(),
    packet.builtAt,
  );
  return recomputed === packet.packetHash;
}

// --- Self-approval guard ---

/**
 * Reject review when the reviewer identity is the same as the worker
 * identity. Self-approval is always forbidden per the contract's Threat
 * And Failure Model "Self-approval" row.
 */
export function checkSelfApproval(
  workerIdentity: string,
  reviewerIdentity: string,
): MaoSelfApprovalCheck {
  if (!workerIdentity.trim() || !reviewerIdentity.trim()) {
    return { ok: false, reason: "worker and reviewer identities must both be non-empty" };
  }
  if (workerIdentity === reviewerIdentity) {
    return {
      ok: false,
      reason: `reviewer identity "${reviewerIdentity}" matches worker identity "${workerIdentity}"; self-approval is forbidden`,
    };
  }
  return { ok: true };
}

/**
 * Reject review when any reviewer evidence path overlaps with a worker
 * output path. The reviewer must recompute evidence from the isolated source
 * packet only; worker output must not become reviewer authority.
 */
export function checkEvidenceIndependence(
  evidencePaths: readonly string[],
  workerOutputPaths: readonly string[],
): MaoSelfApprovalCheck {
  const tainted = evidencePaths.filter((p) => workerOutputPaths.includes(p));
  if (tainted.length > 0) {
    return {
      ok: false,
      reason: `reviewer evidence depends on excluded worker output: ${tainted.join(", ")}`,
    };
  }
  return { ok: true };
}

// --- Evidence recomputation contract ---

/**
 * Build reviewer-recomputed evidence from an isolated source packet. Before
 * accepting the evidence, this function verifies the packet hash, confirms
 * the reviewer is not the same actor as the worker (self-approval guard),
 * and confirms no evidence path depends on worker output files. Returns
 * `null` with an error string on any rejection.
 */
export function buildRecomputedEvidence(
  packet: MaoIsolatedSourcePacket,
  reviewerIdentity: string,
  workerIdentity: string,
  evidenceItems: readonly string[],
  workerOutputPaths: readonly string[],
  recomputedAt: string,
): { evidence: MaoRecomputedEvidence | null; error: string | null } {
  if (!verifyIsolatedSourcePacket(packet)) {
    return { evidence: null, error: "isolated source packet hash verification failed; packet may be corrupted" };
  }

  const selfCheck = checkSelfApproval(workerIdentity, reviewerIdentity);
  if (!selfCheck.ok) {
    return { evidence: null, error: selfCheck.reason! };
  }

  const independenceCheck = checkEvidenceIndependence(evidenceItems, workerOutputPaths);
  if (!independenceCheck.ok) {
    return { evidence: null, error: independenceCheck.reason! };
  }

  if (evidenceItems.length === 0) {
    return { evidence: null, error: "reviewer must record at least one recomputed evidence item" };
  }

  const evidence: MaoRecomputedEvidence = Object.freeze({
    packetHash: packet.packetHash,
    evidenceItems: Object.freeze([...evidenceItems]),
    recomputedAt,
  });

  return { evidence, error: null };
}
