import { createHash } from "node:crypto";

/**
 * One record per scenario, preserving observable state across all three
 * layer boundaries. This module maps and serializes only; it never
 * computes normalization, conflict resolution, trust, receipt hashing,
 * reference-state resolution, routing, dose, or lifecycle decisions -
 * every field below is copied verbatim from a real layer return value.
 */
export interface CanonicalScenarioEvidence {
  scenario_id: string;
  source: {
    source_id: string;
    source_type: string;
    scope: { organization: string; country: string | null; project: string | null; customer: string | null };
  };
  refinery: {
    refinery_packet_id: string;
    status: string;
    failure_tokens: string[];
    conflict_set_count: number;
    conflict_sets: unknown[];
  };
  kernel: {
    decision_id: string;
    decision: string;
    receipt_id: string;
    receipt_status: string;
    reference_id: string | null;
    reference_state: string | null;
  };
  flow: {
    package_id: string | null;
    routing_decision: string | null;
    dose: string | null;
    acknowledgement_state: string | null;
    delivery_succeeded: boolean;
    consumption_succeeded: boolean;
  };
  terminal_state: string;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sortedKeys = Object.keys(record).sort();
    const out: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      out[key] = canonicalize(record[key]);
    }
    return out;
  }
  return value;
}

/** Deterministic canonical JSON: stably key-sorted, no whitespace. */
export function toCanonicalJson(evidence: CanonicalScenarioEvidence): string {
  return JSON.stringify(canonicalize(evidence));
}

export function canonicalEvidenceHash(evidence: CanonicalScenarioEvidence): string {
  return `sha256:${createHash("sha256").update(toCanonicalJson(evidence)).digest("hex")}`;
}
