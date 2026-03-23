/**
 * CVF ECO v2.0 Agent Guard SDK — Audit Logger Dedicated Tests (W6-T38)
 * =====================================================================
 * GC-023: dedicated file — never merge into agent.guard.test.ts.
 *
 * Coverage:
 *   resetAuditCounter / nextAuditId:
 *     - resetAuditCounter() resets counter so first log produces "AUD-000001"
 *     - sequential logs produce incrementing IDs ("AUD-000001", "AUD-000002", ...)
 *   AuditLogger.log:
 *     - returns AuditEntry with id, sessionId, decision, timestamp
 *     - id format is "AUD-NNNNNN" (6-digit padded)
 *     - sessionId from argument propagated
 *     - decision from argument propagated
 *     - timestamp is a positive number
 *   AuditLogger.getAll:
 *     - empty logger → getAll() returns []
 *     - after log() calls → returns all entries in order
 *   AuditLogger.getBySession:
 *     - returns only entries for matching sessionId
 *     - returns [] when no entries match
 *   AuditLogger.getByVerdict:
 *     - returns only entries matching decision.verdict
 *     - returns [] when no entries match
 *   AuditLogger.getByRiskLevel:
 *     - returns only entries matching decision.riskLevel
 *     - returns [] when no entries match
 *   AuditLogger.count:
 *     - returns 0 for empty logger
 *     - returns number of logged entries
 *   AuditLogger.clear:
 *     - removes all entries (count=0 after clear)
 *   AuditLogger.exportJSON:
 *     - returns valid JSON string
 *     - JSON parses to array matching entries
 */

import { describe, it, expect, beforeEach } from "vitest";

import {
  AuditLogger,
  resetAuditCounter,
} from "../src/audit.logger";
import type { GovernanceDecision } from "../src/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeDecision(overrides: Partial<GovernanceDecision> = {}): GovernanceDecision {
  return {
    action: {
      agentId: "agent-1",
      action: "read",
      target: "resource-1",
      domain: "general",
      params: {},
    },
    verdict: "ALLOW",
    riskLevel: "R0",
    riskScore: 0,
    violations: [],
    warnings: [],
    reasoning: [],
    policyMatches: [],
    timestamp: Date.now(),
    durationMs: 5,
    ...overrides,
  };
}

// ─── resetAuditCounter / ID sequencing ───────────────────────────────────────

describe("resetAuditCounter and AuditLogger ID sequencing", () => {
  beforeEach(() => {
    resetAuditCounter();
  });

  it("first log after reset produces 'AUD-000001'", () => {
    const logger = new AuditLogger();
    const entry = logger.log("sess-1", makeDecision());
    expect(entry.id).toBe("AUD-000001");
  });

  it("sequential logs produce incrementing IDs", () => {
    const logger = new AuditLogger();
    const e1 = logger.log("sess-1", makeDecision());
    const e2 = logger.log("sess-1", makeDecision());
    const e3 = logger.log("sess-1", makeDecision());
    expect(e1.id).toBe("AUD-000001");
    expect(e2.id).toBe("AUD-000002");
    expect(e3.id).toBe("AUD-000003");
  });
});

// ─── AuditLogger.log ─────────────────────────────────────────────────────────

describe("AuditLogger.log", () => {
  beforeEach(() => resetAuditCounter());

  it("returns AuditEntry with correct id, sessionId, decision, timestamp", () => {
    const logger = new AuditLogger();
    const decision = makeDecision({ verdict: "BLOCK" });
    const entry = logger.log("sess-abc", decision);
    expect(entry.id).toBe("AUD-000001");
    expect(entry.sessionId).toBe("sess-abc");
    expect(entry.decision).toBe(decision);
    expect(typeof entry.timestamp).toBe("number");
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it("id format is 'AUD-NNNNNN' with 6-digit padding", () => {
    const logger = new AuditLogger();
    const entry = logger.log("s", makeDecision());
    expect(entry.id).toMatch(/^AUD-\d{6}$/);
  });
});

// ─── AuditLogger.getAll ───────────────────────────────────────────────────────

describe("AuditLogger.getAll", () => {
  beforeEach(() => resetAuditCounter());

  it("empty logger → getAll() returns []", () => {
    expect(new AuditLogger().getAll()).toEqual([]);
  });

  it("returns all entries in insertion order", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision());
    logger.log("s2", makeDecision());
    const all = logger.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].sessionId).toBe("s1");
    expect(all[1].sessionId).toBe("s2");
  });

  it("getAll() returns a copy (not internal reference)", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision());
    const all = logger.getAll();
    all.pop();
    expect(logger.count()).toBe(1); // internal unchanged
  });
});

// ─── AuditLogger.getBySession ─────────────────────────────────────────────────

describe("AuditLogger.getBySession", () => {
  beforeEach(() => resetAuditCounter());

  it("returns only entries for matching sessionId", () => {
    const logger = new AuditLogger();
    logger.log("sess-A", makeDecision());
    logger.log("sess-B", makeDecision());
    logger.log("sess-A", makeDecision());
    const results = logger.getBySession("sess-A");
    expect(results).toHaveLength(2);
    expect(results.every((e) => e.sessionId === "sess-A")).toBe(true);
  });

  it("returns [] when no entries match", () => {
    const logger = new AuditLogger();
    logger.log("sess-A", makeDecision());
    expect(logger.getBySession("sess-X")).toEqual([]);
  });
});

// ─── AuditLogger.getByVerdict ────────────────────────────────────────────────

describe("AuditLogger.getByVerdict", () => {
  beforeEach(() => resetAuditCounter());

  it("returns only entries with matching verdict", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision({ verdict: "ALLOW" }));
    logger.log("s2", makeDecision({ verdict: "BLOCK" }));
    logger.log("s3", makeDecision({ verdict: "ALLOW" }));
    const allowed = logger.getByVerdict("ALLOW");
    expect(allowed).toHaveLength(2);
    expect(allowed.every((e) => e.decision.verdict === "ALLOW")).toBe(true);
  });

  it("returns [] when no entries match verdict", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision({ verdict: "ALLOW" }));
    expect(logger.getByVerdict("BLOCK")).toEqual([]);
  });
});

// ─── AuditLogger.getByRiskLevel ──────────────────────────────────────────────

describe("AuditLogger.getByRiskLevel", () => {
  beforeEach(() => resetAuditCounter());

  it("returns only entries with matching riskLevel", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision({ riskLevel: "R0" }));
    logger.log("s2", makeDecision({ riskLevel: "R3" }));
    logger.log("s3", makeDecision({ riskLevel: "R3" }));
    const highRisk = logger.getByRiskLevel("R3");
    expect(highRisk).toHaveLength(2);
  });

  it("returns [] when no entries match riskLevel", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision({ riskLevel: "R0" }));
    expect(logger.getByRiskLevel("R3")).toEqual([]);
  });
});

// ─── AuditLogger.count / clear ───────────────────────────────────────────────

describe("AuditLogger.count and clear", () => {
  beforeEach(() => resetAuditCounter());

  it("count() = 0 for empty logger", () => {
    expect(new AuditLogger().count()).toBe(0);
  });

  it("count() = number of logged entries", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision());
    logger.log("s2", makeDecision());
    expect(logger.count()).toBe(2);
  });

  it("clear() removes all entries", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision());
    logger.log("s2", makeDecision());
    logger.clear();
    expect(logger.count()).toBe(0);
    expect(logger.getAll()).toEqual([]);
  });
});

// ─── AuditLogger.exportJSON ──────────────────────────────────────────────────

describe("AuditLogger.exportJSON", () => {
  beforeEach(() => resetAuditCounter());

  it("returns valid JSON string", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision());
    expect(() => JSON.parse(logger.exportJSON())).not.toThrow();
  });

  it("JSON parses to array matching entries", () => {
    const logger = new AuditLogger();
    logger.log("s1", makeDecision({ verdict: "WARN" }));
    const parsed = JSON.parse(logger.exportJSON());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].sessionId).toBe("s1");
    expect(parsed[0].decision.verdict).toBe("WARN");
  });

  it("empty logger → exports '[]'", () => {
    expect(JSON.parse(new AuditLogger().exportJSON())).toEqual([]);
  });
});
