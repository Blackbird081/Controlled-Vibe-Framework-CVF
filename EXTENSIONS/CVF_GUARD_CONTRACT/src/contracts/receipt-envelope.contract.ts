/**
 * CVF Phase 1.R — Canonical Receipt<TPayload> Envelope Contract
 * ==============================================================
 * Defines the canonical receipt envelope that unifies gateway receipts,
 * skill audit records, governance ledgers, and evidence receipts as typed
 * payload variants of a single envelope shape.
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1R_RECEIPT_ENVELOPE_2026-05-18.md
 *
 * SCOPE: Envelope specification and adapter map only.
 *   No existing receipt interface renamed or deleted (Phase 2.B).
 *   No evidence producer or reader changed.
 *   No long-term ledger archiving or multi-tenant audit scope.
 *
 * Design principle: Receipt<TPayload> is a structural envelope.
 *   The payload type T is always a named interface, never `any`.
 *   Envelope fields (id, issuedAt, source, payload) are invariant across domains.
 *   All existing interfaces (GatewayReceipt, SkillAuditReceipt, etc.) become
 *   payload types — they are NOT deleted or renamed in Phase 1.R.
 */

// ─── Canonical Envelope ───────────────────────────────────────────────────────

/**
 * The canonical receipt envelope.
 * TPayload must be a named domain-specific payload interface.
 *
 * All Phase 1.0 receipt surfaces map to a Receipt<TPayload> where TPayload
 * is the existing interface. Phase 2.B wire-up will update producers to
 * wrap their payloads in this envelope.
 */
export interface Receipt<TPayload> {
  /** Unique receipt identifier (UUID or deterministic hash). */
  readonly id: string;
  /** ISO-8601 timestamp when this receipt was issued. */
  readonly issuedAt: string;
  /** Source domain or producer identifier. */
  readonly source: string;
  /** Receipt schema version — semver string. */
  readonly schemaVersion: string;
  /** The typed payload this receipt wraps. */
  readonly payload: TPayload;
  /** Optional integrity hash of the serialized payload. */
  readonly integrityHash?: string;
}

export interface ReceiptEnvelopeInput<TPayload> {
  readonly id: string;
  readonly issuedAt: string;
  readonly source: string;
  readonly payload: TPayload;
  readonly integrityHash?: string;
}

/**
 * Create the canonical Phase 1.R receipt envelope around an existing typed
 * receipt payload. This helper preserves legacy payload readers because the
 * original receipt remains intact under `payload`.
 */
export function createReceiptEnvelope<TPayload>(
  input: ReceiptEnvelopeInput<TPayload>,
): Receipt<TPayload> {
  return {
    id: input.id,
    issuedAt: input.issuedAt,
    source: input.source,
    schemaVersion: RECEIPT_SCHEMA_VERSION_1R,
    payload: input.payload,
    integrityHash: input.integrityHash,
  };
}

export interface ReceiptEnvelopeReceiptRecord<TPayload> {
  readonly tierId: 'receipt';
  readonly immutable: true;
  readonly envelope: Receipt<TPayload>;
}

/**
 * Marks an existing receipt envelope as an immutable receipt-tier record
 * without introducing a storage backend.
 */
export function createReceiptEnvelopeReceiptRecord<TPayload>(
  envelope: Receipt<TPayload>,
): ReceiptEnvelopeReceiptRecord<TPayload> {
  return {
    tierId: 'receipt',
    immutable: true,
    envelope,
  };
}

// ─── Payload Type Registry ────────────────────────────────────────────────────

/**
 * Documented payload types from Phase 1.0 receipt inventory.
 * Each is a placeholder structural type — existing implementations remain
 * authoritative until Phase 2.B adapts producers.
 *
 * These are NOT new interfaces — they document the payload types that
 * correspond to the existing receipt surfaces in the drift inventory.
 */

/** Gateway receipt payload — from CVF_MODEL_GATEWAY/src/gateway-receipt.ts */
export interface GatewayReceiptPayload {
  readonly requestId: string;
  readonly modelId: string;
  readonly providerId: string;
  readonly riskLevel: string;
  readonly decision: string;
  readonly latencyMs?: number;
}

/** Execution bridge receipt payload — from CVF_EXECUTION_PLANE_FOUNDATION */
export interface ExecutionBridgeReceiptPayload {
  readonly executionId: string;
  readonly skillId: string;
  readonly phase: string;
  readonly outcome: 'success' | 'failure' | 'partial';
  readonly governedBy?: string;
}

/** Governance ledger receipt payload — from CVF_CONTROL_PLANE_FOUNDATION */
export interface GovernanceLedgerReceiptPayload {
  readonly sessionId: string;
  readonly agentId: string;
  readonly action: string;
  readonly policyDecision: string;
  readonly riskLevel: string;
  readonly evidence?: ReadonlyArray<{ rule: string; source: string }>;
}

/** Controlled memory receipt payload — from CVF_LEARNING_PLANE_FOUNDATION */
export interface ControlledMemoryReceiptPayload {
  readonly memoryId: string;
  readonly tierId: string;
  readonly operation: 'read' | 'write' | 'evict';
  readonly agentId: string;
}

// ─── Typed Receipt Aliases ────────────────────────────────────────────────────

/** A gateway model call receipt. */
export type GatewayReceipt = Receipt<GatewayReceiptPayload>;

/** An execution plane operation receipt. */
export type ExecutionBridgeReceipt = Receipt<ExecutionBridgeReceiptPayload>;

/** A governance ledger entry receipt. */
export type GovernanceLedgerReceipt = Receipt<GovernanceLedgerReceiptPayload>;

/** A controlled memory access receipt. */
export type ControlledMemoryReceipt = Receipt<ControlledMemoryReceiptPayload>;

// ─── Compatibility Plan ───────────────────────────────────────────────────────

/**
 * Reader/writer compatibility plan for Phase 1.R → Phase 2.B migration.
 *
 * PROTECTION: All existing evidence readers are protected by not changing
 * the payload shape — existing receipt interfaces map to TPayload fields.
 *
 * MIGRATION ORDER (Phase 2.B):
 *   1. Producers wrap existing interface in Receipt<T> envelope
 *   2. New readers consume Receipt<T>; old readers continue to work via
 *      envelope.payload which preserves existing field structure
 *   3. Legacy readers are adapted — not deleted — in Phase 2.B
 *
 * INVARIANT: schemaVersion "1.R.0" marks all Phase 1.R-classified receipts.
 *   Consumers must check schemaVersion before parsing payload fields.
 */
export const RECEIPT_SCHEMA_VERSION_1R = '1.R.0' as const;

// ─── Adapter Meta ─────────────────────────────────────────────────────────────

export interface ReceiptEnvelopeAdapterMeta {
  readonly adapterId: string;
  readonly domain: string;
  readonly sourcePath: string;
  readonly payloadType: string;
  readonly disposition: 'canonical_contract' | 'adapter' | 'legacy_reference' | 'deprecate_candidate';
  readonly hasConformanceStub: boolean;
  readonly migrationNote?: string;
}
