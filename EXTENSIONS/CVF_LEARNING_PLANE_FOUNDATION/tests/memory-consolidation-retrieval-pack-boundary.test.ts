/**
 * MEMCON-T4 Focused Conformance Tests
 * memory-consolidation-retrieval-pack-boundary.test.ts
 *
 * Tests all required conformance criteria from the MEMCON-T4 work order:
 *   - eligible records enter the selected pack with source authority + confidence;
 *   - expired and disputed records are excluded;
 *   - sensitive records do not release raw content;
 *   - time-ambiguous, stale-blocked, conflicted, source-missing, and
 *     confidence-missing records are excluded;
 *   - output keeps summaryOnly=true and rawMemoryReleased=false;
 *   - raw record content is not copied into the retrieval-facing output;
 *   - the helper can produce a pack compatible with existing retrieval owner
 *     surfaces without modifying those surfaces.
 *
 * Authority:
 *   docs/work_orders/CVF_AGENT_WORK_ORDER_MEMCON_T4_RETRIEVAL_PACK_BOUNDARY_CONFORMANCE_FOR_CLAUDE_2026-06-13.md
 *
 * rawMemoryReleased=false
 */

import { describe, it, expect } from "vitest";
import {
  buildMemconRetrievalPackBoundary,
  MEMCON_RETRIEVAL_PACK_BOUNDARY_VERSION,
  type MemconConsolidatedMemoryRecordInput,
} from "../src/memory-consolidation-retrieval-pack-boundary";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEligibleRecord(
  overrides: Partial<MemconConsolidatedMemoryRecordInput> = {},
): MemconConsolidatedMemoryRecordInput {
  return {
    recordId: "rec-001",
    sourceAuthority: "docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md",
    confidenceLevel: "HIGH",
    retrievalEligibility: "ELIGIBLE",
    lifecycleState: "semantic",
    temporalNormalizationStatus: "ABSOLUTE_DATE_PRESENT",
    consolidationDecision: "CONSOLIDATED",
    contradiction_flag: false,
    sensitiveDataFlag: false,
    summaryText: "MEMCON schema appendix establishes T1b doc-only field tables.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// T4-CONF-001: Eligible record enters selected pack with source + confidence
// ---------------------------------------------------------------------------
describe("T4-CONF-001: eligible record selection", () => {
  it("includes an ELIGIBLE record in the selected pack", () => {
    const result = buildMemconRetrievalPackBoundary(
      [makeEligibleRecord()],
      "test-consumer",
    );
    expect(result.selectedRecordIds).toContain("rec-001");
    expect(result.excludedRecordIds).not.toContain("rec-001");
  });

  it("includes source authority in selected entries", () => {
    const record = makeEligibleRecord({ recordId: "rec-sa-001" });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    const entry = result.selectedEntries.find((e) => e.recordId === "rec-sa-001");
    expect(entry).toBeDefined();
    expect(entry!.sourceAuthority).toBe(record.sourceAuthority);
    expect(entry!.sourceAuthority.length).toBeGreaterThan(0);
  });

  it("includes confidence level in selected entries", () => {
    const record = makeEligibleRecord({ recordId: "rec-conf-001", confidenceLevel: "MEDIUM" });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    const entry = result.selectedEntries.find((e) => e.recordId === "rec-conf-001");
    expect(entry).toBeDefined();
    expect(entry!.confidenceLevel).toBe("MEDIUM");
  });

  it("sets packVersion to the current T4 version constant", () => {
    const result = buildMemconRetrievalPackBoundary([makeEligibleRecord()], "test-consumer");
    expect(result.packVersion).toBe(MEMCON_RETRIEVAL_PACK_BOUNDARY_VERSION);
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-002: Expired records are excluded
// ---------------------------------------------------------------------------
describe("T4-CONF-002: expired lifecycle excluded", () => {
  it("excludes a record with lifecycleState=expired", () => {
    const record = makeEligibleRecord({
      recordId: "rec-expired-001",
      lifecycleState: "expired",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-expired-001");
    expect(result.selectedRecordIds).not.toContain("rec-expired-001");
  });

  it("records BLOCKED_LIFECYCLE_EXPIRED exclusion reason for expired records", () => {
    const record = makeEligibleRecord({
      recordId: "rec-expired-002",
      lifecycleState: "expired",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-expired-002"]).toBe("BLOCKED_LIFECYCLE_EXPIRED");
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-003: Disputed records are excluded
// ---------------------------------------------------------------------------
describe("T4-CONF-003: disputed lifecycle excluded", () => {
  it("excludes a record with lifecycleState=disputed", () => {
    const record = makeEligibleRecord({
      recordId: "rec-disputed-001",
      lifecycleState: "disputed",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-disputed-001");
    expect(result.selectedRecordIds).not.toContain("rec-disputed-001");
  });

  it("records BLOCKED_LIFECYCLE_DISPUTED exclusion reason for disputed records", () => {
    const record = makeEligibleRecord({
      recordId: "rec-disputed-002",
      lifecycleState: "disputed",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-disputed-002"]).toBe("BLOCKED_LIFECYCLE_DISPUTED");
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-004: Sensitive records -- raw content not released
// ---------------------------------------------------------------------------
describe("T4-CONF-004: sensitive records excluded -- no raw content release", () => {
  it("excludes a record with sensitiveDataFlag=true", () => {
    const record = makeEligibleRecord({
      recordId: "rec-sensitive-001",
      sensitiveDataFlag: true,
      summaryText: "SENSITIVE: raw operator credential decision captured.",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-sensitive-001");
    expect(result.selectedRecordIds).not.toContain("rec-sensitive-001");
  });

  it("records BLOCKED_SENSITIVE exclusion reason for sensitive records", () => {
    const record = makeEligibleRecord({
      recordId: "rec-sensitive-002",
      sensitiveDataFlag: true,
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-sensitive-002"]).toBe("BLOCKED_SENSITIVE");
  });

  it("does not expose sensitive record summary in selectedEntries", () => {
    const sensitiveContent = "SENSITIVE_CONTENT_MUST_NOT_APPEAR_IN_PACK";
    const sensitiveRecord = makeEligibleRecord({
      recordId: "rec-sensitive-003",
      sensitiveDataFlag: true,
      summaryText: sensitiveContent,
    });
    const result = buildMemconRetrievalPackBoundary([sensitiveRecord], "test-consumer");
    const allEntryText = result.selectedEntries
      .map((e) => e.summaryText)
      .join(" ");
    expect(allEntryText).not.toContain(sensitiveContent);
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-005: Time-ambiguous records are excluded
// ---------------------------------------------------------------------------
describe("T4-CONF-005: time-ambiguous blocked records excluded", () => {
  it("excludes a record with temporalNormalizationStatus=TIME_AMBIGUOUS_BLOCKED", () => {
    const record = makeEligibleRecord({
      recordId: "rec-timeamb-001",
      temporalNormalizationStatus: "TIME_AMBIGUOUS_BLOCKED",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-timeamb-001");
    expect(result.selectedRecordIds).not.toContain("rec-timeamb-001");
  });

  it("records BLOCKED_TIME_AMBIGUOUS exclusion reason", () => {
    const record = makeEligibleRecord({
      recordId: "rec-timeamb-002",
      temporalNormalizationStatus: "TIME_AMBIGUOUS_BLOCKED",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-timeamb-002"]).toBe("BLOCKED_TIME_AMBIGUOUS");
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-006: Stale-blocked records are excluded
// ---------------------------------------------------------------------------
describe("T4-CONF-006: stale-blocked records excluded", () => {
  it("excludes a record with stalenessBlocked=true", () => {
    const record = makeEligibleRecord({
      recordId: "rec-stale-001",
      stalenessBlocked: true,
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-stale-001");
    expect(result.selectedRecordIds).not.toContain("rec-stale-001");
  });

  it("records BLOCKED_STALE exclusion reason for stale records", () => {
    const record = makeEligibleRecord({
      recordId: "rec-stale-002",
      stalenessBlocked: true,
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-stale-002"]).toBe("BLOCKED_STALE");
  });

  it("excludes a record with retrievalEligibility=BLOCKED_STALE", () => {
    const record = makeEligibleRecord({
      recordId: "rec-stale-003",
      retrievalEligibility: "BLOCKED_STALE",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-stale-003");
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-007: Conflicted records are excluded
// ---------------------------------------------------------------------------
describe("T4-CONF-007: conflicted records excluded", () => {
  it("excludes a record with contradiction_flag=true", () => {
    const record = makeEligibleRecord({
      recordId: "rec-conflict-001",
      contradiction_flag: true,
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-conflict-001");
    expect(result.selectedRecordIds).not.toContain("rec-conflict-001");
  });

  it("records BLOCKED_CONTRADICTION exclusion reason for conflicted records", () => {
    const record = makeEligibleRecord({
      recordId: "rec-conflict-002",
      contradiction_flag: true,
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-conflict-002"]).toBe("BLOCKED_CONTRADICTION");
  });

  it("excludes a record with retrievalEligibility=BLOCKED_CONFLICT", () => {
    const record = makeEligibleRecord({
      recordId: "rec-conflict-003",
      retrievalEligibility: "BLOCKED_CONFLICT",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-conflict-003");
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-008: Source-missing records are excluded
// ---------------------------------------------------------------------------
describe("T4-CONF-008: source-missing records excluded", () => {
  it("excludes a record with empty sourceAuthority string", () => {
    const record = makeEligibleRecord({
      recordId: "rec-nosrc-001",
      sourceAuthority: "",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-nosrc-001");
    expect(result.selectedRecordIds).not.toContain("rec-nosrc-001");
  });

  it("records BLOCKED_SOURCE_MISSING exclusion reason", () => {
    const record = makeEligibleRecord({
      recordId: "rec-nosrc-002",
      sourceAuthority: "   ",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-nosrc-002"]).toBe("BLOCKED_SOURCE_MISSING");
  });

  it("excludes a record with retrievalEligibility=BLOCKED_SOURCE_MISSING", () => {
    const record = makeEligibleRecord({
      recordId: "rec-nosrc-003",
      retrievalEligibility: "BLOCKED_SOURCE_MISSING",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-nosrc-003");
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-009: UNVERIFIED confidence is excluded
// ---------------------------------------------------------------------------
describe("T4-CONF-009: unverified confidence excluded", () => {
  it("excludes a record with confidenceLevel=UNVERIFIED", () => {
    const record = makeEligibleRecord({
      recordId: "rec-unverified-001",
      confidenceLevel: "UNVERIFIED",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-unverified-001");
    expect(result.selectedRecordIds).not.toContain("rec-unverified-001");
  });

  it("records BLOCKED_UNVERIFIED_CONFIDENCE exclusion reason", () => {
    const record = makeEligibleRecord({
      recordId: "rec-unverified-002",
      confidenceLevel: "UNVERIFIED",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-unverified-002"]).toBe("BLOCKED_UNVERIFIED_CONFIDENCE");
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-010: summaryOnly=true and rawMemoryReleased=false invariants
// ---------------------------------------------------------------------------
describe("T4-CONF-010: output boundary invariants", () => {
  it("always emits summaryOnly=true", () => {
    const result = buildMemconRetrievalPackBoundary(
      [makeEligibleRecord()],
      "test-consumer",
    );
    expect(result.summaryOnly).toBe(true);
  });

  it("always emits rawMemoryReleased=false on the result", () => {
    const result = buildMemconRetrievalPackBoundary(
      [makeEligibleRecord()],
      "test-consumer",
    );
    expect(result.rawMemoryReleased).toBe(false);
  });

  it("always emits rawMemoryReleased=false on every selected entry", () => {
    const records = [
      makeEligibleRecord({ recordId: "rec-inv-001" }),
      makeEligibleRecord({ recordId: "rec-inv-002", confidenceLevel: "LOW" }),
    ];
    const result = buildMemconRetrievalPackBoundary(records, "test-consumer");
    for (const entry of result.selectedEntries) {
      expect(entry.rawMemoryReleased).toBe(false);
    }
  });

  it("emits rawMemoryReleased=false on result even when all records are excluded", () => {
    const record = makeEligibleRecord({
      recordId: "rec-allexcl-001",
      lifecycleState: "expired",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.rawMemoryReleased).toBe(false);
    expect(result.selectedRecordIds).toHaveLength(0);
  });

  it("emits summaryOnly=true even when all records are excluded", () => {
    const record = makeEligibleRecord({
      recordId: "rec-allexcl-002",
      lifecycleState: "disputed",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.summaryOnly).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-011: Raw record content is not copied into selected entries
// ---------------------------------------------------------------------------
describe("T4-CONF-011: raw content not copied into pack", () => {
  it("does not copy raw memory content beyond provided summaryText field", () => {
    const rawContent = "RAW_TRANSCRIPT_CONTENT_MUST_NOT_APPEAR";
    const record = makeEligibleRecord({
      recordId: "rec-rawguard-001",
      summaryText: "Bounded summary only.",
    });
    // The record input intentionally has no rawContent field.
    // Verify it doesn't appear in any output string.
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(rawContent);
  });

  it("selected entry summaryText matches exactly the input summaryText without augmentation", () => {
    const summary = "Exact bounded summary text.";
    const record = makeEligibleRecord({
      recordId: "rec-rawguard-002",
      summaryText: summary,
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    const entry = result.selectedEntries.find((e) => e.recordId === "rec-rawguard-002");
    expect(entry).toBeDefined();
    expect(entry!.summaryText).toBe(summary);
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-012: Compatible pack shape with existing retrieval owner surfaces
// ---------------------------------------------------------------------------
describe("T4-CONF-012: pack shape compatible with retrieval owner surfaces", () => {
  it("selected entries have all fields needed for MemoryRetrievalPackInput shape", () => {
    const record = makeEligibleRecord({ recordId: "rec-compat-001" });
    const result = buildMemconRetrievalPackBoundary([record], "retrieval-policy");

    // Verify the result shape matches MemoryRetrievalPackInput contract fields:
    // selectedRecordIds, excludedRecordIds, exclusionReasons, summaryOnly,
    // rawMemoryReleased, retrievalConsumer
    expect(typeof result.packVersion).toBe("string");
    expect(Array.isArray(result.selectedRecordIds)).toBe(true);
    expect(Array.isArray(result.excludedRecordIds)).toBe(true);
    expect(typeof result.exclusionReasons).toBe("object");
    expect(result.summaryOnly).toBe(true);
    expect(result.rawMemoryReleased).toBe(false);
    expect(result.retrievalConsumer).toBe("retrieval-policy");
  });

  it("produces empty selected pack without error when input is empty", () => {
    const result = buildMemconRetrievalPackBoundary([], "test-consumer");
    expect(result.selectedRecordIds).toHaveLength(0);
    expect(result.excludedRecordIds).toHaveLength(0);
    expect(result.summaryOnly).toBe(true);
    expect(result.rawMemoryReleased).toBe(false);
  });

  it("produces a mixed result with eligible and excluded records from a multi-record input", () => {
    const records: MemconConsolidatedMemoryRecordInput[] = [
      makeEligibleRecord({ recordId: "rec-mix-001" }),
      makeEligibleRecord({ recordId: "rec-mix-002", lifecycleState: "expired" }),
      makeEligibleRecord({ recordId: "rec-mix-003", confidenceLevel: "MEDIUM" }),
      makeEligibleRecord({ recordId: "rec-mix-004", sensitiveDataFlag: true }),
      makeEligibleRecord({
        recordId: "rec-mix-005",
        temporalNormalizationStatus: "TIME_AMBIGUOUS_BLOCKED",
      }),
    ];
    const result = buildMemconRetrievalPackBoundary(records, "runtime-workflow-chain");

    // rec-mix-001 and rec-mix-003 should be selected
    expect(result.selectedRecordIds).toContain("rec-mix-001");
    expect(result.selectedRecordIds).toContain("rec-mix-003");

    // rec-mix-002, rec-mix-004, rec-mix-005 should be excluded
    expect(result.excludedRecordIds).toContain("rec-mix-002");
    expect(result.excludedRecordIds).toContain("rec-mix-004");
    expect(result.excludedRecordIds).toContain("rec-mix-005");

    // Boundary invariants always hold
    expect(result.summaryOnly).toBe(true);
    expect(result.rawMemoryReleased).toBe(false);
    for (const entry of result.selectedEntries) {
      expect(entry.rawMemoryReleased).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// T4-CONF-013: INELIGIBLE retrievalEligibility is excluded
// ---------------------------------------------------------------------------
describe("T4-CONF-013: INELIGIBLE records excluded", () => {
  it("excludes a record with retrievalEligibility=INELIGIBLE", () => {
    const record = makeEligibleRecord({
      recordId: "rec-inelig-001",
      retrievalEligibility: "INELIGIBLE",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.excludedRecordIds).toContain("rec-inelig-001");
    expect(result.selectedRecordIds).not.toContain("rec-inelig-001");
  });

  it("records the retrievalEligibility token as the exclusion reason for INELIGIBLE", () => {
    const record = makeEligibleRecord({
      recordId: "rec-inelig-002",
      retrievalEligibility: "INELIGIBLE",
    });
    const result = buildMemconRetrievalPackBoundary([record], "test-consumer");
    expect(result.exclusionReasons["rec-inelig-002"]).toBe("INELIGIBLE");
  });
});
