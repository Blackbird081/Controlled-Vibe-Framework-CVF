import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION,
  GovernanceCLI,
  GovernanceGraph,
  GovernanceKernel,
  Constitution,
  createGovernanceExpansionFoundationSurface,
  describeGovernanceExpansionFoundation,
  WatchdogPulseContract,
  createWatchdogPulseContract,
  WatchdogAlertLogContract,
  createWatchdogAlertLogContract,
  GovernanceAuditSignalContract,
  createGovernanceAuditSignalContract,
  GovernanceAuditLogContract,
  createGovernanceAuditLogContract,
} from "../src/index";
import type { WatchdogObservabilityInput, WatchdogExecutionInput, WatchdogAlertLog } from "../src/index";
import type { GovernanceAuditSignal } from "../src/index";

describe("CVF_GOVERNANCE_EXPANSION_FOUNDATION", () => {
  it("creates a governance expansion foundation surface with all 4 modules", () => {
    const surface = createGovernanceExpansionFoundationSurface();

    expect(surface.coordination.executionClass).toBe("coordination package");
    expect(surface.coordination.trancheId).toBe("W3-T1");
    expect(surface.coordination.preservesLineage).toBe(true);
    expect(surface.cli.available).toBe(true);
    expect(surface.cli.instance).toBeInstanceOf(GovernanceCLI);
    expect(surface.graph.available).toBe(true);
    expect(surface.graph.instance).toBeInstanceOf(GovernanceGraph);
    expect(surface.kernel.evaluator).toBe(GovernanceKernel);
    expect(surface.kernel.constitution).toBe(Constitution);
  });

  it("describes the foundation as a CP1 review surface", () => {
    const summary = describeGovernanceExpansionFoundation();

    expect(summary.trancheId).toBe("W3-T1");
    expect(summary.controlPointId).toBe("CP1");
    expect(summary.cliAvailable).toBe(true);
    expect(summary.graphAvailable).toBe(true);
    expect(summary.kernelAvailable).toBe(true);
    expect(summary.textSurface).toContain("CVF W3-T1 CP1 Governance Expansion Foundation Shell");
    expect(summary.markdownSurface).toContain("## Source Modules");
    expect(summary.markdownSurface).toContain("## Already Consolidated");
    expect(summary.markdownSurface).toContain("## Deferred Targets");
  });

  it("records already-consolidated and deferred governance targets", () => {
    expect(GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.alreadyConsolidated).toHaveLength(2);
    expect(GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.deferredTargets).toHaveLength(2);
    expect(GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.deferredTargets[0]).toContain("Watchdog");
    expect(GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.deferredTargets[1]).toContain("Consensus");
  });

  it("validates governance kernel evaluation", () => {
    const result = GovernanceKernel.evaluate({
      riskScore: 30,
      skillVerified: true,
      integrityPassed: true,
    });
    expect(result).toBe("APPROVED");

    const rejected = GovernanceKernel.evaluate({
      riskScore: 80,
      skillVerified: true,
      integrityPassed: true,
    });
    expect(rejected).toBe("REJECTED");
  });

  it("validates governance CLI instantiation", () => {
    const cli = new GovernanceCLI();
    expect(cli.getRegistry()).toBeTruthy();
    expect(cli.getParser()).toBeTruthy();
  });

  it("validates governance graph operations", () => {
    const graph = new GovernanceGraph();
    graph.addAgent("a1", "Agent 1");
    graph.addPolicy("p1", "Policy 1");
    graph.connect("a1", "p1", "depends_on");

    const analysis = graph.analyze();
    expect(analysis.nodeCount).toBe(2);
    expect(analysis.edgeCount).toBe(1);
  });

  // ─── W3-T2 CP1 — WatchdogPulseContract ───────────────────────────────────

  describe("W3-T2 CP1 — WatchdogPulseContract", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";

    function makeObs(
      dominantHealth: WatchdogObservabilityInput["dominantHealth"],
      id = "snap-001",
    ): WatchdogObservabilityInput {
      return {
        snapshotId: id,
        dominantHealth,
        criticalCount: dominantHealth === "CRITICAL" ? 1 : 0,
        degradedCount: dominantHealth === "DEGRADED" ? 1 : 0,
      };
    }

    function makeExec(
      dominantStatus: WatchdogExecutionInput["dominantStatus"],
      id = "sum-001",
    ): WatchdogExecutionInput {
      return {
        summaryId: id,
        dominantStatus,
        failedCount: dominantStatus === "FAILED" ? 1 : 0,
        runningCount: dominantStatus === "RUNNING" ? 1 : 0,
      };
    }

    it("returns CRITICAL when observability dominantHealth is CRITICAL", () => {
      const contract = createWatchdogPulseContract();
      const pulse = contract.pulse(makeObs("CRITICAL"), makeExec("COMPLETED"));

      expect(pulse.watchdogStatus).toBe("CRITICAL");
    });

    it("returns CRITICAL when execution dominantStatus is FAILED", () => {
      const contract = createWatchdogPulseContract();
      const pulse = contract.pulse(makeObs("HEALTHY"), makeExec("FAILED"));

      expect(pulse.watchdogStatus).toBe("CRITICAL");
    });

    it("returns WARNING when observability is DEGRADED (no CRITICAL)", () => {
      const contract = createWatchdogPulseContract();
      const pulse = contract.pulse(makeObs("DEGRADED"), makeExec("COMPLETED"));

      expect(pulse.watchdogStatus).toBe("WARNING");
    });

    it("returns WARNING when execution is RUNNING (no CRITICAL)", () => {
      const contract = createWatchdogPulseContract();
      const pulse = contract.pulse(makeObs("HEALTHY"), makeExec("RUNNING"));

      expect(pulse.watchdogStatus).toBe("WARNING");
    });

    it("returns NOMINAL when observability is HEALTHY and execution is COMPLETED", () => {
      const contract = createWatchdogPulseContract();
      const pulse = contract.pulse(makeObs("HEALTHY"), makeExec("COMPLETED"));

      expect(pulse.watchdogStatus).toBe("NOMINAL");
    });

    it("traces source IDs to input snapshotId and summaryId", () => {
      const contract = createWatchdogPulseContract();
      const obs = makeObs("HEALTHY", "snap-xyz");
      const exec = makeExec("COMPLETED", "sum-xyz");
      const pulse = contract.pulse(obs, exec);

      expect(pulse.sourceObservabilitySnapshotId).toBe("snap-xyz");
      expect(pulse.sourceExecutionSummaryId).toBe("sum-xyz");
    });

    it("produces stable pulseHash with fixed time injection", () => {
      const c1 = createWatchdogPulseContract({ now: () => fixedTime });
      const c2 = createWatchdogPulseContract({ now: () => fixedTime });

      expect(c1.pulse(makeObs("HEALTHY"), makeExec("COMPLETED")).pulseHash).toBe(
        c2.pulse(makeObs("HEALTHY"), makeExec("COMPLETED")).pulseHash,
      );
    });

    it("creates WatchdogPulseContract via class constructor", () => {
      const contract = new WatchdogPulseContract();
      expect(contract).toBeInstanceOf(WatchdogPulseContract);
    });
  });

  // ─── W3-T2 CP2 — WatchdogAlertLogContract ────────────────────────────────

  describe("W3-T2 CP2 — WatchdogAlertLogContract", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";

    function makePulse(
      status: "NOMINAL" | "WARNING" | "CRITICAL" | "UNKNOWN",
      id = "p1",
    ): ReturnType<WatchdogPulseContract["pulse"]> {
      return {
        pulseId: id,
        issuedAt: fixedTime,
        sourceObservabilitySnapshotId: `snap-${id}`,
        sourceExecutionSummaryId: `sum-${id}`,
        watchdogStatus: status,
        statusRationale: `Test pulse ${id}`,
        pulseHash: `hash-${id}`,
      };
    }

    it("returns UNKNOWN dominantStatus and alertActive=false for empty pulses", () => {
      const contract = createWatchdogAlertLogContract();
      const log = contract.log([]);

      expect(log.dominantStatus).toBe("UNKNOWN");
      expect(log.alertActive).toBe(false);
      expect(log.totalPulses).toBe(0);
    });

    it("returns CRITICAL as dominant when any CRITICAL pulse present", () => {
      const contract = createWatchdogAlertLogContract();
      const log = contract.log([
        makePulse("NOMINAL", "p1"),
        makePulse("CRITICAL", "p2"),
        makePulse("WARNING", "p3"),
      ]);

      expect(log.dominantStatus).toBe("CRITICAL");
      expect(log.alertActive).toBe(true);
    });

    it("returns alertActive=true when dominantStatus is WARNING", () => {
      const contract = createWatchdogAlertLogContract();
      const log = contract.log([makePulse("WARNING", "p1"), makePulse("NOMINAL", "p2")]);

      expect(log.alertActive).toBe(true);
    });

    it("returns alertActive=false when dominantStatus is NOMINAL", () => {
      const contract = createWatchdogAlertLogContract();
      const log = contract.log([makePulse("NOMINAL", "p1"), makePulse("NOMINAL", "p2")]);

      expect(log.alertActive).toBe(false);
      expect(log.dominantStatus).toBe("NOMINAL");
    });

    it("counts all status types correctly", () => {
      const contract = createWatchdogAlertLogContract();
      const log = contract.log([
        makePulse("CRITICAL", "p1"),
        makePulse("WARNING", "p2"),
        makePulse("NOMINAL", "p3"),
        makePulse("UNKNOWN", "p4"),
      ]);

      expect(log.criticalCount).toBe(1);
      expect(log.warningCount).toBe(1);
      expect(log.nominalCount).toBe(1);
      expect(log.unknownCount).toBe(1);
      expect(log.totalPulses).toBe(4);
    });

    it("produces stable logHash with fixed time injection", () => {
      const c1 = createWatchdogAlertLogContract({ now: () => fixedTime });
      const c2 = createWatchdogAlertLogContract({ now: () => fixedTime });
      const pulses = [makePulse("NOMINAL", "p1"), makePulse("WARNING", "p2")];

      expect(c1.log(pulses).logHash).toBe(c2.log(pulses).logHash);
    });

    it("summary is non-empty for any input", () => {
      const contract = createWatchdogAlertLogContract();
      expect(contract.log([]).summary.length).toBeGreaterThan(0);
      expect(contract.log([makePulse("CRITICAL")]).summary.length).toBeGreaterThan(0);
    });

    it("creates WatchdogAlertLogContract via class constructor", () => {
      const contract = new WatchdogAlertLogContract();
      expect(contract).toBeInstanceOf(WatchdogAlertLogContract);
    });
  });

  // ─── W3-T3 CP1 — GovernanceAuditSignalContract ───────────────────────────

  describe("W3-T3 CP1 — GovernanceAuditSignalContract", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";

    function makeAlertLog(
      overrides: Partial<WatchdogAlertLog> = {},
    ): WatchdogAlertLog {
      return {
        logId: "log-001",
        createdAt: fixedTime,
        totalPulses: 2,
        criticalCount: 0,
        warningCount: 0,
        nominalCount: 2,
        unknownCount: 0,
        dominantStatus: "NOMINAL",
        alertActive: false,
        summary: "Test alert log",
        logHash: "hash-log-001",
        ...overrides,
      };
    }

    it("returns CRITICAL_THRESHOLD when dominantStatus is CRITICAL and criticalCount >= 1", () => {
      const contract = createGovernanceAuditSignalContract();
      const signal = contract.signal(
        makeAlertLog({ dominantStatus: "CRITICAL", criticalCount: 2, alertActive: true }),
      );

      expect(signal.auditTrigger).toBe("CRITICAL_THRESHOLD");
    });

    it("returns ALERT_ACTIVE when alertActive is true and not CRITICAL_THRESHOLD", () => {
      const contract = createGovernanceAuditSignalContract();
      const signal = contract.signal(
        makeAlertLog({ dominantStatus: "WARNING", alertActive: true, criticalCount: 0 }),
      );

      expect(signal.auditTrigger).toBe("ALERT_ACTIVE");
    });

    it("returns ROUTINE when totalPulses > 0 and no active alert", () => {
      const contract = createGovernanceAuditSignalContract();
      const signal = contract.signal(
        makeAlertLog({ totalPulses: 3, alertActive: false, dominantStatus: "NOMINAL" }),
      );

      expect(signal.auditTrigger).toBe("ROUTINE");
    });

    it("returns NO_ACTION when totalPulses is 0", () => {
      const contract = createGovernanceAuditSignalContract();
      const signal = contract.signal(
        makeAlertLog({ totalPulses: 0, alertActive: false, dominantStatus: "UNKNOWN" }),
      );

      expect(signal.auditTrigger).toBe("NO_ACTION");
    });

    it("traces sourceAlertLogId to input alertLog.logId", () => {
      const contract = createGovernanceAuditSignalContract();
      const log = makeAlertLog({ logId: "log-xyz" });
      const signal = contract.signal(log);

      expect(signal.sourceAlertLogId).toBe("log-xyz");
    });

    it("triggerRationale is non-empty for all trigger types", () => {
      const contract = createGovernanceAuditSignalContract();
      for (const log of [
        makeAlertLog({ dominantStatus: "CRITICAL", criticalCount: 1, alertActive: true }),
        makeAlertLog({ dominantStatus: "WARNING", alertActive: true, criticalCount: 0 }),
        makeAlertLog({ totalPulses: 1, alertActive: false }),
        makeAlertLog({ totalPulses: 0 }),
      ]) {
        expect(contract.signal(log).triggerRationale.length).toBeGreaterThan(0);
      }
    });

    it("produces stable signalHash with fixed time injection", () => {
      const c1 = createGovernanceAuditSignalContract({ now: () => fixedTime });
      const c2 = createGovernanceAuditSignalContract({ now: () => fixedTime });
      const log = makeAlertLog({ dominantStatus: "NOMINAL" });

      expect(c1.signal(log).signalHash).toBe(c2.signal(log).signalHash);
    });

    it("creates GovernanceAuditSignalContract via class constructor", () => {
      const contract = new GovernanceAuditSignalContract();
      expect(contract).toBeInstanceOf(GovernanceAuditSignalContract);
    });
  });

  // ─── W3-T3 CP2 — GovernanceAuditLogContract ──────────────────────────────

  describe("W3-T3 CP2 — GovernanceAuditLogContract", () => {
    const fixedTime = "2026-03-22T10:00:00.000Z";

    function makeSignal(
      trigger: "CRITICAL_THRESHOLD" | "ALERT_ACTIVE" | "ROUTINE" | "NO_ACTION",
      id = "s1",
    ): GovernanceAuditSignal {
      return {
        signalId: id,
        issuedAt: fixedTime,
        sourceAlertLogId: `log-${id}`,
        auditTrigger: trigger,
        triggerRationale: `Test rationale ${id}`,
        signalHash: `hash-${id}`,
      };
    }

    it("returns NO_ACTION dominantTrigger and auditRequired=false for empty signals", () => {
      const contract = createGovernanceAuditLogContract();
      const log = contract.log([]);

      expect(log.dominantTrigger).toBe("NO_ACTION");
      expect(log.auditRequired).toBe(false);
      expect(log.totalSignals).toBe(0);
    });

    it("returns CRITICAL_THRESHOLD as dominant when any CRITICAL_THRESHOLD present", () => {
      const contract = createGovernanceAuditLogContract();
      const log = contract.log([
        makeSignal("ROUTINE", "s1"),
        makeSignal("CRITICAL_THRESHOLD", "s2"),
        makeSignal("ALERT_ACTIVE", "s3"),
      ]);

      expect(log.dominantTrigger).toBe("CRITICAL_THRESHOLD");
      expect(log.auditRequired).toBe(true);
    });

    it("returns auditRequired=true when dominantTrigger is ALERT_ACTIVE", () => {
      const contract = createGovernanceAuditLogContract();
      const log = contract.log([makeSignal("ALERT_ACTIVE", "s1"), makeSignal("ROUTINE", "s2")]);

      expect(log.auditRequired).toBe(true);
    });

    it("returns auditRequired=false when dominantTrigger is ROUTINE", () => {
      const contract = createGovernanceAuditLogContract();
      const log = contract.log([makeSignal("ROUTINE", "s1"), makeSignal("NO_ACTION", "s2")]);

      expect(log.auditRequired).toBe(false);
    });

    it("counts all trigger types correctly", () => {
      const contract = createGovernanceAuditLogContract();
      const log = contract.log([
        makeSignal("CRITICAL_THRESHOLD", "s1"),
        makeSignal("ALERT_ACTIVE", "s2"),
        makeSignal("ROUTINE", "s3"),
        makeSignal("NO_ACTION", "s4"),
      ]);

      expect(log.criticalThresholdCount).toBe(1);
      expect(log.alertActiveCount).toBe(1);
      expect(log.routineCount).toBe(1);
      expect(log.noActionCount).toBe(1);
      expect(log.totalSignals).toBe(4);
    });

    it("produces stable logHash with fixed time injection", () => {
      const c1 = createGovernanceAuditLogContract({ now: () => fixedTime });
      const c2 = createGovernanceAuditLogContract({ now: () => fixedTime });
      const signals = [makeSignal("ROUTINE", "s1"), makeSignal("NO_ACTION", "s2")];

      expect(c1.log(signals).logHash).toBe(c2.log(signals).logHash);
    });

    it("summary is non-empty for any input", () => {
      const contract = createGovernanceAuditLogContract();
      expect(contract.log([]).summary.length).toBeGreaterThan(0);
      expect(contract.log([makeSignal("CRITICAL_THRESHOLD")]).summary.length).toBeGreaterThan(0);
    });

    it("creates GovernanceAuditLogContract via class constructor", () => {
      const contract = new GovernanceAuditLogContract();
      expect(contract).toBeInstanceOf(GovernanceAuditLogContract);
    });
  });
});
